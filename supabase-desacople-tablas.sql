-- ============================================================================
-- NEW SCHEMA: Desacoplamiento de tablas leads en 3 tablas relacionales
-- clients (contacto) → vehicles (auto) → valuations (estimado)
-- ============================================================================

-- TABLA: clients (Datos de contacto)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Información de contacto
  nombre VARCHAR(255) NOT NULL,
  cedula VARCHAR(20),
  celular VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  ciudad VARCHAR(100),
  horario VARCHAR(50),
  acepta_whatsapp BOOLEAN DEFAULT false,

  -- Tracking
  session_id TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  user_agent TEXT,
  ip_country VARCHAR(10),

  -- Auditoría
  source VARCHAR(20) DEFAULT 'v3' -- 'v3', 'legacy_leads'
);

CREATE INDEX idx_clients_created_at ON public.clients(created_at DESC);
CREATE INDEX idx_clients_celular ON public.clients(celular);
CREATE INDEX idx_clients_session_id ON public.clients(session_id);

-- TABLA: vehicles (Datos del vehículo)
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

  -- Información del vehículo
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  anio INTEGER,
  tipo VARCHAR(50),
  combustible VARCHAR(50),
  transmision VARCHAR(50),
  kilometraje INTEGER,
  color VARCHAR(50),
  placa VARCHAR(20),

  -- Estado del vehículo
  estado_general VARCHAR(50),
  rtv_vigente BOOLEAN,
  accesorios TEXT[],
  observaciones TEXT,

  -- Tracking
  session_id TEXT,
  source VARCHAR(20) DEFAULT 'v3' -- 'v3', 'legacy_leads'
);

CREATE INDEX idx_vehicles_client_id ON public.vehicles(client_id);
CREATE INDEX idx_vehicles_created_at ON public.vehicles(created_at DESC);
CREATE INDEX idx_vehicles_marca ON public.vehicles(marca);

-- TABLA: valuations (Estimados / Valuaciones)
CREATE TABLE IF NOT EXISTS public.valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,

  -- Estimado de precio
  estimated_min NUMERIC(12,2),
  estimated_max NUMERIC(12,2),
  estimated_value NUMERIC(12,2),
  estimated_text VARCHAR(50),

  -- Detalles de la predicción del modelo
  base_market NUMERIC(12,2),
  km_impact NUMERIC(12,2),
  condition_bonus NUMERIC(12,2),
  confidence NUMERIC(5,2),
  sample_size INTEGER,
  source VARCHAR(50),

  -- Interacción del usuario
  whatsapp_clicked BOOLEAN DEFAULT false,
  whatsapp_clicked_at TIMESTAMPTZ,

  -- Feedback integrado
  feedback_provided BOOLEAN DEFAULT false,
  feedback_rating INTEGER CHECK(feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comment TEXT,

  -- Auditoría
  v3_source VARCHAR(20) DEFAULT 'v3'
);

CREATE INDEX idx_valuations_client_id ON public.valuations(client_id);
CREATE INDEX idx_valuations_vehicle_id ON public.valuations(vehicle_id);
CREATE INDEX idx_valuations_created_at ON public.valuations(created_at DESC);

-- TABLA: feedback (Feedback detallado, separado para flexibilidad futura)
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,

  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,

  -- Metadatos opcionales
  metadata JSONB
);

CREATE INDEX idx_feedback_valuation_id ON public.feedback(valuation_id);
CREATE INDEX idx_feedback_rating ON public.feedback(rating);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- POLICIES: Anon puede insertar (V3 pública)
CREATE POLICY "Anon insert clients" ON public.clients
  FOR INSERT
  WITH CHECK (auth.role() = 'anon_user');

CREATE POLICY "Anon insert vehicles" ON public.vehicles
  FOR INSERT
  WITH CHECK (auth.role() = 'anon_user');

CREATE POLICY "Anon insert valuations" ON public.valuations
  FOR INSERT
  WITH CHECK (auth.role() = 'anon_user');

CREATE POLICY "Anon insert feedback" ON public.feedback
  FOR INSERT
  WITH CHECK (auth.role() = 'anon_user');

-- POLICIES: Authenticated (admin) puede leer todo
CREATE POLICY "Authenticated select clients" ON public.clients
  FOR SELECT
  USING (auth.role() = 'authenticated_user');

CREATE POLICY "Authenticated select vehicles" ON public.vehicles
  FOR SELECT
  USING (auth.role() = 'authenticated_user');

CREATE POLICY "Authenticated select valuations" ON public.valuations
  FOR SELECT
  USING (auth.role() = 'authenticated_user');

CREATE POLICY "Authenticated select feedback" ON public.feedback
  FOR SELECT
  USING (auth.role() = 'authenticated_user');

-- ============================================================================
-- TABLA LEGACY: beta_feedback (DEPRECAR - será eliminada después)
-- Crear esta tabla solo si no existe, para referencia
-- DROP TABLE IF EXISTS public.beta_feedback CASCADE;
-- ============================================================================

-- Comentario: La tabla beta_feedback será eliminada en una migración posterior
-- Su funcionalidad está reemplazada por: valuations.feedback_* + feedback table
