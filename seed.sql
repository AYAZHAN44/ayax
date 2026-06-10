begin;

insert into users (role, full_name, login, password_hash)
values
  ('admin', 'Айажан Бас дәрігер', 'admin', crypt('admin123', gen_salt('bf'))),
  ('doctor', 'Айажан Сейітқызы', 'ayazhan', crypt('doctor123', gen_salt('bf'))),
  ('doctor', 'Мадина Ержанқызы', 'madina', crypt('doctor123', gen_salt('bf'))),
  ('doctor', 'Нұрболат Әлиханұлы', 'nurbolat', crypt('doctor123', gen_salt('bf')))
on conflict (login) do nothing;

insert into doctors (
  user_id, specialization, tag, about, experience_years, patients_count, rating, is_chief
)
select u.id, v.specialization, v.tag, v.about, v.experience_years, v.patients_count, v.rating, v.is_chief
from (
  values
    ('admin', 'Клиника администраторы', 'Admin', 'Жүйені және дәрігерлерді басқарады.', 8, 1200, 5.0::numeric, true),
    ('ayazhan', 'Стоматолог-терапевт', 'Бас дәрігер', 'Эстетикалық және терапиялық стоматология маманы.', 10, 4500, 5.0::numeric, true),
    ('madina', 'Ортодонт', 'Брекет және элайнер', 'Тіс қатарын түзету және bite диагностикасы.', 6, 1800, 4.9::numeric, false),
    ('nurbolat', 'Хирург-имплантолог', 'Имплантация', 'Имплантация және күрделі хирургиялық ем.', 9, 2500, 4.9::numeric, false)
) as v(login, specialization, tag, about, experience_years, patients_count, rating, is_chief)
join users u on u.login = v.login
on conflict (user_id) do nothing;

insert into service_categories (name_kk, name_ru, sort_order)
values
  ('Диагностика', 'Диагностика', 1),
  ('Терапия', 'Терапия', 2),
  ('Ортодонтия', 'Ортодонтия', 3),
  ('Хирургия', 'Хирургия', 4),
  ('Эстетика', 'Эстетика', 5)
on conflict do nothing;

insert into services (category_id, name_kk, name_ru, price_from, duration_minutes, sort_order)
select c.id, v.name_kk, v.name_ru, v.price_from, v.duration_minutes, v.sort_order
from (
  values
    ('Диагностика', 'Алғашқы кеңес', 'Первичная консультация', 0::numeric, 30, 1),
    ('Диагностика', '3D рентген диагностика', '3D рентген диагностика', 7000::numeric, 30, 2),
    ('Терапия', 'Тіс емдеу', 'Лечение зубов', 15000::numeric, 60, 1),
    ('Терапия', 'Кариес емдеу', 'Лечение кариеса', 18000::numeric, 60, 2),
    ('Ортодонтия', 'Брекет жүйесі', 'Брекет-система', 250000::numeric, 90, 1),
    ('Ортодонтия', 'Элайнер консультациясы', 'Консультация по элайнерам', 10000::numeric, 45, 2),
    ('Хирургия', 'Тіс жұлу', 'Удаление зуба', 12000::numeric, 45, 1),
    ('Хирургия', 'Имплантация', 'Имплантация', 180000::numeric, 90, 2),
    ('Эстетика', 'Тіс ағарту', 'Отбеливание зубов', 45000::numeric, 60, 1),
    ('Эстетика', 'Кәсіби тазалау', 'Профессиональная чистка', 25000::numeric, 60, 2)
) as v(category_kk, name_kk, name_ru, price_from, duration_minutes, sort_order)
join service_categories c on c.name_kk = v.category_kk
where not exists (
  select 1 from services s where s.category_id = c.id and s.name_kk = v.name_kk
);

commit;
