export const FLAGS = {
  NEW_LEADS_VIEW: false,
  SHOW_EXPORT_BUTTON: false,
  FORM_V1_HIDDEN: false,
  FORM_V2_ENABLED: false,
};

function hasLocalStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

export function getFlag(name) {
  if (!Object.prototype.hasOwnProperty.call(FLAGS, name)) {
    return false;
  }

  if (!hasLocalStorage()) {
    return FLAGS[name];
  }

  try {
    const rawValue = localStorage.getItem(`ff_${name}`);
    if (rawValue === null) {
      return FLAGS[name];
    }

    return JSON.parse(rawValue);
  } catch {
    return FLAGS[name];
  }
}

export function setFlag(name, value) {
  if (!Object.prototype.hasOwnProperty.call(FLAGS, name)) {
    return;
  }

  if (!hasLocalStorage()) {
    return;
  }

  localStorage.setItem(`ff_${name}`, JSON.stringify(value));
}

export function setFlagsBatch(flags) {
  if (!flags || typeof flags !== "object") {
    return;
  }

  for (const [name, value] of Object.entries(flags)) {
    setFlag(name, Boolean(value));
  }
}
