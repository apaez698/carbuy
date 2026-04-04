import { getSupabase } from "./_supabase.js";
import { isIP } from "node:net";
import { str } from "./_validators.js";

const PRICE_JUSTICE_VALUES = new Set(["higher", "fair", "lower"]);
const ISSUE_VALUES = new Set([
  "loading",
  "buttons",
  "responsive",
  "text",
  "none",
]);

function parseScale(value) {
  const num = Number.parseInt(value, 10);
  if (!Number.isInteger(num) || num < 1 || num > 5) return null;
  return num;
}

function parseIssues(rawIssues) {
  if (!Array.isArray(rawIssues) || rawIssues.length === 0) return null;

  const cleaned = Array.from(
    new Set(
      rawIssues
        .map((item) =>
          String(item || "")
            .trim()
            .toLowerCase(),
        )
        .filter((item) => ISSUE_VALUES.has(item)),
    ),
  );

  if (cleaned.length === 0) return null;
  if (cleaned.includes("none") && cleaned.length > 1) {
    return cleaned.filter((item) => item !== "none").join(",");
  }

  return cleaned.join(",");
}

function getRequestIp(req) {
  const candidates = [
    req.headers["x-forwarded-for"],
    req.headers["x-real-ip"],
    req.headers["x-vercel-forwarded-for"],
  ];

  for (const candidate of candidates) {
    const raw = Array.isArray(candidate) ? candidate[0] : candidate;
    if (!raw) continue;

    const firstIp = String(raw).split(",")[0].trim();
    if (!firstIp || firstIp.length > 64) continue;
    if (isIP(firstIp)) return firstIp;
  }

  return null;
}

function getSafeBody(req) {
  if (req.body && typeof req.body === "object") return req.body;

  if (typeof req.body === "string") {
    try {
      const parsed = JSON.parse(req.body);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      return {};
    }
  }

  return {};
}

function getSupabaseHost() {
  try {
    const raw = process.env.SUPABASE_URL || "";
    if (!raw) return null;
    const url = new URL(raw);
    return url.host || null;
  } catch {
    return null;
  }
}

function fromPublic(sb, tableName) {
  const scoped = typeof sb.schema === "function" ? sb.schema("public") : sb;
  return scoped.from(tableName);
}

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
  const requestId = `fb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const body = getSafeBody(req);

    const section1_data_entry = parseScale(body.section1_data_entry);
    const section1_understanding = parseScale(body.section1_understanding);
    const section2_recommend = parseScale(body.section2_recommend);
    const section3_contact_visibility = parseScale(
      body.section3_contact_visibility,
    );
    const section3_next_steps = parseScale(body.section3_next_steps);
    const section4_navigation = parseScale(body.section4_navigation);

    if (
      !section1_data_entry ||
      !section1_understanding ||
      !section2_recommend ||
      !section3_contact_visibility ||
      !section3_next_steps ||
      !section4_navigation
    ) {
      return res.status(400).json({ error: "Escalas invalidas o incompletas" });
    }

    const section2_price_justice = String(body.section2_price_justice || "")
      .trim()
      .toLowerCase();
    if (!PRICE_JUSTICE_VALUES.has(section2_price_justice)) {
      return res
        .status(400)
        .json({ error: "Valor de justicia de precio invalido" });
    }

    const section4_issues = parseIssues(body.section4_issues);
    if (!section4_issues) {
      return res
        .status(400)
        .json({ error: "Debes seleccionar al menos un problema o 'none'" });
    }

    const sb = getSupabase();
    const { data, error } = await fromPublic(sb, "beta_feedback")
      .insert({
        section1_data_entry,
        section1_understanding,
        section1_missing_data: str(body.section1_missing_data, 1000),

        section2_price_justice,
        section2_price_details: str(body.section2_price_details, 1000),
        section2_recommend,

        section3_contact_visibility,
        section3_next_steps,

        section4_navigation,
        section4_issues,
        section4_improvements: str(body.section4_improvements, 1000),

        name: str(body.name, 255),
        contact: str(body.contact, 255),

        ip_address: getRequestIp(req),
        user_agent: str(req.headers["user-agent"], 500),
      })
      .select("id")
      .single();

    if (error) {
      console.error(`[/api/feedback][${requestId}] Supabase error:`, error);

      const errorDetails = {
        code: error.code || null,
        message: error.message || null,
        details: error.details || null,
        hint: error.hint || null,
      };

      if (error.code === "22P02") {
        return res.status(400).json({
          error: "Formato invalido en uno de los campos enviados",
          requestId,
          debug: errorDetails,
        });
      }

      if (error.code === "PGRST205") {
        const supabaseHost = getSupabaseHost();
        let leadsProbe = null;
        try {
          const probe = await fromPublic(sb, "leads")
            .select("id", { head: true, count: "exact" })
            .limit(1);
          leadsProbe = {
            ok: !probe.error,
            count: probe.count ?? null,
            error: probe.error?.message || null,
          };
        } catch (probeErr) {
          leadsProbe = {
            ok: false,
            count: null,
            error: probeErr?.message || "probe_failed",
          };
        }

        return res.status(500).json({
          error:
            "La tabla public.beta_feedback no existe en Supabase. Ejecuta el script supabase-beta-feedback.sql y recarga el schema cache.",
          requestId,
          supabaseHost,
          debug: {
            ...errorDetails,
            supabaseHost,
            vercelEnv: process.env.VERCEL_ENV || null,
            leadsProbe,
            suggestion:
              "Verifica que SUPABASE_URL/SUPABASE_SERVICE_KEY apunten al mismo proyecto donde creaste beta_feedback y ejecuta: NOTIFY pgrst, 'reload schema';",
          },
        });
      }

      return res.status(500).json({
        error: "Error guardando feedback",
        requestId,
        debug: errorDetails,
      });
    }

    return res.status(200).json({ ok: true, id: data.id, requestId });
  } catch (err) {
    console.error(`[/api/feedback][${requestId}]`, err);
    return res.status(500).json({
      error: "Error interno",
      requestId,
      debug: {
        message: err?.message || null,
      },
    });
  }
}
