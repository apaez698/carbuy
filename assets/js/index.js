import { initSession, track } from "./index/tracking.js";
import { clearFieldError } from "./index/validation.js";
import {
  loadEstimatorMetadata,
  refreshModeloByMarca,
  toggleModeloOtroField,
} from "./index/catalog.js";
import { consultarValor, updateEstimate } from "./index/estimator.js";
import { showStep, goNext, goBack, getStep } from "./index/steps.js";
import {
  submitForm,
  toggleCheck,
  toggleWhatsappAccept,
} from "./index/submit.js";
import { loadFeatureFlags } from "./index/featureFlags.js";

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  YEAR DROPDOWN
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const selAnio = document.getElementById("anio");
const currentYear = new Date().getFullYear();
for (let y = currentYear + 1; y >= 1980; y--) {
  const o = document.createElement("option");
  o.value = y;
  o.textContent = y;
  selAnio.appendChild(o);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  DOM EVENT LISTENERS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
document.getElementById("marca")?.addEventListener("change", () => {
  refreshModeloByMarca();
  clearFieldError("modelo");
  clearFieldError("modeloOtro");
  updateEstimate();
});

document.getElementById("modelo")?.addEventListener("change", () => {
  toggleModeloOtroField();
  clearFieldError("modelo");
  clearFieldError("modeloOtro");
  updateEstimate();
});

document.getElementById("modeloOtro")?.addEventListener("input", () => {
  clearFieldError("modeloOtro");
});

document.getElementById("whaAccept")?.addEventListener("change", (e) => {
  const whaWrap = document.querySelector(".whatsapp-opt");
  const whaError = document.getElementById("whaAcceptError");
  if (e.target.checked) {
    whaWrap?.classList.remove("has-error");
    whaError?.classList.remove("show");
  }
});

document.getElementById("btnNext")?.addEventListener("click", () => {
  if (getStep() === 3) submitForm();
  else goNext();
});

// Field focus / blur tracking
document.addEventListener("focusin", (e) => {
  if (!e.target.matches("input,select,textarea")) return;
  track("field_focus", { field: e.target.id, step: getStep() });
});

document.addEventListener("focusout", (e) => {
  if (!e.target.matches("input,select,textarea")) return;
  track("field_blur", {
    field: e.target.id,
    step: getStep(),
    empty: !e.target.value?.trim(),
  });
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  INIT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
initSession();
loadFeatureFlags();
loadEstimatorMetadata();
refreshModeloByMarca();
toggleModeloOtroField();
track("page_view", { url: window.location.href, referrer: document.referrer });
showStep(1);

// Expose handlers used by inline HTML attributes
Object.assign(window, {
  consultarValor,
  goBack,
  goNext,
  submitForm,
  toggleCheck,
  toggleWhatsappAccept,
  updateEstimate,
});
