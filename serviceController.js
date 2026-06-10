const db = require("../db/pool");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

exports.listServices = asyncHandler(async (_req, res) => {
  const { rows } = await db.query(
    `select c.id as category_id, c.name_kk as category_name_kk, c.name_ru as category_name_ru,
            s.id, s.name_kk, s.name_ru, s.price_from, s.duration_minutes
     from service_categories c
     left join services s on s.category_id = c.id and s.is_active = true
     where c.is_active = true
     order by c.sort_order asc, s.sort_order asc`
  );

  const categories = rows.reduce((acc, row) => {
    if (!acc[row.category_id]) {
      acc[row.category_id] = {
        id: row.category_id,
        nameKk: row.category_name_kk,
        nameRu: row.category_name_ru,
        services: []
      };
    }

    if (row.id) {
      acc[row.category_id].services.push({
        id: row.id,
        nameKk: row.name_kk,
        nameRu: row.name_ru,
        priceFrom: row.price_from,
        durationMinutes: row.duration_minutes
      });
    }

    return acc;
  }, {});

  res.json({ categories: Object.values(categories) });
});

exports.createService = asyncHandler(async (req, res) => {
  const { categoryId, nameKk, nameRu, priceFrom, durationMinutes = 60 } = req.body;

  if (!categoryId || !nameKk || !nameRu) {
    throw new HttpError(400, "categoryId, nameKk and nameRu are required");
  }

  const { rows } = await db.query(
    `insert into services (category_id, name_kk, name_ru, price_from, duration_minutes)
     values ($1, $2, $3, $4, $5)
     returning id`,
    [categoryId, nameKk, nameRu, priceFrom || null, durationMinutes]
  );

  res.status(201).json({ id: rows[0].id });
});
