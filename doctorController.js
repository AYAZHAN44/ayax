const bcrypt = require("bcryptjs");
const db = require("../db/pool");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

exports.listDoctors = asyncHandler(async (_req, res) => {
  const { rows } = await db.query(
    `select d.id, u.full_name as name, d.specialization, d.tag, d.about,
            d.experience_years, d.patients_count, d.rating, d.photo_url, d.is_chief
     from doctors d
     join users u on u.id = d.user_id
     where u.is_active = true
     order by d.is_chief desc, u.full_name asc`
  );

  res.json({ doctors: rows });
});

exports.getDoctor = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `select d.id, u.full_name as name, d.specialization, d.tag, d.about,
            d.experience_years, d.patients_count, d.rating, d.photo_url, d.is_chief
     from doctors d
     join users u on u.id = d.user_id
     where d.id = $1 and u.is_active = true`,
    [req.params.id]
  );

  if (!rows[0]) {
    throw new HttpError(404, "Doctor not found");
  }

  res.json({ doctor: rows[0] });
});

exports.createDoctor = asyncHandler(async (req, res) => {
  const {
    fullName,
    login,
    password,
    specialization,
    tag,
    about,
    experienceYears = 0,
    patientsCount = 0,
    photoUrl
  } = req.body;

  if (!fullName || !login || !password || !specialization) {
    throw new HttpError(400, "fullName, login, password and specialization are required");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const client = await db.connect();

  try {
    await client.query("begin");
    const userResult = await client.query(
      `insert into users (role, full_name, login, password_hash)
       values ('doctor', $1, $2, $3)
       returning id, full_name`,
      [fullName.trim(), login.trim(), passwordHash]
    );

    const doctorResult = await client.query(
      `insert into doctors
       (user_id, specialization, tag, about, experience_years, patients_count, photo_url)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning id`,
      [
        userResult.rows[0].id,
        specialization,
        tag || null,
        about || null,
        experienceYears,
        patientsCount,
        photoUrl || null
      ]
    );

    await client.query("commit");
    res.status(201).json({ id: doctorResult.rows[0].id });
  } catch (error) {
    await client.query("rollback");
    if (error.code === "23505") {
      throw new HttpError(409, "Doctor login already exists");
    }
    throw error;
  } finally {
    client.release();
  }
});

exports.updateDoctor = asyncHandler(async (req, res) => {
  const {
    fullName,
    specialization,
    tag,
    about,
    experienceYears,
    patientsCount,
    photoUrl,
    isActive
  } = req.body;

  const client = await db.connect();

  try {
    await client.query("begin");

    const doctor = await client.query("select user_id from doctors where id = $1", [req.params.id]);
    if (!doctor.rows[0]) {
      throw new HttpError(404, "Doctor not found");
    }

    await client.query(
      `update users
       set full_name = coalesce($1, full_name),
           is_active = coalesce($2, is_active),
           updated_at = now()
       where id = $3`,
      [fullName || null, typeof isActive === "boolean" ? isActive : null, doctor.rows[0].user_id]
    );

    await client.query(
      `update doctors
       set specialization = coalesce($1, specialization),
           tag = coalesce($2, tag),
           about = coalesce($3, about),
           experience_years = coalesce($4, experience_years),
           patients_count = coalesce($5, patients_count),
           photo_url = coalesce($6, photo_url),
           updated_at = now()
       where id = $7`,
      [
        specialization || null,
        tag || null,
        about || null,
        experienceYears ?? null,
        patientsCount ?? null,
        photoUrl || null,
        req.params.id
      ]
    );

    await client.query("commit");
    res.json({ message: "Doctor updated" });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
});

exports.deleteDoctor = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `update users
     set is_active = false, updated_at = now()
     where id = (select user_id from doctors where id = $1 and is_chief = false)
     returning id`,
    [req.params.id]
  );

  if (!rows[0]) {
    throw new HttpError(404, "Doctor not found or chief doctor cannot be deleted");
  }

  res.json({ message: "Doctor disabled" });
});
