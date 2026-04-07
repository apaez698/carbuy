// ============================================================
//  POST /api/scraper-close
//  Marca como "vendidos" los listings que no se vieron en N días
//  Llamar al final de cada corrida completa del scraper
// ============================================================
import { getSupabase } from "./_supabase.js";

const SCRAPER_SECRET = process.env.SCRAPER_SECRET;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader(
      "Access-Control-Allow-Origin",
      process.env.ALLOWED_ORIGIN || "*",
    );
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.ALLOWED_ORIGIN || "*",
  );

  // --- Auth ---
  if (SCRAPER_SECRET) {
    const auth = req.headers["authorization"];
    if (auth !== `Bearer ${SCRAPER_SECRET}`) {
      return res.status(401).json({ error: "No autorizado" });
    }
  }

  try {
    const body = req.body || {};
    const days = parseInt(body.days) || 3;

    if (days < 1 || days > 30) {
      return res.status(400).json({ error: "days debe estar entre 1 y 30" });
    }

    const sb = getSupabase();

    const { data, error } = await sb.rpc("fn_mark_sold_listings", {
      threshold_days: days,
    });

    if (error) {
      console.error("[/api/scraper-close] Supabase error:", error);
      return res
        .status(500)
        .json({ error: "Error marcando vendidos", detalle: error.message });
    }

    const markedCount = data?.[0]?.marked_count ?? data ?? 0;

    return res.status(200).json({
      ok: true,
      marcados_vendidos: Number(markedCount),
      threshold_days: days,
    });
  } catch (err) {
    console.error("[/api/scraper-close]", err.message);
    return res.status(500).json({ error: "Error interno" });
  }
}
