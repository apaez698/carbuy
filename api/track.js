// ============================================================
//  POST /api/track
//  Recibe eventos de comportamiento del usuario (analytics)
//  Corre 100% en el servidor — keys nunca expuestas al browser
// ============================================================
import { getSupabase } from './_supabase.js';

const ALLOWED_EVENTS = new Set([
  'page_view', 'step_start', 'step_complete', 'step_abandon',
  'field_focus', 'field_blur', 'field_error',
  'button_click', 'scroll_depth', 'estimate_view',
  'form_submit', 'whatsapp_click'
]);

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS — solo tu propio dominio en producción
  const origin = req.headers.origin || '';
  const allowed = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { session_id, event_type, event_data = {}, step, field_name, value, time_on_step } = req.body;

    // Validaciones básicas
    if (!session_id || typeof session_id !== 'string' || session_id.length > 100) {
      return res.status(400).json({ error: 'session_id inválido' });
    }
    if (!ALLOWED_EVENTS.has(event_type)) {
      return res.status(400).json({ error: 'event_type no permitido' });
    }

    const sb = getSupabase();

    await sb.from('events').insert({
      session_id,
      event_type,
      event_data: sanitize(event_data),
      step:        Number.isInteger(step) ? step : null,
      field_name:  typeof field_name === 'string' ? field_name.slice(0, 50) : null,
      value:       value != null ? String(value).slice(0, 100) : null,
      time_on_step: Number.isInteger(time_on_step) ? time_on_step : null
    });

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[/api/track]', err.message);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// Sanitiza el objeto de datos para evitar payloads gigantes
function sanitize(obj, depth = 0) {
  if (depth > 2 || typeof obj !== 'object' || obj === null) return obj;
  return Object.fromEntries(
    Object.entries(obj)
      .slice(0, 20)
      .map(([k, v]) => [
        String(k).slice(0, 50),
        typeof v === 'string' ? v.slice(0, 200) : sanitize(v, depth + 1)
      ])
  );
}
