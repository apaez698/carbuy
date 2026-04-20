// ============================================================
//  POST /api/vehicle
//  Guarda datos del vehículo vinculado a un cliente
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

    if (!body.client_id || !body.marca || !body.modelo) {
      return res
        .status(400)
        .json({ error: "client_id, marca y modelo son requeridos" });
    }

    const sb = getSupabase();

    const { data, error } = await sb
      .from("vehicles")
      .insert({
        client_id: body.client_id,
        marca: str(body.marca, 100),
        modelo: str(body.modelo, 100),
        anio: parseInt(body.anio) || null,
        tipo: str(body.tipo, 50),
        combustible: str(body.combustible, 50),
        transmision: str(body.transmision, 50),
        kilometraje: parseInt(body.kilometraje) || null,
        color: str(body.color, 50),
        placa: str(body.placa, 20),
        estado_general: str(body.estado_general, 50),
        rtv_vigente:
          body.rtv_vigente === true || body.rtv_vigente === "Sí" || null,
        accesorios: Array.isArray(body.accesorios)
          ? body.accesorios.slice(0, 20).map((a) => String(a).slice(0, 50))
          : [],
        observaciones: str(body.observaciones, 500),
        session_id: str(body.session_id, 100),
        source: "v3",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[/api/vehicle] Supabase error:", error);
      return res.status(500).json({ error: "Error guardando vehículo" });
    }

    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    console.error("[/api/vehicle]", err.message);
    return res.status(500).json({ error: "Error interno" });
  }
}
