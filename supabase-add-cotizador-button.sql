-- Migracion defensiva para asegurar estructura compatible con /api/flags
CREATE TABLE IF NOT EXISTS feature_flags (
	name TEXT PRIMARY KEY,
	enabled BOOLEAN NOT NULL DEFAULT FALSE,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Upsert sin depender de indice/constraint unique en name
UPDATE feature_flags
SET enabled = FALSE, updated_at = NOW()
WHERE name = 'COTIZADOR_BUTTON';

INSERT INTO feature_flags (name, enabled, updated_at)
SELECT 'COTIZADOR_BUTTON', FALSE, NOW()
WHERE NOT EXISTS (
	SELECT 1 FROM feature_flags WHERE name = 'COTIZADOR_BUTTON'
);

-- Opcional: activar inmediatamente
-- UPDATE feature_flags
-- SET enabled = TRUE, updated_at = NOW()
-- WHERE name = 'COTIZADOR_BUTTON';
