const PREDICT_CACHE_TTL_MS = 5 * 60 * 1000;
const METADATA_CACHE_TTL_MS = 30 * 60 * 1000;

const ALLOWED_ACTIONS = new Set([
  "clear_predict",
  "clear_metadata",
  "clear_all",
]);

function getPredictStore() {
  const store = globalThis.__pricingPredictCache;
  return store instanceof Map ? store : null;
}

function getMetadataStore() {
  const store = globalThis.__pricingMetadataCache;
  if (!store || typeof store !== "object") return null;
  return store;
}

function toIso(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString();
}

function buildState() {
  const now = Date.now();
  const predictStore = getPredictStore();
  const metadataStore = getMetadataStore();

  const predictEntries = [];
  if (predictStore) {
    for (const [key, entry] of predictStore.entries()) {
      const expiresAt = Number(entry?.expiresAt) || 0;
      predictEntries.push({
        key,
        expiresAtIso: toIso(expiresAt),
        ttlRemainingSec: Math.max(0, Math.floor((expiresAt - now) / 1000)),
      });
    }
  }

  const metadataExpiresAt = Number(metadataStore?.expiresAt) || 0;

  return {
    predict: {
      size: predictStore ? predictStore.size : 0,
      ttlMs: PREDICT_CACHE_TTL_MS,
      entries: predictEntries,
    },
    metadata: {
      hasValue: Boolean(metadataStore?.value),
      ttlMs: METADATA_CACHE_TTL_MS,
      expiresAtIso: toIso(metadataExpiresAt),
      ttlRemainingSec: Math.max(
        0,
        Math.floor((metadataExpiresAt - now) / 1000),
      ),
    },
  };
}

function clearPredict() {
  const store = getPredictStore();
  if (store) store.clear();
}

function clearMetadata() {
  const store = getMetadataStore();
  if (!store) return;

  store.value = null;
  store.expiresAt = 0;
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawKey = req.query?.key;
  const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;
  const validPass = process.env.DASHBOARD_PASSWORD;
  if (!validPass || key !== validPass) {
    return res.status(401).json({ error: "No autorizado" });
  }

  if (req.method === "GET") {
    return res.status(200).json(buildState());
  }

  const action = req.body?.action;
  if (!ALLOWED_ACTIONS.has(action)) {
    return res.status(400).json({ error: "Accion invalida" });
  }

  if (action === "clear_predict" || action === "clear_all") {
    clearPredict();
  }

  if (action === "clear_metadata" || action === "clear_all") {
    clearMetadata();
  }

  return res.status(200).json(buildState());
}
