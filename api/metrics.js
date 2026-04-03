// ============================================================
//  GET /api/metrics?key=TU_DASHBOARD_PASSWORD
//  Retorna datos agregados para el dashboard
//  Protegido con password simple — las keys de Supabase
//  nunca salen del servidor
// ============================================================
import { getSupabase } from "./_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Autenticación simple por query param ──
  const { key, q } = req.query;
  const validPass = process.env.DASHBOARD_PASSWORD;

  if (!validPass || key !== validPass) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const sb = getSupabase();

  try {
    // Según qué datos pide el dashboard
    switch (q) {
      // ── KPIs generales ──
      case "kpis": {
        const [sessions, leads, whaClicks] = await Promise.all([
          sb.from("sessions").select("*", { count: "exact", head: true }),
          sb.from("leads").select("*", { count: "exact", head: true }),
          sb
            .from("events")
            .select("*", { count: "exact", head: true })
            .eq("event_type", "whatsapp_click"),
        ]);

        const today = startOfDay(0);
        const yesterday = startOfDay(1);

        const [leadsHoy, leadsAyer, sesHoy, sesAyer, whaHoy, whaAyer] =
          await Promise.all([
            sb
              .from("leads")
              .select("*", { count: "exact", head: true })
              .gte("created_at", today),
            sb
              .from("leads")
              .select("*", { count: "exact", head: true })
              .gte("created_at", yesterday)
              .lt("created_at", today),
            sb
              .from("sessions")
              .select("*", { count: "exact", head: true })
              .gte("created_at", today),
            sb
              .from("sessions")
              .select("*", { count: "exact", head: true })
              .gte("created_at", yesterday)
              .lt("created_at", today),
            sb
              .from("events")
              .select("*", { count: "exact", head: true })
              .eq("event_type", "whatsapp_click")
              .gte("created_at", today),
            sb
              .from("events")
              .select("*", { count: "exact", head: true })
              .eq("event_type", "whatsapp_click")
              .gte("created_at", yesterday)
              .lt("created_at", today),
          ]);

        return res.status(200).json({
          totalSessions: sessions.count || 0,
          totalLeads: leads.count || 0,
          whaClicks: whaClicks.count || 0,
          leadsHoy: leadsHoy.count || 0,
          leadsAyer: leadsAyer.count || 0,
          sesHoy: sesHoy.count || 0,
          sesAyer: sesAyer.count || 0,
          whaHoy: whaHoy.count || 0,
          whaAyer: whaAyer.count || 0,
        });
      }

      // ── Leads por día (30 días) ──
      case "leads_dia": {
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const { data } = await sb
          .from("leads")
          .select("created_at")
          .gte("created_at", since.toISOString())
          .order("created_at");
        return res.status(200).json({ data: data || [] });
      }

      // ── Top marcas ──
      case "marcas": {
        const { data } = await sb.from("leads").select("marca");
        return res.status(200).json({ data: data || [] });
      }

      // ── Leads por ciudad ──
      case "ciudades": {
        const { data } = await sb.from("leads").select("ciudad");
        return res.status(200).json({ data: data || [] });
      }

      // ── Funnel de pasos ──
      case "funnel": {
        const { data } = await sb
          .from("events")
          .select("event_type, step")
          .in("event_type", [
            "step_start",
            "step_complete",
            "form_submit",
            "whatsapp_click",
          ]);
        return res.status(200).json({ data: data || [] });
      }

      // ── Scroll depth ──
      case "scroll": {
        const { data } = await sb
          .from("events")
          .select("event_data")
          .eq("event_type", "scroll_depth");
        return res.status(200).json({ data: data || [] });
      }

      // ── Campos vacíos más comunes ──
      case "campos_vacios": {
        const { data } = await sb
          .from("events")
          .select("field_name, step")
          .eq("event_type", "field_blur")
          .eq("event_data->>empty", "true");
        return res.status(200).json({ data: data || [] });
      }

      // ── Últimos leads (tabla) ──
      case "leads_tabla": {
        const { data, count } = await sb
          .from("leads")
          .select(
            "id, created_at, nombre, marca, modelo, anio, kilometraje, estado_general, estimado_texto, celular, ciudad, utm_source",
            { count: "exact" },
          )
          .order("created_at", { ascending: false })
          .limit(20);
        return res.status(200).json({ data: data || [], count: count || 0 });
      }

      // ── Tiempo promedio por paso ──
      case "tiempo_pasos": {
        const { data } = await sb
          .from("events")
          .select("step, time_on_step")
          .eq("event_type", "step_complete")
          .not("time_on_step", "is", null);
        return res.status(200).json({ data: data || [] });
      }

      default:
        return res.status(400).json({ error: "Query desconocida" });
    }
  } catch (err) {
    console.error("[/api/metrics]", err.message);
    return res.status(500).json({ error: "Error interno" });
  }
}

// Helper: ISO string del inicio del día N días atrás
function startOfDay(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
