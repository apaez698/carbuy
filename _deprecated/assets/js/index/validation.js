import { track } from "./tracking.js";

export function clearFieldError(id) {
  const el = document.getElementById(id);
  const field = el?.closest(".field");
  field?.classList.remove("has-error");
}

export function setFieldError(id, message) {
  const el = document.getElementById(id);
  const field = el?.closest(".field");
  if (!field) return;
  field.classList.add("has-error");
  const msg = field.querySelector(".error-msg");
  if (msg && message) msg.textContent = message;
}

export function validateStep(n) {
  let valid = true;
  const required =
    n === 1
      ? ["marca", "modelo", "anio", "kilometraje"]
      : n === 3
        ? ["nombre", "celular", "email", "ciudad"]
        : [];

  required.forEach((id) => {
    const el = document.getElementById(id);
    const field = el?.closest(".field");
    if (!el?.value?.trim()) {
      field?.classList.add("has-error");
      track("field_error", { field: id, step: n });
      valid = false;
    } else {
      field?.classList.remove("has-error");
    }
  });

  if (n === 1) {
    const modelo = (document.getElementById("modelo")?.value || "").trim();
    const modeloOtro = (
      document.getElementById("modeloOtro")?.value || ""
    ).trim();
    if (modelo === "OTRO" && !modeloOtro) {
      setFieldError("modeloOtro", "Escribe el modelo exacto de tu auto.");
      track("field_error", { field: "modeloOtro", step: n });
      valid = false;
    }
  }

  if (n === 3) {
    const whaAccept = document.getElementById("whaAccept");
    const whaWrap = document.querySelector(".whatsapp-opt");
    const whaError = document.getElementById("whaAcceptError");
    if (!whaAccept.checked) {
      whaWrap?.classList.add("has-error");
      whaError?.classList.add("show");
      track("field_error", { field: "whaAccept", step: n });
      valid = false;
    } else {
      whaWrap?.classList.remove("has-error");
      whaError?.classList.remove("show");
    }
  }

  return valid;
}
