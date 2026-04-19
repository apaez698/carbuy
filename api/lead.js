// ============================================================
//  POST /api/lead
//  Guarda el formulario completo en la tabla leads
//  Corre 100% en el servidor — keys nunca expuestas
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

    // Validaciones mínimas (email es opcional para flujo V3)
    if (!body.nombre || !body.celular || !body.marca) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const celularClean = normalizeEcCellphone(body.celular);
    if (!celularClean) {
      return res.status(400).json({
        error: "Celular invalido. Usa +593XXXXXXXXX o 09XXXXXXXX",
      });
    }

    // Email opcional — validar solo si se proporcionó
    const rawEmail = String(body.email || "").toLowerCase().trim();
    const emailClean = rawEmail.slice(0, 100);
    if (emailClean && !isValidEmail(emailClean)) {
      return res.status(400).json({ error: "Email inválido" });
    }

    const sb = getSupabase();

    const { data, error } = await sb
      .from("leads")
      .insert({
        // Auto
        marca: str(body.marca, 30),
        modelo: str(body.modelo, 50),
        anio: parseInt(body.anio) || null,
        tipo: str(body.tipo, 30),
        combustible: str(body.combustible, 20),
        transmision: str(body.transmision, 20),
        kilometraje: str(body.kilometraje, 20),
        color: str(body.color, 20),
        placa: str(body.placa, 10),

        // Estado
        estado_general: str(body.estado_general, 20),
        rtv_vigente: str(body.rtv_vigente, 5),
        accesorios: Array.isArray(body.accesorios)
          ? body.accesorios.slice(0, 20).map((a) => String(a).slice(0, 50))
          : [],
        observaciones: str(body.observaciones, 500),

        // Estimado
        estimado_min: parseInt(body.estimado_min) || null,
        estimado_max: parseInt(body.estimado_max) || null,
        estimado_texto: str(body.estimado_texto, 50),
        precio_esperado: str(body.precio_esperado, 30),

        // Contacto
        nombre: str(body.nombre, 100),
        cedula: str(body.cedula, 20),
        celular: celularClean,
        email: emailClean,
        ciudad: str(body.ciudad, 50),
        horario: str(body.horario, 50),
        acepta_wha: body.acepta_wha === true,

        // Tracking
        session_id: str(body.session_id, 100),
        utm_source: str(body.utm_source, 50),
        utm_medium: str(body.utm_medium, 50),
        utm_campaign: str(body.utm_campaign, 100),
        user_agent: req.headers["user-agent"]?.slice(0, 250) || null,
        ip_country: req.headers["x-vercel-ip-country"] || "EC",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[/api/lead] Supabase error:", error);
      return res.status(500).json({ error: "Error guardando lead" });
    }

    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    console.error("[/api/lead]", err.message);
    return res.status(500).json({ error: "Error interno" });
  }
}
