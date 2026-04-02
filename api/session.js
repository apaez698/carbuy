// ============================================================
//  POST /api/session  — registra o actualiza una sesión
// ============================================================
import { getSupabase } from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const sb = getSupabase();

  // POST → crear sesión
  if (req.method === 'POST') {
    try {
      const { id, referrer, utm_source, utm_medium, utm_campaign, landing_url } = req.body;
      if (!id || typeof id !== 'string' || id.length > 100) {
        return res.status(400).json({ error: 'session_id inválido' });
      }

      await sb.from('sessions').upsert({
        id,
        referrer:     referrer?.slice(0, 300)    || null,
        utm_source:   utm_source?.slice(0, 50)   || null,
        utm_medium:   utm_medium?.slice(0, 50)   || null,
        utm_campaign: utm_campaign?.slice(0, 100) || null,
        landing_url:  landing_url?.slice(0, 300) || null,
        user_agent:   req.headers['user-agent']?.slice(0, 250) || null
      }, { onConflict: 'id', ignoreDuplicates: true });

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[/api/session POST]', err.message);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  // PATCH → actualizar sesión al salir (max_step, converted, scroll, time)
  if (req.method === 'PATCH') {
    try {
      const { id, max_step, converted, scroll_max_pct, time_on_page } = req.body;
      if (!id) return res.status(400).json({ error: 'id requerido' });

      const update = { last_seen_at: new Date().toISOString() };
      if (max_step !== undefined)     update.max_step      = Math.min(parseInt(max_step) || 0, 10);
      if (converted !== undefined)    update.converted     = Boolean(converted);
      if (scroll_max_pct !== undefined) update.scroll_max_pct = Math.min(parseInt(scroll_max_pct) || 0, 100);
      if (time_on_page !== undefined) update.time_on_page  = Math.min(parseInt(time_on_page) || 0, 86400);

      await sb.from('sessions').update(update).eq('id', id);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[/api/session PATCH]', err.message);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
