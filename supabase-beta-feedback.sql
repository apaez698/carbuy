-- ============================================================
--  AutoCash Beta Feedback
--  Ejecutar en Supabase SQL Editor
-- ============================================================

-- UUID helper usado por el esquema principal del proyecto
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Sección 1: Cálculo del precio
  section1_data_entry INT,
  section1_understanding INT,
  section1_missing_data TEXT,

  -- Sección 2: Rango de precios
  section2_price_justice VARCHAR(20), -- higher | fair | lower
  section2_price_details TEXT,
  section2_recommend INT,

  -- Sección 3: Contacto
  section3_contact_visibility INT,
  section3_next_steps INT,

  -- Sección 4: Diseño e interfaz
  section4_navigation INT,
  section4_issues TEXT, -- csv: loading,buttons,responsive,text,none
  section4_improvements TEXT,

  -- Sección 5: Datos personales
  name VARCHAR(255),
  contact VARCHAR(255),

  -- Metadata
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_created_at
  ON public.beta_feedback (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_price_justice
  ON public.beta_feedback (section2_price_justice);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_name
  ON public.beta_feedback (name);

ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public inserts" ON public.beta_feedback;
CREATE POLICY "Allow public inserts"
  ON public.beta_feedback
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon reads (dashboard only)" ON public.beta_feedback;
CREATE POLICY "Allow anon reads (dashboard only)"
  ON public.beta_feedback
  FOR SELECT
  TO anon, authenticated
  USING (true);
