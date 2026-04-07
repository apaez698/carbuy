const AUTOVALOR_API_BASE =
  process.env.AUTOVALOR_API_BASE || "https://autovalor-ec.onrender.com";

const METADATA_CACHE_TTL_MS = 30 * 60 * 1000;
const METADATA_TIMEOUT_MS = 20000;

function getMetadataCacheStore() {
  if (!globalThis.__pricingMetadataCache) {
    globalThis.__pricingMetadataCache = {
      value: null,
      expiresAt: 0,
    };
  }
  return globalThis.__pricingMetadataCache;
}

function buildCacheState() {
  const cache = getMetadataCacheStore();
  const now = Date.now();
  const expiresAt = Number(cache.expiresAt) || 0;

  return {
    hasValue: Boolean(cache.value),
    ttlMs: METADATA_CACHE_TTL_MS,
    expiresAtIso: expiresAt > 0 ? new Date(expiresAt).toISOString() : null,
    ttlRemainingSec: Math.max(0, Math.floor((expiresAt - now) / 1000)),
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
    const cache = getMetadataCacheStore();
    cache.value = null;
    cache.expiresAt = 0;
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
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.ALLOWED_ORIGIN || "*",
  );

  const cache = getMetadataCacheStore();
  const now = Date.now();
  if (cache.value && cache.expiresAt > now) {
    res.setHeader(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=600",
    );
    res.setHeader("X-Pricing-Cache", "HIT");
    return res.status(200).json(cache.value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), METADATA_TIMEOUT_MS);

  try {
    const startTime = Date.now();
    const upstream = await fetch(AUTOVALOR_API_BASE + "/metadata", {
      method: "GET",
      signal: controller.signal,
    });
    const elapsed = Date.now() - startTime;

    console.log(
      `[pricing-metadata] upstream fetch took ${elapsed}ms, status ${upstream.status}`,
    );

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      console.error(
        `[pricing-metadata] upstream error ${upstream.status}:`,
        data,
      );
      return res.status(upstream.status).json({
        error: "Pricing metadata unavailable",
        upstream: data,
      });
    }

    cache.value = data;
    cache.expiresAt = now + METADATA_CACHE_TTL_MS;

    res.setHeader(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=600",
    );
    res.setHeader("X-Pricing-Cache", "MISS");
    console.log(`[pricing-metadata] cached and returning metadata`);
    return res.status(200).json(data);
  } catch (error) {
    const isTimeout = error?.name === "AbortError";
    console.error(
      `[pricing-metadata] ${isTimeout ? "timeout" : "error"}:`,
      error?.message,
    );
    return res.status(isTimeout ? 504 : 502).json({
      error: isTimeout
        ? "Pricing metadata timeout"
        : "Pricing metadata request failed",
    });
  } finally {
    clearTimeout(timeout);
  }
}
