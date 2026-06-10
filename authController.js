const bcrypt = require("bcryptjs");
const db = require("../db/pool");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const { signToken } = require("../utils/token");

function publicUser(user, extra = {}) {
  return {
    id: user.id,
    role: user.role,
    fullName: user.full_name,
    phone: user.phone,
    email: user.email,
    ...extra
  };
}

async function buildLoginResponse(user) {
  let clientId = null;
  let doctorId = null;

  if (user.role === "client") {
    const { rows } = await db.query("select id from clients where user_id = $1", [user.id]);
    clientId = rows[0]?.id || null;
  }

  if (user.role === "doctor" || user.role === "admin") {
    const { rows } = await db.query("select id from doctors where user_id = $1", [user.id]);
    doctorId = rows[0]?.id || null;
  }

  const token = signToken({
    sub: user.id,
    role: user.role,
    clientId,
    doctorId
  });

  return {
    token,
    user: publicUser(user, { clientId, doctorId })
  };
}

exports.registerClient = asyncHandler(async (req, res) => {
  const { fullName, phone, email, password } = req.body;

  if (!fullName || !phone || !password) {
    throw new HttpError(400, "fullName, phone and password are required");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const client = await db.connect();

  try {
    await client.query("begin");

    const userResult = await client.query(
      `insert into users (role, full_name, phone, email, password_hash)
       values ('client', $1, $2, $3, $4)
       returning id, role, full_name, phone, email`,
      [fullName.trim(), phone.trim(), email || null, passwordHash]
    );

    const clientResult = await client.query(
      `insert into clients (user_id)
       values ($1)
       returning id`,
      [userResult.rows[0].id]
    );

    await client.query("commit");

    const user = userResult.rows[0];
    const token = signToken({
      sub: user.id,
      role: user.role,
      clientId: clientResult.rows[0].id
    });

    res.status(201).json({
      token,
      user: publicUser(user, { clientId: clientResult.rows[0].id })
    });
  } catch (error) {
    await client.query("rollback");
    if (error.code === "23505") {
      throw new HttpError(409, "Phone or email already exists");
    }
    throw error;
  } finally {
    client.release();
  }
});

exports.login = asyncHandler(async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    throw new HttpError(400, "login and password are required");
  }

  const { rows } = await db.query(
    `select id, role, full_name, phone, email, password_hash
     from users
     where (phone = $1 or email = $1 or login = $1) and is_active = true`,
    [login.trim()]
  );

  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new HttpError(401, "Invalid login or password");
  }

  res.json(await buildLoginResponse(user));
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
