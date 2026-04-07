const AUTOVALOR_API_BASE =
  process.env.AUTOVALOR_API_BASE || "https://autovalor-ec.onrender.com";

const PREDICT_CACHE_TTL_MS = 5 * 60 * 1000;
const PREDICT_TIMEOUT_MS = 45000;
const KM_RANGE_BUCKET = 2000;
const CACHE_KEY_VERSION = "v2";
const CILINDRADA_BUCKET = 100;

const BRAND_MULTIPLIER = {
  TOYOTA: 1.12,
  MAZDA: 1.08,
  KIA: 1.02,
  HYUNDAI: 1.0,
  CHEVROLET: 0.98,
  NISSAN: 1.0,
  SUZUKI: 0.97,
  VOLKSWAGEN: 1.04,
};

function normalizeKilometraje(km) {
  return Math.floor(Number(km) / KM_RANGE_BUCKET) * KM_RANGE_BUCKET;
}

function normalizeCilindrada(cc) {
  const value = Number(cc);
  if (!Number.isFinite(value) || value <= 0) return 0;
  // motor_cc en cc: redondear a 100cc (ej: 1600, 2000, 4000)
  return Math.round(value / CILINDRADA_BUCKET) * CILINDRADA_BUCKET;
}

function normalizeText(value) {
  return String(value || "")
    .toUpperCase()
    .trim();
}

const UPSTREAM_SCHEMA_FIELDS = [
  "cilindrada",
  "combustible",
  "estado_carroceria",
  "estado_motor",
  "tipo",
];

function isUpstreamSchemaError(data) {
  if (!data?.error) return false;
  const details = data.error.details;
  if (details && typeof details === "object") {
    const keys = Object.keys(details);
    if (keys.some((k) => UPSTREAM_SCHEMA_FIELDS.includes(k))) return true;
    // Legacy: "Missing computed features..." in details.payload
    const payload = details.payload;
    const payloadMsg = Array.isArray(payload) ? String(payload[0] || "") : "";
    if (/Missing computed features/i.test(payloadMsg)) return true;
  }
  const msg = data.error.message || data.error;
  if (typeof msg === "string" && /missing encoder/i.test(msg)) {
    return true;
  }
  return false;
}

function enrichVehiclePayload(vehicle) {
  const enriched = { ...vehicle };
  if (enriched.motor_cc && enriched.cilindrada == null) {
    enriched.cilindrada = Number(enriched.motor_cc) / 1000;
  }
  if (enriched.tipo_combustible && !enriched.combustible) {
    enriched.combustible = normalizeText(enriched.tipo_combustible);
  }
  if (!enriched.estado_carroceria) {
    enriched.estado_carroceria = "BUENO";
  }
  if (!enriched.estado_motor) {
    enriched.estado_motor = "BUENO";
  }
  if (!enriched.tipo) {
    enriched.tipo = normalizeText(enriched.carroceria) || "DESCONOCIDO";
  }
  return enriched;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildLocalEstimate(vehicle) {
  const currentYear = new Date().getFullYear();
  const anio = Number(vehicle?.anio) || currentYear;
  const kilometraje = Math.max(0, Number(vehicle?.kilometraje) || 0);
  const motor_cc = Number(vehicle?.motor_cc) || 1600;
  const cilindrada = motor_cc / 1000;
  const marca = normalizeText(vehicle?.marca);

  const age = clamp(currentYear - anio, 0, 40);
  const depreciationFactor = Math.pow(0.92, age);
  const kmPenalty = clamp(kilometraje * 0.035, 0, 15000);
  const ccFactor = clamp(1 + (cilindrada - 1.6) * 0.08, 0.75, 1.6);
  const brandFactor = BRAND_MULTIPLIER[marca] || 1;

  let predicted =
    22000 * depreciationFactor * ccFactor * brandFactor - kmPenalty;
  predicted = clamp(Math.round(predicted), 2500, 120000);

  const rangeMin = Math.round(predicted * 0.9);
  const rangeMax = Math.round(predicted * 1.1);

  return {
    predicted_value: predicted,
    range_min: rangeMin,
    range_max: rangeMax,
    source: "local_fallback_v1",
    cache_hit: false,
    warning:
      "Upstream schema changed; local fallback estimate used to keep flow available.",
  };
}

function getPredictCacheStore() {
  if (!globalThis.__pricingPredictCache) {
    globalThis.__pricingPredictCache = new Map();
  }
  return globalThis.__pricingPredictCache;
}

function getCacheKey(vehicle) {
  if (!vehicle || typeof vehicle !== "object") return "";
  const marca = normalizeText(vehicle.marca);
  const anio = Number(vehicle.anio) || 0;
  const modelo = normalizeText(vehicle.modelo);
  const kmRange = normalizeKilometraje(vehicle.kilometraje);
  const motorCc = normalizeCilindrada(vehicle.motor_cc);
  const carroceria = normalizeText(vehicle.carroceria);
  const transmision = normalizeText(vehicle.transmision);
  const combustible = normalizeText(vehicle.tipo_combustible);
  const provincia = normalizeText(vehicle.provincia);
  const traccion = normalizeText(vehicle.traccion);
  const color = normalizeText(vehicle.color);

  return [
    CACHE_KEY_VERSION,
    marca,
    modelo,
    anio,
    kmRange,
    motorCc,
    carroceria,
    transmision,
    combustible,
    provincia,
    traccion,
    color,
  ].join("|");
}

function cleanupExpiredEntries(cache, now) {
  for (const [key, value] of cache.entries()) {
    if (!value || value.expiresAt <= now) cache.delete(key);
  }
}

function buildCacheState() {
  const store = getPredictCacheStore();
  const now = Date.now();
  cleanupExpiredEntries(store, now);

  const entries = [];
  for (const [k, entry] of store.entries()) {
    const expiresAt = Number(entry?.expiresAt) || 0;
    entries.push({
      key: k,
      expiresAtIso: new Date(expiresAt).toISOString(),
      ttlRemainingSec: Math.max(0, Math.floor((expiresAt - now) / 1000)),
    });
  }

  return {
    size: store.size,
    ttlMs: PREDICT_CACHE_TTL_MS,
    entries,
  };
}

function handleAdmin(req, res) {
  const rawKey = req.query?.key;
  const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;
  const validPass = process.env.DASHBOARD_PASSWORD;
  if (!validPass || key !== validPass) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const action = req.query._admin;

  if (action === "clear") {
    const store = getPredictCacheStore();
    store.clear();
  }

  return res.status(200).json(buildCacheState());
}

export default async function handler(req, res) {
  if (req.query?._admin) {
    return handleAdmin(req, res);
  }

  if (req.method === "OPTIONS") {
    res.setHeader(
      "Access-Control-Allow-Origin",
      process.env.ALLOWED_ORIGIN || "*",
    );
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.ALLOWED_ORIGIN || "*",
  );

  const vehicle = req.body?.vehicle;
  const cacheVehicle = req.body?.cache_vehicle;
  if (!vehicle || typeof vehicle !== "object") {
    return res.status(400).json({ error: "Invalid vehicle payload" });
  }

  const cache = getPredictCacheStore();
  const now = Date.now();
  cleanupExpiredEntries(cache, now);

  const key = getCacheKey(
    cacheVehicle && typeof cacheVehicle === "object" ? cacheVehicle : vehicle,
  );
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    res.setHeader(
      "Cache-Control",
      "public, max-age=60, stale-while-revalidate=120",
    );
    res.setHeader("X-Pricing-Cache", "HIT");
    console.log(`[pricing-predict] cache HIT for key: ${key}`);
    return res.status(200).json(cached.value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PREDICT_TIMEOUT_MS);

  try {
    const startTime = Date.now();
    console.log(
      `[pricing-predict] cache MISS, querying upstream for key: ${key}`,
    );

    const enrichedVehicle = enrichVehiclePayload(vehicle);
    const upstream = await fetch(AUTOVALOR_API_BASE + "/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicle: enrichedVehicle }),
      signal: controller.signal,
    });

    const elapsed = Date.now() - startTime;
    console.log(
      `[pricing-predict] upstream fetch took ${elapsed}ms, status ${upstream.status}`,
    );

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      const schemaError = isUpstreamSchemaError(data);
      if (schemaError || upstream.status === 503 || upstream.status >= 500) {
        const fallbackData = buildLocalEstimate(vehicle);
        cache.set(key, {
          value: fallbackData,
          expiresAt: now + PREDICT_CACHE_TTL_MS,
        });
        console.warn(
          `[pricing-predict] upstream ${upstream.status} (schema/server error); returning local fallback estimate`,
          data,
        );
        res.setHeader(
          "Cache-Control",
          "public, max-age=60, stale-while-revalidate=120",
        );
        res.setHeader("X-Pricing-Cache", "MISS");
        return res.status(200).json(fallbackData);
      }

      console.error(
        `[pricing-predict] upstream error ${upstream.status}:`,
        data,
      );
      return res.status(upstream.status).json(data);
    }

    cache.set(key, {
      value: data,
      expiresAt: now + PREDICT_CACHE_TTL_MS,
    });

    res.setHeader(
      "Cache-Control",
      "public, max-age=60, stale-while-revalidate=120",
    );
    res.setHeader("X-Pricing-Cache", "MISS");
    console.log(`[pricing-predict] cached predict result for key: ${key}`);
    return res.status(200).json(data);
  } catch (error) {
    const isTimeout = error?.name === "AbortError";
    console.warn(
      `[pricing-predict] ${isTimeout ? "timeout" : "error"}, using local fallback:`,
      error?.message,
    );
    const fallbackData = buildLocalEstimate(vehicle);
    cache.set(key, {
      value: fallbackData,
      expiresAt: now + PREDICT_CACHE_TTL_MS,
    });
    res.setHeader("X-Pricing-Cache", "MISS");
    return res.status(200).json(fallbackData);
  } finally {
    clearTimeout(timeout);
  }
}
