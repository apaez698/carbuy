-- ============================================================
--  VENDOYA — Tabla de listings scrapeados (precios de mercado)
--  Ejecutar en: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- ============================================================
--  1. SCRAPER_LISTINGS — Anuncios scrapeados de portales
-- ============================================================
CREATE TABLE IF NOT EXISTS scraper_listings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  -- Identificación del listing
  listing_id      TEXT NOT NULL,           -- ID único del portal (ej: "1932395")
  source          TEXT NOT NULL,           -- portal de origen: patiotuerca, olx, etc.
  url             TEXT,                    -- URL completa del anuncio

  -- Fecha de scrape (la que reporta el scraper)
  fecha_scrape    TIMESTAMPTZ NOT NULL,

  -- Vehículo
  brand           TEXT NOT NULL,
  model           TEXT NOT NULL,
  year            INTEGER NOT NULL,
  body_type       TEXT,                    -- SUV, Sedán, Hatchback, etc.
  color           TEXT,
  transmission    TEXT,                    -- Manual, Automática, Secuencial, etc.
  fuel            TEXT,                    -- Gasolina, Diesel, Híbrido, etc.
  engine_cc       INTEGER,                -- cilindrada en cc
  traction        TEXT,                    -- 4x2, 4x4

  -- Precio
  price           NUMERIC(12,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'USD',
  original_price  NUMERIC(12,2),           -- precio del primer scrape (nunca se sobreescribe)
  price_changes   INTEGER DEFAULT 0,       -- cuántas veces cambió el precio

  -- Kilometraje
  mileage_km      INTEGER,

  -- Ubicación
  city            TEXT,
  province        TEXT,

  -- Slug para búsqueda rápida
  marca_slug      TEXT,

  -- Ciclo de vida del listing
  status          TEXT NOT NULL DEFAULT 'active',  -- active | sold
  first_seen_at   TIMESTAMPTZ,             -- primera vez que el scraper lo vio
  last_seen_at    TIMESTAMPTZ,             -- última vez que el scraper lo vio
  sold_at         TIMESTAMPTZ,             -- cuándo se marcó como vendido
  days_listed     INTEGER,                 -- días en plataforma (calculado al marcar vendido)

  -- Evitar duplicados: mismo listing del mismo source
  UNIQUE (source, listing_id)
);

-- ============================================================
--  2. SCRAPER_PRICE_LOG — Historial de cambios de precio
--     Solo se inserta cuando un listing cambia de precio (via trigger)
-- ============================================================
CREATE TABLE IF NOT EXISTS scraper_price_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  changed_at      TIMESTAMPTZ DEFAULT NOW(),
  listing_id      TEXT NOT NULL,
  source          TEXT NOT NULL,
  old_price       NUMERIC(12,2) NOT NULL,
  new_price       NUMERIC(12,2) NOT NULL,
  price_diff      NUMERIC(12,2),           -- new - old (negativo = bajó)
  price_diff_pct  NUMERIC(5,2)             -- % de cambio
);

CREATE INDEX IF NOT EXISTS idx_spl_listing   ON scraper_price_log (source, listing_id);
CREATE INDEX IF NOT EXISTS idx_spl_changed   ON scraper_price_log (changed_at DESC);

-- ============================================================
--  3. TRIGGER — Auto-gestión del ciclo de vida en upsert
--     - INSERT: setea first_seen_at, last_seen_at, original_price
--     - UPDATE: actualiza last_seen_at; si precio cambió → loguea
-- ============================================================
CREATE OR REPLACE FUNCTION fn_scraper_listing_upsert()
RETURNS TRIGGER AS $$
BEGIN
  -- Siempre actualizar last_seen_at
  NEW.last_seen_at := NOW();

  IF TG_OP = 'INSERT' THEN
    -- Primera vez: setear campos de ciclo de vida
    NEW.first_seen_at   := NOW();
    NEW.original_price  := NEW.price;
    NEW.price_changes   := 0;
    NEW.status          := 'active';
    NEW.sold_at         := NULL;
    NEW.days_listed     := NULL;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Preservar valores inmutables
    NEW.first_seen_at  := OLD.first_seen_at;
    NEW.original_price := OLD.original_price;

    -- Si el listing estaba vendido y reaparece, reactivar
    IF OLD.status = 'sold' THEN
      NEW.status      := 'active';
      NEW.sold_at     := NULL;
      NEW.days_listed := NULL;
    END IF;

    -- Detectar cambio de precio → loguear
    IF OLD.price IS DISTINCT FROM NEW.price THEN
      NEW.price_changes := COALESCE(OLD.price_changes, 0) + 1;

      INSERT INTO scraper_price_log (listing_id, source, old_price, new_price, price_diff, price_diff_pct)
      VALUES (
        NEW.listing_id,
        NEW.source,
        OLD.price,
        NEW.price,
        NEW.price - OLD.price,
        ROUND(100.0 * (NEW.price - OLD.price) / NULLIF(OLD.price, 0), 2)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_scraper_listing_upsert ON scraper_listings;
CREATE TRIGGER trg_scraper_listing_upsert
  BEFORE INSERT OR UPDATE ON scraper_listings
  FOR EACH ROW
  EXECUTE FUNCTION fn_scraper_listing_upsert();

-- ============================================================
--  4. FUNCIÓN — Marcar como vendidos los listings que ya no aparecen
--     Llamar después de cada corrida completa del scraper.
--     threshold_days: si no se ve en N días → vendido (default 3)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_mark_sold_listings(threshold_days INTEGER DEFAULT 3)
RETURNS TABLE(marked_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH updated AS (
    UPDATE scraper_listings
    SET
      status      = 'sold',
      sold_at     = NOW(),
      days_listed = EXTRACT(DAY FROM NOW() - first_seen_at)::INTEGER
    WHERE status = 'active'
      AND last_seen_at < NOW() - (threshold_days || ' days')::INTERVAL
    RETURNING id
  )
  SELECT COUNT(*) AS marked_count FROM updated;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
--  5. INDEXES para búsqueda y análisis de precios
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sl_brand          ON scraper_listings (brand);
CREATE INDEX IF NOT EXISTS idx_sl_model          ON scraper_listings (model);
CREATE INDEX IF NOT EXISTS idx_sl_year           ON scraper_listings (year);
CREATE INDEX IF NOT EXISTS idx_sl_price          ON scraper_listings (price);
CREATE INDEX IF NOT EXISTS idx_sl_source         ON scraper_listings (source);
CREATE INDEX IF NOT EXISTS idx_sl_marca_slug     ON scraper_listings (marca_slug);
CREATE INDEX IF NOT EXISTS idx_sl_city           ON scraper_listings (city);
CREATE INDEX IF NOT EXISTS idx_sl_created_at     ON scraper_listings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sl_brand_year     ON scraper_listings (brand, year);
CREATE INDEX IF NOT EXISTS idx_sl_brand_model    ON scraper_listings (brand, model);
CREATE INDEX IF NOT EXISTS idx_sl_status         ON scraper_listings (status);
CREATE INDEX IF NOT EXISTS idx_sl_last_seen      ON scraper_listings (last_seen_at);
CREATE INDEX IF NOT EXISTS idx_sl_status_active  ON scraper_listings (last_seen_at) WHERE status = 'active';

-- ============================================================
--  6. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE scraper_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_price_log ENABLE ROW LEVEL SECURITY;

-- Service role (API backend) puede todo
CREATE POLICY "service_all_scraper_listings"
  ON scraper_listings
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "service_all_scraper_price_log"
  ON scraper_price_log
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Authenticated (dashboard) puede leer
CREATE POLICY "auth_read_scraper_listings"
  ON scraper_listings
  FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "auth_read_scraper_price_log"
  ON scraper_price_log
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- ============================================================
--  7. VIEWS útiles para buscador de precios y tiempo de venta
-- ============================================================

-- Rango de precios por marca + modelo + año (solo activos)
CREATE OR REPLACE VIEW price_range_by_vehicle AS
SELECT
  brand,
  model,
  year,
  COUNT(*)                         AS total_listings,
  MIN(price)                       AS precio_min,
  MAX(price)                       AS precio_max,
  ROUND(AVG(price), 0)            AS precio_promedio,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) AS precio_mediana
FROM scraper_listings
WHERE status = 'active'
GROUP BY brand, model, year
ORDER BY brand, model, year DESC;

-- Rango de precios solo por marca + año (solo activos)
CREATE OR REPLACE VIEW price_range_by_brand_year AS
SELECT
  brand,
  year,
  COUNT(*)                         AS total_listings,
  MIN(price)                       AS precio_min,
  MAX(price)                       AS precio_max,
  ROUND(AVG(price), 0)            AS precio_promedio,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) AS precio_mediana
FROM scraper_listings
WHERE status = 'active'
GROUP BY brand, year
ORDER BY brand, year DESC;

-- Tiempo estimado de venta por marca + modelo + año
CREATE OR REPLACE VIEW avg_days_to_sell AS
SELECT
  brand,
  model,
  year,
  COUNT(*)                          AS total_vendidos,
  MIN(days_listed)                  AS dias_min,
  MAX(days_listed)                  AS dias_max,
  ROUND(AVG(days_listed), 0)       AS dias_promedio,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_listed) AS dias_mediana
FROM scraper_listings
WHERE status = 'sold' AND days_listed IS NOT NULL
GROUP BY brand, model, year
ORDER BY brand, model, year DESC;

-- Tiempo estimado de venta solo por marca + año
CREATE OR REPLACE VIEW avg_days_to_sell_by_brand AS
SELECT
  brand,
  year,
  COUNT(*)                          AS total_vendidos,
  ROUND(AVG(days_listed), 0)       AS dias_promedio,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_listed) AS dias_mediana,
  ROUND(AVG(price), 0)             AS precio_promedio_venta,
  ROUND(AVG(original_price - price), 0) AS descuento_promedio
FROM scraper_listings
WHERE status = 'sold' AND days_listed IS NOT NULL
GROUP BY brand, year
ORDER BY brand, year DESC;

-- Listings con historial de cambios de precio
CREATE OR REPLACE VIEW listings_price_changes AS
SELECT
  sl.brand,
  sl.model,
  sl.year,
  sl.listing_id,
  sl.source,
  sl.original_price,
  sl.price AS current_price,
  sl.price_changes,
  sl.original_price - sl.price AS total_discount,
  sl.status,
  sl.first_seen_at,
  sl.last_seen_at,
  sl.days_listed
FROM scraper_listings sl
WHERE sl.price_changes > 0
ORDER BY sl.price_changes DESC;

-- ============================================================
--  LISTO.
-- ============================================================
