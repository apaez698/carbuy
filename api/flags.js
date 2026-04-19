import { getSupabase } from "./_supabase.js";

const FLAG_DEFAULTS = {
  NEW_LEADS_VIEW: false,
  SHOW_EXPORT_BUTTON: false,
  FORM_V1_HIDDEN: false,
  FORM_V2_ENABLED: false,
  COTIZADOR_BUTTON: false,
  FORM_V3_ENABLED: false,
};

function normalizeFlags(rows) {
  const merged = { ...FLAG_DEFAULTS };

  for (const row of rows || []) {
    if (Object.prototype.hasOwnProperty.call(FLAG_DEFAULTS, row.name)) {
      const rawValue =
        row.enabled !== undefined && row.enabled !== null
          ? row.enabled
          : row.value;
      merged[row.name] = Boolean(rawValue);
    }
  }

  return merged;
}

async function fetchFlagsRows(sb) {
  const byEnabled = await sb.from("feature_flags").select("name, enabled");
  if (!byEnabled.error) {
    return byEnabled;
  }

  const byValue = await sb.from("feature_flags").select("name, value");
  return byValue;
}

async function upsertFlagValue(sb, name, value) {
  const timestamp = new Date().toISOString();

  const withEnabled = await sb.from("feature_flags").upsert(
    {
      name,
      enabled: Boolean(value),
      updated_at: timestamp,
    },
    { onConflict: "name" },
  );

  if (!withEnabled.error) {
    return withEnabled;
  }

  const withValue = await sb.from("feature_flags").upsert(
    {
      name,
      value: Boolean(value),
      updated_at: timestamp,
    },
    { onConflict: "name" },
  );

  return withValue;
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sb = getSupabase();

  try {
    if (req.method === "GET") {
      const { data, error } = await fetchFlagsRows(sb);

      if (error) {
        throw error;
      }

      return res.status(200).json({ flags: normalizeFlags(data) });
    }

    const validPass = process.env.DASHBOARD_PASSWORD;
    const providedKey = req.query?.key;
    if (!validPass || providedKey !== validPass) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const { name, value } = req.body || {};

    if (!Object.prototype.hasOwnProperty.call(FLAG_DEFAULTS, name)) {
      return res.status(400).json({ error: "Flag no soportado" });
    }

    const { error: upsertError } = await upsertFlagValue(sb, name, value);

    if (upsertError) {
      throw upsertError;
    }

    const { data, error } = await fetchFlagsRows(sb);

    if (error) {
      throw error;
    }

    return res.status(200).json({ flags: normalizeFlags(data) });
  } catch (err) {
    console.error("[/api/flags]", err.message);
    return res.status(500).json({ error: "Error interno" });
  }
}
