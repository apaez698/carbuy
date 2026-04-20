// ============================================================
//  POST /api/client
//  Guarda datos de contacto del cliente
//  Nuevo endpoint para schema desacoplado
// ============================================================
import { getSupabase } from "./_supabase.js";
import { isValidEmail, normalizeEcCellphone, str } from "./_validators.js";

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

    // Validaciones obligatorias
    if (!body.nombre || !body.celular) {
      return res.status(400).json({ error: "nombre y celular son requeridos" });
    }

    const celularClean = normalizeEcCellphone(body.celular);
    if (!celularClean) {
      return res.status(400).json({
        error: "Celular inválido. Usa +593XXXXXXXXX o 09XXXXXXXX",
      });
    }

    // Email opcional pero validado si se proporciona
    const rawEmail = String(body.email || "").toLowerCase().trim();
    const emailClean = rawEmail.slice(0, 100);
    if (emailClean && !isValidEmail(emailClean)) {
      return res.status(400).json({ error: "Email inválido" });
    }

    const sb = getSupabase();

    const { data, error } = await sb
      .from("clients")
      .insert({
        nombre: str(body.nombre, 255),
        cedula: str(body.cedula, 20),
        celular: celularClean,
        email: emailClean || null,
        ciudad: str(body.ciudad, 100),
        horario: str(body.horario, 50),
        acepta_whatsapp: body.acepta_whatsapp === true,
        session_id: str(body.session_id, 100),
        utm_source: str(body.utm_source, 100),
        utm_medium: str(body.utm_medium, 100),
        utm_campaign: str(body.utm_campaign, 100),
        user_agent: req.headers["user-agent"]?.slice(0, 250) || null,
        ip_country: req.headers["x-vercel-ip-country"] || "EC",
        source: "v3",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[/api/client] Supabase error:", error);
      return res.status(500).json({ error: "Error guardando cliente" });
    }

    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    console.error("[/api/client]", err.message);
    return res.status(500).json({ error: "Error interno" });
  }
}
