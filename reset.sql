drop table if exists appointments cascade;
drop table if exists services cascade;
drop table if exists service_categories cascade;
drop table if exists doctors cascade;
drop table if exists clients cascade;
drop table if exists users cascade;
drop type if exists appointment_status;
drop type if exists user_role;

\i database/schema.sql
\i database/seed.sql
