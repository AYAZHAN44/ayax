create extension if not exists pgcrypto;

do $$ begin
  create type user_role as enum ('client', 'doctor', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type appointment_status as enum ('confirmed', 'done', 'cancelled');
exception
  when duplicate_object then null;
end $$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  role user_role not null,
  full_name varchar(180) not null,
  phone varchar(30) unique,
  email varchar(180) unique,
  login varchar(80) unique,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_login_identity_chk check (
    phone is not null or email is not null or login is not null
  )
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  birth_date date,
  created_at timestamptz not null default now()
);

create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  specialization varchar(180) not null,
  tag varchar(120),
  about text,
  experience_years int not null default 0,
  patients_count int not null default 0,
  rating numeric(2, 1) not null default 5.0,
  photo_url text,
  is_chief boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists service_categories (
  id uuid primary key default gen_random_uuid(),
  name_kk varchar(160) not null,
  name_ru varchar(160) not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references service_categories(id) on delete restrict,
  name_kk varchar(180) not null,
  name_ru varchar(180) not null,
  price_from numeric(12, 2),
  duration_minutes int not null default 60,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete restrict,
  doctor_id uuid not null references doctors(id) on delete restrict,
  service_id uuid not null references services(id) on delete restrict,
  appointment_date date not null,
  appointment_time time not null,
  status appointment_status not null default 'confirmed',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists appointments_doctor_slot_uidx
  on appointments (doctor_id, appointment_date, appointment_time)
  where status <> 'cancelled';

create index if not exists appointments_client_idx on appointments (client_id);
create index if not exists appointments_doctor_date_idx on appointments (doctor_id, appointment_date);
create index if not exists services_category_idx on services (category_id);
