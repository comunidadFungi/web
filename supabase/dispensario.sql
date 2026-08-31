-- ============================================================
-- Comunidad Fungi — Módulo Dispensario
-- Pacientes, recetas, producción, stock y alertas
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================
--
-- NOTA DE SEGURIDAD
-- Estas tablas contienen datos clínicos. A diferencia del resto del
-- esquema, NO se otorga acceso amplio a "authenticated": el panel de
-- administración opera con la service role key (createAdminClient),
-- que omite RLS. Las políticas de abajo solo habilitan que un paciente
-- consulte sus propios datos desde el sitio público.
-- ============================================================

-- ------------------------------------------------------------
-- Médicos prescriptores
-- ------------------------------------------------------------
create table if not exists prescribers (
  id            uuid default gen_random_uuid() primary key,
  full_name     text not null,
  rut           text,
  registry_no   text,               -- Nº Registro Superintendencia de Salud / RNPIS
  specialty     text,
  email         text,
  phone         text,
  address       text,
  comuna        text,
  city          text,
  active        boolean default true,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create unique index if not exists prescribers_rut_key
  on prescribers (rut) where rut is not null;

-- ------------------------------------------------------------
-- Pacientes
-- ------------------------------------------------------------
create table if not exists patients (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete set null,
  full_name     text not null,
  rut           text,
  birth_date    date,
  email         text,
  phone         text,
  address       text,
  comuna        text,
  city          text,
  notes         text,
  active        boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create unique index if not exists patients_rut_key
  on patients (rut) where rut is not null;

-- ------------------------------------------------------------
-- Recetas
--
-- La posología se guarda de forma estructurada para poder calcular
-- consumo diario / semanal / mensual. Se soportan cuatro esquemas,
-- que cubren los formatos reales de receta observados:
--
--   daily         — todos los días
--   days_per_week — N días por semana      ("6 veces a la semana")
--   cycle         — N días on / M días off ("un día sí, un día no",
--                                           "tomar 4 días y suspender 3")
--   monthly_quota — cuota total mensual    ("dosis mensual: 10.000 mg")
--
-- declared_total_units guarda el total que declara la receta impresa
-- ("= 60 cápsulas", "equivalentes a 180 cápsulas anuales"). Es el tope
-- legalmente dispensable y puede diferir del cálculo teórico; el sistema
-- muestra ambos y advierte cuando no coinciden.
-- ------------------------------------------------------------
create table if not exists prescriptions (
  id                   uuid default gen_random_uuid() primary key,
  patient_id           uuid not null references patients(id) on delete cascade,
  prescriber_id        uuid references prescribers(id) on delete set null,

  folio                text,
  issued_date          date not null,
  valid_until          date,               -- vencimiento de la receta
  product_id           uuid,               -- producto del catálogo (opcional)
  product_name         text not null,
  presentation         text default 'cápsula',

  -- posología estructurada
  schedule_type        text not null default 'daily'
                         check (schedule_type in
                           ('daily','days_per_week','cycle','monthly_quota')),
  unit_size_g          numeric(10,4) not null default 0,   -- gramos por cápsula
  units_per_intake     numeric(10,2) not null default 1,   -- cápsulas por toma
  intakes_per_day      numeric(10,2) not null default 1,   -- tomas al día
  days_per_week        numeric(4,2),                       -- schedule_type=days_per_week
  cycle_days_on        integer,                            -- schedule_type=cycle
  cycle_days_off       integer,
  monthly_quota_g      numeric(10,3),                      -- schedule_type=monthly_quota

  duration_value       numeric(6,2) not null default 1,
  duration_unit        text not null default 'months'
                         check (duration_unit in ('days','weeks','months','years')),

  declared_total_units numeric(10,2),      -- total declarado en la receta

  diagnosis            text,
  notes                text,
  document_url         text,               -- PDF / foto de la receta
  status               text not null default 'active'
                         check (status in ('active','completed','expired','cancelled')),

  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

create index if not exists prescriptions_patient_idx     on prescriptions (patient_id);
create index if not exists prescriptions_status_idx      on prescriptions (status);
create index if not exists prescriptions_valid_until_idx on prescriptions (valid_until);

-- ------------------------------------------------------------
-- Lotes de producción del dispensario
-- ------------------------------------------------------------
create table if not exists production_batches (
  id                 uuid default gen_random_uuid() primary key,
  code               text not null unique,     -- código de lote
  product_name       text not null,
  species            text,
  started_at         date,                     -- inicio de cultivo
  harvested_at       date,                     -- cosecha
  dried_grams        numeric(10,3) default 0,  -- gramos secos obtenidos
  encapsulated_units integer default 0,        -- cápsulas producidas
  unit_size_g        numeric(10,4),            -- gramos por cápsula del lote
  expires_at         date,
  status             text not null default 'cultivo'
                       check (status in
                         ('cultivo','secado','encapsulado','disponible','agotado','descartado')),
  notes              text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create index if not exists production_batches_status_idx on production_batches (status);

-- ------------------------------------------------------------
-- Movimientos de stock
--
-- Signo: las entradas son positivas, las salidas negativas.
-- El saldo actual es la suma de todos los movimientos.
-- ------------------------------------------------------------
create table if not exists stock_movements (
  id              uuid default gen_random_uuid() primary key,
  batch_id        uuid references production_batches(id) on delete set null,
  prescription_id uuid references prescriptions(id) on delete set null,
  patient_id      uuid references patients(id) on delete set null,
  type            text not null
                    check (type in ('entrada','dispensacion','merma','ajuste','devolucion')),
  grams           numeric(10,3) not null default 0,
  units           numeric(10,2) not null default 0,
  occurred_at     timestamptz default now(),
  notes           text,
  created_by      text,
  created_at      timestamptz default now()
);

create index if not exists stock_movements_batch_idx        on stock_movements (batch_id);
create index if not exists stock_movements_prescription_idx on stock_movements (prescription_id);
create index if not exists stock_movements_occurred_idx     on stock_movements (occurred_at);

-- ------------------------------------------------------------
-- Alertas de vencimiento ya enviadas (evita duplicados)
-- ------------------------------------------------------------
create table if not exists prescription_alerts (
  id              uuid default gen_random_uuid() primary key,
  prescription_id uuid not null references prescriptions(id) on delete cascade,
  kind            text not null,      -- 'expiry_30' | 'expiry_15' | 'expiry_7' | 'expired'
  recipient       text,
  channel         text default 'push',
  sent_at         timestamptz default now(),
  unique (prescription_id, kind)
);

-- ------------------------------------------------------------
-- Suscripciones push (PWA)
-- ------------------------------------------------------------
create table if not exists push_subscriptions (
  id         uuid default gen_random_uuid() primary key,
  user_email text,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz default now()
);

-- ============================================================
-- Vistas de apoyo
-- ============================================================

-- Saldo de stock por lote.
--
-- `security_invoker` es imprescindible: por omisión una vista se ejecuta con
-- los permisos de quien la creó, lo que le permitiría saltarse el RLS de
-- production_batches y stock_movements y dejar los datos de producción
-- legibles con la clave anónima a través de PostgREST.
create or replace view batch_stock
with (security_invoker = on) as
select
  b.id                                   as batch_id,
  b.code,
  b.product_name,
  b.status,
  b.expires_at,
  coalesce(sum(m.grams), 0)::numeric(10,3) as grams_balance,
  coalesce(sum(m.units), 0)::numeric(10,2) as units_balance
from production_batches b
left join stock_movements m on m.batch_id = b.id
group by b.id, b.code, b.product_name, b.status, b.expires_at;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table prescribers         enable row level security;
alter table patients            enable row level security;
alter table prescriptions       enable row level security;
alter table production_batches  enable row level security;
alter table stock_movements     enable row level security;
alter table prescription_alerts enable row level security;
alter table push_subscriptions  enable row level security;

-- Paciente: ve y edita únicamente su propia ficha
drop policy if exists "Patient reads own record" on patients;
create policy "Patient reads own record" on patients
  for select using (auth.uid() = user_id);

-- Paciente: ve únicamente sus propias recetas
drop policy if exists "Patient reads own prescriptions" on prescriptions;
create policy "Patient reads own prescriptions" on prescriptions
  for select using (
    exists (
      select 1 from patients p
      where p.id = prescriptions.patient_id
        and p.user_id = auth.uid()
    )
  );

-- Suscripciones push: cada usuario gestiona las suyas
drop policy if exists "User manages own push subscription" on push_subscriptions;
create policy "User manages own push subscription" on push_subscriptions
  for all using (auth.jwt() ->> 'email' = user_email);

-- prescribers, production_batches, stock_movements y prescription_alerts
-- quedan sin políticas a propósito: solo son accesibles con la service role
-- key desde el panel de administración.
