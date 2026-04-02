export function str(val, max) {
  if (val == null || val === "") return null;
  return String(val).trim().slice(0, max);
}

export function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeEcCellphone(raw) {
  if (!raw) return null;

  const cleaned = String(raw).replace(/[^\d+]/g, "");

  if (/^\+5939\d{8}$/.test(cleaned)) {
    return `593${cleaned.slice(4)}`;
  }

  if (/^5939\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  if (/^09\d{8}$/.test(cleaned)) {
    return `593${cleaned.slice(1)}`;
  }

  if (/^9\d{8}$/.test(cleaned)) {
    return `593${cleaned}`;
  }

  return null;
}
