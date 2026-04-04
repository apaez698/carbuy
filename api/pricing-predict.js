const AUTOVALOR_API_BASE =
  process.env.AUTOVALOR_API_BASE || "https://autovalor-ec.onrender.com";

const PREDICT_CACHE_TTL_MS = 5 * 60 * 1000;
const PREDICT_TIMEOUT_MS = 20000;
const KM_RANGE_BUCKET = 2000;
const CACHE_KEY_VERSION = "v2";
const CILINDRADA_BUCKET = 100;

function normalizeKilometraje(km) {
  return Math.floor(Number(km) / KM_RANGE_BUCKET) * KM_RANGE_BUCKET;
}

function normalizeCilindrada(cc) {
  const value = Number(cc);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value / CILINDRADA_BUCKET) * CILINDRADA_BUCKET;
}

function normalizeText(value) {
  return String(value || "")
    .toUpperCase()
    .trim();
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
  const cilindrada = normalizeCilindrada(vehicle.cilindrada);
  const tipo = normalizeText(vehicle.tipo);
  const transmision = normalizeText(vehicle.transmision);
  const combustible = normalizeText(vehicle.combustible);
  const provincia = normalizeText(vehicle.provincia);

  return [
    CACHE_KEY_VERSION,
    marca,
    modelo,
    anio,
    kmRange,
    cilindrada,
    tipo,
    transmision,
    combustible,
    provincia,
  ].join("|");
}

function cleanupExpiredEntries(cache, now) {
  for (const [key, value] of cache.entries()) {
    if (!value || value.expiresAt <= now) cache.delete(key);
  }
}

export default async function handler(req, res) {
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

    const upstream = await fetch(AUTOVALOR_API_BASE + "/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicle }),
      signal: controller.signal,
    });

    const elapsed = Date.now() - startTime;
    console.log(
      `[pricing-predict] upstream fetch took ${elapsed}ms, status ${upstream.status}`,
    );

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
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
    console.error(
      `[pricing-predict] ${isTimeout ? "timeout" : "error"}:`,
      error?.message,
    );
    return res.status(isTimeout ? 504 : 502).json({
      error: isTimeout ? "Pricing predict timeout" : "Pricing predict failed",
    });
  } finally {
    clearTimeout(timeout);
  }
}
