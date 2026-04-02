// ============================================================
//  Cliente Supabase SERVER-SIDE únicamente
//  Compatible con nuevo formato sb_secret_... y anterior eyJ...
// ============================================================
import { createClient } from '@supabase/supabase-js';

let _client = null;

export function getSupabase() {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en variables de entorno');
  }

  // Nuevo formato sb_secret_... necesita headers explícitos
  const isNewFormat = key.startsWith('sb_');

  _client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: isNewFormat ? {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    } : {}
  });

  return _client;
}
