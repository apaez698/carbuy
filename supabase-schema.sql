-- ============================================================
--  VENDOYA — Supabase Schema
--  Ejecutar en: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
--  1. LEADS — Formularios completados
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  -- Auto
  marca           TEXT,
  modelo          TEXT,
  anio            INTEGER,
  tipo            TEXT,
  combustible     TEXT,
  transmision     TEXT,
  kilometraje     TEXT,
  color           TEXT,
  placa           TEXT,

  -- Estado
  estado_general  TEXT,
  rtv_vigente     TEXT,
  accesorios      TEXT[],
  observaciones   TEXT,

  -- Estimado
  estimado_min    INTEGER,
  estimado_max    INTEGER,
  estimado_texto  TEXT,
  precio_esperado TEXT,

  -- Contacto
  nombre          TEXT,
  cedula          TEXT,
  celular         TEXT,
  email           TEXT,
  ciudad          TEXT,
  horario         TEXT,
  acepta_wha      BOOLEAN DEFAULT TRUE,

  -- Sesión (tracking)
  session_id      TEXT,
  fuente          TEXT DEFAULT 'organico',
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  user_agent      TEXT,
  ip_country      TEXT DEFAULT 'EC'
);

-- ============================================================
--  2. EVENTS — Tracking de comportamiento
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  session_id   TEXT NOT NULL,
  event_type   TEXT NOT NULL,   -- page_view | step_start | step_complete | step_abandon | field_focus | field_blur | button_click | scroll_depth | estimate_view | form_submit | whatsapp_click
  event_data   JSONB DEFAULT '{}',
  step         INTEGER,         -- 1, 2, 3
  field_name   TEXT,
  value        TEXT,
  time_on_step INTEGER          -- segundos en ese paso
);

-- ============================================================
--  3. SESSIONS — Una fila por visita única
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT PRIMARY KEY,  -- UUID generado en el cliente
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ DEFAULT NOW(),
  
  -- Origen
  referrer        TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  landing_url     TEXT,
  user_agent      TEXT,
  
  -- Progreso
  max_step        INTEGER DEFAULT 0,
  converted       BOOLEAN DEFAULT FALSE,
  scroll_max_pct  INTEGER DEFAULT 0,
  
  -- Tiempo
  time_on_page    INTEGER DEFAULT 0  -- segundos totales
);

-- ============================================================
--  3.1 FEATURE FLAGS - Config centralizada
-- ============================================================
CREATE TABLE IF NOT EXISTS feature_flags (
  name        TEXT PRIMARY KEY,
  enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO feature_flags (name, enabled)
VALUES
  ('NEW_LEADS_VIEW', FALSE),
  ('SHOW_EXPORT_BUTTON', FALSE),
  ('FORM_V1_HIDDEN', FALSE),
  ('FORM_V2_ENABLED', FALSE)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
--  4. INDEXES para performance del dashboard
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leads_created_at    ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_ciudad        ON leads (ciudad);
CREATE INDEX IF NOT EXISTS idx_leads_marca         ON leads (marca);
CREATE INDEX IF NOT EXISTS idx_events_session_id   ON events (session_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type   ON events (event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at   ON events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_converted  ON sessions (converted);

-- ============================================================
--  5. ROW LEVEL SECURITY — solo anon puede insertar, no leer
-- ============================================================
ALTER TABLE leads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Anon puede insertar (desde la web pública)
CREATE POLICY "anon_insert_leads"    ON leads    FOR INSERT TO anon WITH CHECK (TRUE);
CREATE POLICY "anon_insert_events"   ON events   FOR INSERT TO anon WITH CHECK (TRUE);
CREATE POLICY "anon_insert_sessions" ON sessions FOR INSERT TO anon WITH CHECK (TRUE);
CREATE POLICY "anon_update_sessions" ON sessions FOR UPDATE TO anon USING (TRUE);

-- Solo authenticated (tú, el dashboard) puede leer
CREATE POLICY "auth_read_leads"      ON leads    FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "auth_read_events"     ON events   FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "auth_read_sessions"   ON sessions FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "auth_read_feature_flags" ON feature_flags FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "auth_write_feature_flags" ON feature_flags FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "auth_update_feature_flags" ON feature_flags FOR UPDATE TO authenticated USING (TRUE);

-- ============================================================
--  6. VIEWS útiles para el dashboard
-- ============================================================

-- Tasa de conversión por día
CREATE OR REPLACE VIEW daily_conversion AS
SELECT
  DATE(created_at) AS dia,
  COUNT(*)          AS visitas,
  COUNT(*) FILTER (WHERE converted) AS conversiones,
  ROUND(100.0 * COUNT(*) FILTER (WHERE converted) / NULLIF(COUNT(*),0), 1) AS tasa_pct
FROM sessions
GROUP BY 1 ORDER BY 1 DESC;

-- Abandono por paso
CREATE OR REPLACE VIEW funnel_steps AS
SELECT
  step,
  COUNT(*) FILTER (WHERE event_type = 'step_start')    AS iniciaron,
  COUNT(*) FILTER (WHERE event_type = 'step_complete') AS completaron,
  ROUND(100.0 *
    COUNT(*) FILTER (WHERE event_type = 'step_complete') /
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'step_start'), 0)
  , 1) AS tasa_completado_pct
FROM events
WHERE step IS NOT NULL
GROUP BY 1 ORDER BY 1;

-- Leads por ciudad
CREATE OR REPLACE VIEW leads_by_ciudad AS
SELECT ciudad, COUNT(*) AS total
FROM leads GROUP BY 1 ORDER BY 2 DESC;

-- Marcas más cotizadas
CREATE OR REPLACE VIEW top_marcas AS
SELECT marca, COUNT(*) AS total
FROM leads WHERE marca IS NOT NULL
GROUP BY 1 ORDER BY 2 DESC LIMIT 10;

-- ============================================================
--  LISTO. Copia tu SUPABASE_URL y SUPABASE_ANON_KEY
--  y ponlos en vendoya.html donde dice SUPABASE_CONFIG
-- ============================================================
