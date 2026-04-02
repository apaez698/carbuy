import { getSupabase } from "./_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { key } = req.query;
  const validPass = process.env.DASHBOARD_PASSWORD;
  if (!validPass || key !== validPass) {
    return res.status(401).json({ error: "No autorizado" });
  }

  if (req.body?.confirm !== "DELETE_TEST_DATA") {
    return res.status(400).json({ error: "Confirmacion invalida" });
  }

  try {
    const sb = getSupabase();

    const [eventsRes, leadsRes, sessionsRes] = await Promise.all([
      sb
        .from("events")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"),
      sb
        .from("leads")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"),
      sb.from("sessions").delete().neq("id", "___no_match___"),
    ]);

    if (eventsRes.error || leadsRes.error || sessionsRes.error) {
      return res.status(500).json({ error: "No se pudo limpiar la data" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[/api/reset-data]", err.message);
    return res.status(500).json({ error: "Error interno" });
  }
}
