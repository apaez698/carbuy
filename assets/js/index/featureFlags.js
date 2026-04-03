const FLAG_DEFAULTS = {
  NEW_LEADS_VIEW: false,
  SHOW_EXPORT_BUTTON: false,
  FORM_V1_HIDDEN: false,
  FORM_V2_ENABLED: false,
};

const FLAG_CACHE_KEY_PREFIX = "ff_";

function readLocalFlag(name) {
  try {
    const raw = localStorage.getItem(`${FLAG_CACHE_KEY_PREFIX}${name}`);
    if (raw === null) return FLAG_DEFAULTS[name];
    return JSON.parse(raw);
  } catch {
    return FLAG_DEFAULTS[name];
  }
}

function writeLocalFlag(name, value) {
  localStorage.setItem(
    `${FLAG_CACHE_KEY_PREFIX}${name}`,
    JSON.stringify(Boolean(value)),
  );
}

export async function loadFeatureFlags() {
  const flags = { ...FLAG_DEFAULTS };

  for (const name of Object.keys(FLAG_DEFAULTS)) {
    flags[name] = readLocalFlag(name);
  }

  try {
    const response = await fetch("/api/flags");
    if (response.ok) {
      const payload = await response.json();
      if (payload?.flags && typeof payload.flags === "object") {
        for (const name of Object.keys(FLAG_DEFAULTS)) {
          if (Object.prototype.hasOwnProperty.call(payload.flags, name)) {
            flags[name] = Boolean(payload.flags[name]);
            writeLocalFlag(name, flags[name]);
          }
        }
      }
    }
  } catch {
    // Keep cached values when API is unavailable.
  }

  window.__FEATURE_FLAGS = flags;
  document.body.dataset.featureFlags = JSON.stringify(flags);

  applyFormFlags(flags);

  return flags;
}

function applyFormFlags(flags) {
  const currentForm = document.getElementById("formulario");
  const newForm = document.getElementById("formulario-nuevo");

  if (currentForm) {
    currentForm.style.display = flags.FORM_V1_HIDDEN ? "none" : "";
  }

  if (newForm) {
    newForm.style.display = flags.FORM_V2_ENABLED ? "" : "none";
  }
}

export function isFeatureEnabled(name) {
  const current = window.__FEATURE_FLAGS || FLAG_DEFAULTS;
  return Boolean(current[name]);
}
