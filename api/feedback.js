// ============================================================
//  POST /api/feedback
//  Guarda feedback del usuario sobre la valuación
//  Nuevo schema: tabla 'feedback' + actualiza 'valuations'
// ============================================================
import { getSupabase } from "./_supabase.js";
import { str } from "./_validators.js";

function parseScale(value) {
  const num = Number.parseInt(value, 10);
  if (!Number.isInteger(num) || num < 1 || num > 5) return null;
  return num;
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

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const rating = parseScale(body.rating);
    if (!rating) {
      return res.status(400).json({ error: "rating (1-5) es requerido" });
    }

    const sb = getSupabase();

    // 1. Insertar en tabla feedback
    const insertPayload = {
      rating,
      comment: str(body.comment, 1000),
      metadata: body.metadata || null,
    };

    // valuation_id es opcional (puede llegar feedback sin valuación aún)
    if (body.valuation_id) {
      insertPayload.valuation_id = body.valuation_id;
    }

    const { data, error } = await sb
      .from("feedback")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      console.error("[/api/feedback] Supabase insert error:", error);
      return res.status(500).json({ error: "Error guardando feedback" });
    }

    // 2. Actualizar valuations con snapshot de feedback (si hay valuation_id)
    if (body.valuation_id) {
      const { error: updateError } = await sb
        .from("valuations")
        .update({
          feedback_provided: true,
          feedback_rating: rating,
          feedback_comment: str(body.comment, 1000),
        })
        .eq("id", body.valuation_id);

      if (updateError) {
        console.error(
          "[/api/feedback] Supabase update valuation error:",
          updateError,
        );
        // No falla — el feedback ya se guardó
      }
    }

    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    console.error("[/api/feedback]", err.message);
    return res.status(500).json({ error: "Error interno" });
  }
}
