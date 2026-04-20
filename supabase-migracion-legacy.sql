-- ============================================================================
-- MIGRACIÓN: Convertir datos de tabla 'leads' a nuevo schema
-- clients ← (nombre, cedula, celular, email, ciudad, horario, acepta_wha)
-- vehicles ← (marca, modelo, anio, tipo, combustible, transmision, km, color, placa, estado_general, rtv_vigente, accesorios, observaciones)
-- valuations ← (estimado_min, estimado_max, estimado_texto, precio_esperado + detalles de predicción)
-- ============================================================================

-- PASO 1: Migrar datos de 'leads' a 'clients'
INSERT INTO public.clients (
  id,
  created_at,
  nombre,
  cedula,
  celular,
  email,
  ciudad,
  horario,
  acepta_whatsapp,
  session_id,
  utm_source,
  utm_medium,
  utm_campaign,
  user_agent,
  ip_country,
  source
)
SELECT
  gen_random_uuid() as id,
  created_at,
  nombre,
  cedula,
  celular,
  email,
  ciudad,
  horario,
  COALESCE(acepta_wha, false) as acepta_whatsapp,
  session_id,
  utm_source,
  utm_medium,
  utm_campaign,
  user_agent,
  ip_country,
  'legacy_leads' as source
FROM public.leads
WHERE nombre IS NOT NULL AND celular IS NOT NULL;

-- Crear tabla auxiliar para mapeo lead_id → client_id (temporaria)
CREATE TEMP TABLE lead_client_map AS
SELECT
  l.id as lead_id,
  c.id as client_id
FROM public.leads l
INNER JOIN public.clients c ON
  l.nombre = c.nombre AND
  l.celular = c.celular AND
  l.created_at = c.created_at AND
  c.source = 'legacy_leads'
LIMIT 1; -- asegurar que el mapeo es 1:1

-- PASO 2: Migrar datos de 'leads' a 'vehicles' usando el mapeo
INSERT INTO public.vehicles (
  client_id,
  created_at,
  marca,
  modelo,
  anio,
  tipo,
  combustible,
  transmision,
  kilometraje,
  color,
  placa,
  estado_general,
  rtv_vigente,
  accesorios,
  observaciones,
  session_id,
  source
)
SELECT
  lcm.client_id,
  l.created_at,
  l.marca,
  l.modelo,
  l.anio,
  l.tipo,
  l.combustible,
  l.transmision,
  CAST(l.kilometraje AS INTEGER),
  l.color,
  l.placa,
  l.estado_general,
  CASE WHEN l.rtv_vigente = 'Sí' THEN true WHEN l.rtv_vigente = 'No' THEN false ELSE NULL END,
  l.accesorios,
  l.observaciones,
  l.session_id,
  'legacy_leads' as source
FROM public.leads l
INNER JOIN lead_client_map lcm ON l.id = lcm.lead_id;

-- Crear tabla auxiliar para mapeo lead_id → vehicle_id (temporaria)
CREATE TEMP TABLE lead_vehicle_map AS
SELECT
  l.id as lead_id,
  v.id as vehicle_id,
  v.client_id
FROM public.leads l
INNER JOIN lead_client_map lcm ON l.id = lcm.lead_id
INNER JOIN public.vehicles v ON
  v.client_id = lcm.client_id AND
  v.marca = l.marca AND
  v.modelo = l.modelo AND
  v.created_at = l.created_at AND
  v.source = 'legacy_leads';

-- PASO 3: Migrar datos de 'leads' a 'valuations'
INSERT INTO public.valuations (
  client_id,
  vehicle_id,
  created_at,
  estimated_min,
  estimated_max,
  estimated_value,
  estimated_text,
  base_market,
  km_impact,
  condition_bonus,
  confidence,
  sample_size,
  source,
  feedback_provided,
  feedback_rating,
  feedback_comment,
  v3_source
)
SELECT
  lvm.client_id,
  lvm.vehicle_id,
  l.created_at,
  CAST(l.estimado_min AS NUMERIC(12,2)),
  CAST(l.estimado_max AS NUMERIC(12,2)),
  CAST(COALESCE(NULLIF(l.precio_esperado, '')::NUMERIC, l.estimado_min::NUMERIC) AS NUMERIC(12,2)),
  l.estimado_texto,
  NULL as base_market,
  NULL as km_impact,
  NULL as condition_bonus,
  NULL as confidence,
  NULL as sample_size,
  'legacy_scraper' as source,
  false as feedback_provided,
  NULL as feedback_rating,
  NULL as feedback_comment,
  'legacy_leads'
FROM public.leads l
INNER JOIN lead_vehicle_map lvm ON l.id = lvm.lead_id;

-- ============================================================================
-- VERIFICACIÓN: Validar integridad de migración
-- ============================================================================

-- Verificar que el número de clientes migrados corresponde
SELECT COUNT(DISTINCT (nombre, celular)) as leads_totales FROM public.leads;
SELECT COUNT(*) as clients_migrados FROM public.clients WHERE source = 'legacy_leads';

-- Verificar FKs correctas
SELECT COUNT(*) as vehicles_sin_client FROM public.vehicles WHERE client_id IS NULL AND source = 'legacy_leads';
SELECT COUNT(*) as valuations_sin_fks FROM public.valuations WHERE client_id IS NULL OR vehicle_id IS NULL;

-- Verificar timestamps
SELECT COUNT(*) as leads_con_fecha FROM public.leads;
SELECT COUNT(*) as clients_con_fecha FROM public.clients WHERE created_at IS NOT NULL AND source = 'legacy_leads';

-- ============================================================================
-- NOTA: Después de validar, considerar:
-- 1. BACKUP de tabla 'leads': CREATE TABLE public.leads_backup AS SELECT * FROM public.leads;
-- 2. OPCIONAL: DROP TABLE public.leads CASCADE; (si se depreca completamente)
-- ============================================================================
