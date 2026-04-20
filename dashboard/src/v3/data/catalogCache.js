// Cache layer for the external catalog API (marcas / modelos).
// Uses localStorage with a TTL so the first visit pays the cold-start
// penalty but every subsequent interaction is instant.

import { CAR_DB } from "./carDb.js";

const BASE = "https://autovalor-ec.onrender.com/api/scraper";
const CACHE_KEY = "autocash.catalog";
const TTL = 24 * 60 * 60 * 1000; // 24 h

// ── localStorage helpers ────────────────────────────────────────────

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeEntry(key, data) {
  try {
    const store = readStore();
    store[key] = { data, ts: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    /* quota exceeded – silent */
  }
}

function readEntry(key) {
  const entry = readStore()[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL) return null;
  return entry.data;
}

// ── In-memory promise dedup (avoid duplicate in-flight requests) ────

const inflight = {};

// ── Public API ──────────────────────────────────────────────────────

export async function fetchMarcas() {
  const cached = readEntry("marcas");
  if (cached) return cached;

  if (inflight.marcas) return inflight.marcas;

  inflight.marcas = (async () => {
    try {
      const res = await fetch(`${BASE}/marcas`);
      if (!res.ok) throw new Error(res.status);
      const { marcas } = await res.json();
      writeEntry("marcas", marcas);
      return marcas;
    } catch (err) {
      console.warn("[catalog] marcas fallback:", err.message);
      return CAR_DB.map((b) => b.brand);
    } finally {
      delete inflight.marcas;
    }
  })();

  return inflight.marcas;
}

export async function fetchModelos(marca) {
  const key = `modelos:${marca}`;
  const cached = readEntry(key);
  if (cached) return cached;

  if (inflight[key]) return inflight[key];

  inflight[key] = (async () => {
    try {
      const res = await fetch(
        `${BASE}/marcas/${encodeURIComponent(marca)}/modelos`,
      );
      if (!res.ok) throw new Error(res.status);
      const { modelos } = await res.json();
      writeEntry(key, modelos);
      return modelos;
    } catch (err) {
      console.warn("[catalog] modelos fallback:", err.message);
      const entry = CAR_DB.find(
        (b) => b.brand.toUpperCase() === marca.toUpperCase(),
      );
      return entry ? entry.models : [];
    } finally {
      delete inflight[key];
    }
  })();

  return inflight[key];
}
