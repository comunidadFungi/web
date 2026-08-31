-- ============================================================
-- Comunidad Fungi — Endurecimiento del módulo dispensario
--
-- Migración sobre una base que ya tiene las tablas de dispensario.sql.
-- Es idempotente: se puede ejecutar más de una vez sin efecto adicional.
--
-- Corrige lo detectado en la auditoría:
--   · el saldo de stock podía descuadrarse con movimientos sin lote
--   · borrar un paciente arrastraba sus recetas y dejaba salidas huérfanas
--   · el esquema aceptaba valores imposibles (gramos negativos, 10 días/semana)
--   · el signo de un movimiento podía contradecir su tipo
-- ============================================================

-- ------------------------------------------------------------
-- 1. Trazabilidad que sobrevive a los borrados
--
-- Los movimientos guardan una copia del RUT del paciente y del folio de la
-- receta. Si alguna vez se borra la ficha, el libro de inventario sigue
-- diciendo a quién se entregó, que es lo que pide una fiscalización.
-- ------------------------------------------------------------
alter table stock_movements add column if not exists patient_rut text;
alter table stock_movements add column if not exists prescription_folio text;
alter table stock_movements add column if not exists patient_name text;

-- ------------------------------------------------------------
-- 2. Borrar un paciente ya no destruye su historial clínico
--
-- Antes: `on delete cascade` eliminaba todas sus recetas en silencio.
-- Ahora la base lo impide y hay que desactivar al paciente en su lugar.
-- ------------------------------------------------------------
alter table prescriptions
  drop constraint if exists prescriptions_patient_id_fkey;
alter table prescriptions
  add constraint prescriptions_patient_id_fkey
  foreign key (patient_id) references patients(id) on delete restrict;

-- ------------------------------------------------------------
-- 3. Valores imposibles rechazados por la base
--
-- Hasta ahora toda la validación vivía en el código: cualquier escritura por
-- SQL, importación o ruta futura entraba sin filtro.
-- ------------------------------------------------------------
alter table prescriptions drop constraint if exists prescriptions_unit_size_positive;
alter table prescriptions add constraint prescriptions_unit_size_positive
  check (unit_size_g > 0);

alter table prescriptions drop constraint if exists prescriptions_intake_positive;
alter table prescriptions add constraint prescriptions_intake_positive
  check (units_per_intake > 0 and intakes_per_day > 0);

alter table prescriptions drop constraint if exists prescriptions_duration_positive;
alter table prescriptions add constraint prescriptions_duration_positive
  check (duration_value > 0);

alter table prescriptions drop constraint if exists prescriptions_declared_positive;
alter table prescriptions add constraint prescriptions_declared_positive
  check (declared_total_units is null or declared_total_units > 0);

-- Cada esquema exige exactamente sus propios campos
alter table prescriptions drop constraint if exists prescriptions_schedule_fields;
alter table prescriptions add constraint prescriptions_schedule_fields check (
  case schedule_type
    when 'days_per_week' then days_per_week is not null and days_per_week between 1 and 7
    when 'cycle'         then cycle_days_on is not null and cycle_days_on > 0
                              and cycle_days_off is not null and cycle_days_off >= 0
    when 'monthly_quota' then monthly_quota_g is not null and monthly_quota_g > 0
    else true
  end
);

alter table prescriptions drop constraint if exists prescriptions_valid_until_after_issue;
alter table prescriptions add constraint prescriptions_valid_until_after_issue
  check (valid_until is null or valid_until >= issued_date);

-- ------------------------------------------------------------
-- 4. El signo de un movimiento debe concordar con su tipo
--
-- Antes se podía guardar una `dispensacion` con gramos positivos, y la vista
-- de saldos la sumaba como si fuese una entrada.
-- ------------------------------------------------------------
alter table stock_movements drop constraint if exists stock_movements_sign_matches_type;
alter table stock_movements add constraint stock_movements_sign_matches_type check (
  case
    when type in ('dispensacion', 'merma')    then grams <= 0 and units <= 0
    when type in ('entrada', 'devolucion')    then grams >= 0 and units >= 0
    else true   -- 'ajuste' admite signo libre a propósito
  end
);

-- ------------------------------------------------------------
-- 5. Todo movimiento de existencias pertenece a un lote
--
-- Un movimiento sin lote quedaba fuera de la vista de saldos: se dispensaba
-- producto y el inventario no bajaba. Solo el ajuste puede ir sin lote, para
-- correcciones globales.
-- ------------------------------------------------------------
alter table stock_movements drop constraint if exists stock_movements_batch_required;
alter table stock_movements add constraint stock_movements_batch_required
  check (type = 'ajuste' or batch_id is not null);

-- Una dispensación siempre identifica al paciente
alter table stock_movements drop constraint if exists stock_movements_patient_required;
alter table stock_movements add constraint stock_movements_patient_required
  check (type <> 'dispensacion' or patient_id is not null);

-- Al borrar un lote se conservan sus movimientos, pero sin lote quedarían
-- fuera del saldo: se impide el borrado si tiene historial.
alter table stock_movements drop constraint if exists stock_movements_batch_id_fkey;
alter table stock_movements add constraint stock_movements_batch_id_fkey
  foreign key (batch_id) references production_batches(id) on delete restrict;

-- ------------------------------------------------------------
-- 6. Registro de entrega de las alertas
-- ------------------------------------------------------------
alter table prescription_alerts add column if not exists delivered_at timestamptz;

-- ------------------------------------------------------------
-- 7. La vista de saldos respeta el RLS de las tablas que consulta
--
-- Sin `security_invoker` una vista se ejecuta con los permisos de quien la
-- creó, y dejaba leer la producción con la clave anónima del sitio.
-- ------------------------------------------------------------
create or replace view batch_stock
with (security_invoker = on) as
select
  b.id                                     as batch_id,
  b.code,
  b.product_name,
  b.status,
  b.expires_at,
  coalesce(sum(m.grams), 0)::numeric(10,3) as grams_balance,
  coalesce(sum(m.units), 0)::numeric(10,2) as units_balance
from production_batches b
left join stock_movements m on m.batch_id = b.id
group by b.id, b.code, b.product_name, b.status, b.expires_at;
