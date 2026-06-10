const jwt = require("jsonwebtoken");
const db = require("../db/pool");
const env = require("../config/env");
const HttpError = require("../utils/httpError");

async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      throw new HttpError(401, "Authorization token is required");
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const { rows } = await db.query(
      `select id, role, full_name, phone, email
       from users
       where id = $1 and is_active = true`,
      [payload.sub]
    );

    if (!rows[0]) {
      throw new HttpError(401, "User was not found");
    }

    req.user = {
      ...rows[0],
      clientId: payload.clientId || null,
      doctorId: payload.doctorId || null
    };
    next();
  } catch (error) {
    next(error.status ? error : new HttpError(401, "Invalid or expired token"));
  }
}

function allowRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, "Access denied"));
    }
    next();
  };
}

module.exports = { requireAuth, allowRoles };
