const db = require("../db/pool");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

function canSeeAppointment(user, appointment) {
  if (user.role === "admin") return true;
  if (user.role === "doctor" && user.doctorId === appointment.doctor_id) return true;
  if (user.role === "client" && user.clientId === appointment.client_id) return true;
  return false;
}

exports.listAppointments = asyncHandler(async (req, res) => {
  const { date, status, doctorId } = req.query;
  const params = [];
  const filters = [];

  if (req.user.role === "doctor") {
    params.push(req.user.doctorId);
    filters.push(`a.doctor_id = $${params.length}`);
  } else if (req.user.role === "client") {
    params.push(req.user.clientId);
    filters.push(`a.client_id = $${params.length}`);
  } else if (doctorId) {
    params.push(doctorId);
    filters.push(`a.doctor_id = $${params.length}`);
  }

  if (date) {
    params.push(date);
    filters.push(`a.appointment_date = $${params.length}`);
  }

  if (status) {
    params.push(status);
    filters.push(`a.status = $${params.length}`);
  }

  const where = filters.length ? `where ${filters.join(" and ")}` : "";
  const { rows } = await db.query(
    `select a.id, a.client_id, a.doctor_id, a.service_id, a.appointment_date,
            to_char(a.appointment_time, 'HH24:MI') as appointment_time,
            a.status, a.notes, cuser.full_name as client_name, cuser.phone as client_phone,
            duser.full_name as doctor_name, s.name_kk as service_name_kk, s.name_ru as service_name_ru
     from appointments a
     join clients c on c.id = a.client_id
     join users cuser on cuser.id = c.user_id
     join doctors d on d.id = a.doctor_id
     join users duser on duser.id = d.user_id
     join services s on s.id = a.service_id
     ${where}
     order by a.appointment_date asc, a.appointment_time asc`,
    params
  );

  res.json({ appointments: rows });
});

exports.availableSlots = asyncHandler(async (req, res) => {
  const { doctorId, date } = req.query;

  if (!doctorId || !date) {
    throw new HttpError(400, "doctorId and date are required");
  }

  const allSlots = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00"
  ];

  const { rows } = await db.query(
    `select to_char(appointment_time, 'HH24:MI') as time
     from appointments
     where doctor_id = $1 and appointment_date = $2 and status <> 'cancelled'`,
    [doctorId, date]
  );

  const busy = new Set(rows.map((row) => row.time));
  res.json({
    slots: allSlots.map((time) => ({
      time,
      available: !busy.has(time)
    }))
  });
});

exports.createAppointment = asyncHandler(async (req, res) => {
  const { doctorId, serviceId, date, time, notes } = req.body;

  if (req.user.role !== "client") {
    throw new HttpError(403, "Only clients can book appointments");
  }

  if (!doctorId || !serviceId || !date || !time) {
    throw new HttpError(400, "doctorId, serviceId, date and time are required");
  }

  try {
    const { rows } = await db.query(
      `insert into appointments (client_id, doctor_id, service_id, appointment_date, appointment_time, notes)
       values ($1, $2, $3, $4, $5, $6)
       returning id`,
      [req.user.clientId, doctorId, serviceId, date, time, notes || null]
    );

    res.status(201).json({ id: rows[0].id, message: "Appointment booked" });
  } catch (error) {
    if (error.code === "23505") {
      throw new HttpError(409, "This time slot is already booked");
    }
    if (error.code === "23503") {
      throw new HttpError(400, "Doctor or service was not found");
    }
    throw error;
  }
});

exports.updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!["confirmed", "done", "cancelled"].includes(status)) {
    throw new HttpError(400, "Status must be confirmed, done or cancelled");
  }

  const current = await db.query("select * from appointments where id = $1", [req.params.id]);
  const appointment = current.rows[0];

  if (!appointment) {
    throw new HttpError(404, "Appointment not found");
  }

  if (!canSeeAppointment(req.user, appointment)) {
    throw new HttpError(403, "Access denied");
  }

  if (req.user.role === "client" && status !== "cancelled") {
    throw new HttpError(403, "Clients can only cancel appointments");
  }

  if (req.user.role === "doctor" && status === "cancelled") {
    throw new HttpError(403, "Doctors can mark appointments as done only");
  }

  await db.query(
    `update appointments
     set status = $1, updated_at = now()
     where id = $2`,
    [status, req.params.id]
  );

  res.json({ message: "Appointment updated" });
});
