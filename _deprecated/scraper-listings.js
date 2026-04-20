// ============================================================
//  POST /api/scraper-listings
//  Recibe un array de listings scrapeados y los guarda en bulk
//  Usa upsert para evitar duplicados (source + listing_id)
// ============================================================
import { getSupabase } from "./_supabase.js";
import { str } from "./_validators.js";

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

  // --- Auth: requiere secret para evitar escrituras no autorizadas ---
  if (SCRAPER_SECRET) {
    const auth = req.headers["authorization"];
    if (auth !== `Bearer ${SCRAPER_SECRET}`) {
      return res.status(401).json({ error: "No autorizado" });
    }
  }

  try {
    const body = req.body;
    const registros = body.registros ?? body;

    if (!Array.isArray(registros) || registros.length === 0) {
      return res.status(400).json({
        error: "Se esperaba un array 'registros' con al menos 1 elemento",
      });
    }

    if (registros.length > 500) {
      return res
        .status(400)
        .json({ error: "Máximo 500 registros por request" });
    }

    // Mapear y sanitizar cada registro
    const rows = [];
    const errors = [];

    for (let i = 0; i < registros.length; i++) {
      const r = registros[i];

      // Validaciones mínimas obligatorias
      if (
        !r.listing_id ||
        !r.source ||
        !r.brand ||
        !r.model ||
        !r.year ||
        r.price == null
      ) {
        errors.push({
          index: i,
          listing_id: r.listing_id,
          error:
            "Faltan campos obligatorios (listing_id, source, brand, model, year, price)",
        });
        continue;
      }

      const year = parseInt(r.year);
      if (isNaN(year) || year < 1950 || year > 2030) {
        errors.push({
          index: i,
          listing_id: r.listing_id,
          error: `Año inválido: ${r.year}`,
        });
        continue;
      }

      const price = parseFloat(r.price);
      if (isNaN(price) || price <= 0) {
        errors.push({
          index: i,
          listing_id: r.listing_id,
          error: `Precio inválido: ${r.price}`,
        });
        continue;
      }

      rows.push({
        listing_id: String(r.listing_id).slice(0, 50),
        source: str(r.source || r.fuente, 30),
        url: str(r.url, 500),
        fecha_scrape: r.fecha_scrape || new Date().toISOString(),
        brand: str(r.brand, 50),
        model: str(r.model, 100),
        year,
        body_type: str(r.body_type || r.subtype, 50),
        color: str(r.color, 30),
        transmission: str(r.transmission, 30),
        fuel: str(r.fuel, 30),
        engine_cc: r.engine_cc != null ? parseInt(r.engine_cc) || null : null,
        traction: str(r.traction, 20),
        price,
        currency: str(r.currency, 5) || "USD",
        mileage_km:
          r.mileage_km != null ? parseInt(r.mileage_km) || null : null,
        city: str(r.city, 50),
        province: str(r.province, 50),
        marca_slug: str(r.marca_slug, 50),
        // last_seen_at se setea automáticamente via trigger
      });
    }

    if (rows.length === 0) {
      return res
        .status(400)
        .json({ error: "Ningún registro válido", detalle: errors });
    }

    const sb = getSupabase();

    const { data, error } = await sb
      .from("scraper_listings")
      .upsert(rows, { onConflict: "source,listing_id" })
      .select("id, listing_id, price_changes");

    if (error) {
      console.error("[/api/scraper-listings] Supabase error:", error);
      return res
        .status(500)
        .json({ error: "Error guardando listings", detalle: error.message });
    }

    const conCambios = data.filter((d) => d.price_changes > 0).length;

    return res.status(200).json({
      ok: true,
      insertados: data.length,
      con_cambio_precio: conCambios,
      errores: errors.length,
      detalle_errores: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("[/api/scraper-listings]", err.message);
    return res.status(500).json({ error: "Error interno" });
  }
}
