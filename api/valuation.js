// ============================================================
//  POST /api/valuation
//  Guarda el resultado de la valuación (estimado del modelo)
// ============================================================
import { getSupabase } from "./_supabase.js";
import { str } from "./_validators.js";

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

  try {
    const body = req.body;

    if (!body.client_id || !body.vehicle_id) {
      return res
        .status(400)
        .json({ error: "client_id y vehicle_id son requeridos" });
    }

    const sb = getSupabase();

    const { data, error } = await sb
      .from("valuations")
      .insert({
        client_id: body.client_id,
        vehicle_id: body.vehicle_id,
        estimated_min: parseFloat(body.estimated_min) || null,
        estimated_max: parseFloat(body.estimated_max) || null,
        estimated_value: parseFloat(body.estimated_value) || null,
        estimated_text: str(body.estimated_text, 50),
        base_market: parseFloat(body.base_market) || null,
        km_impact: parseFloat(body.km_impact) || null,
        condition_bonus: parseFloat(body.condition_bonus) || null,
        confidence: parseFloat(body.confidence) || null,
        sample_size: parseInt(body.sample_size) || null,
        source: str(body.source, 50),
        v3_source: "v3",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[/api/valuation] Supabase error:", error);
      return res.status(500).json({ error: "Error guardando valuación" });
    }

    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    console.error("[/api/valuation]", err.message);
    return res.status(500).json({ error: "Error interno" });
  }
}
