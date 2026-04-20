export const SESSION_ID = crypto.randomUUID();
export const PAGE_START = Date.now();
export const utmParams = new URLSearchParams(window.location.search);

let scrollMax = 0;

export async function api(path, body, method = "POST") {
  try {
    await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    /* silencioso — nunca interrumpir la UX */
  }
}

export async function initSession() {
  await api("/api/session", {
    id: SESSION_ID,
    referrer: document.referrer || null,
    utm_source: utmParams.get("utm_source"),
    utm_medium: utmParams.get("utm_medium"),
    utm_campaign: utmParams.get("utm_campaign"),
    landing_url: window.location.href,
  });
}

export async function track(eventType, data = {}) {
  await api("/api/track", {
    session_id: SESSION_ID,
    event_type: eventType,
    event_data: data,
    step: data.step ?? null,
    field_name: data.field ?? null,
    value: data.value != null ? String(data.value) : null,
    time_on_step: data.time_on_step ?? null,
  });
}

// Scroll depth
window.addEventListener(
  "scroll",
  () => {
    const total = document.body.scrollHeight - window.innerHeight;
    if (total <= 0) return;
    const pct = Math.round((window.scrollY / total) * 100);
    if (pct > scrollMax) {
      scrollMax = pct;
      if ([25, 50, 75, 90, 100].includes(pct))
        track("scroll_depth", { value: pct });
    }
  },
  { passive: true },
);

// Actualizar sesión al salir (keepalive asegura que llegue)
window.addEventListener("beforeunload", () => {
  const timeOnPage = Math.round((Date.now() - PAGE_START) / 1000);
  api(
    "/api/session",
    { id: SESSION_ID, scroll_max_pct: scrollMax, time_on_page: timeOnPage },
    "PATCH",
  );
});

// Clicks en botones clave
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button, a");
  if (!btn) return;
  track("button_click", {
    label: (btn.textContent || "").trim().slice(0, 60),
    id: btn.id || null,
  });
});
