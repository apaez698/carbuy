import { initSession, track } from "./index/tracking.js";
import { clearFieldError } from "./index/validation.js";
import {
  loadEstimatorMetadata,
  refreshModeloByMarca,
  toggleModeloOtroField,
  setSelectOptions,
  getModelosByMarca,
} from "./index/catalog.js";
import { consultarValor, updateEstimate } from "./index/estimator.js";
import { showStep, goNext, goBack, getStep } from "./index/steps.js";
import {
  submitForm,
  toggleCheck,
  toggleWhatsappAccept,
} from "./index/submit.js";
import { loadFeatureFlags, isFeatureEnabled } from "./index/featureFlags.js";
import {
  initCotizadorModal,
  openFormularioV1,
} from "./index/cotizadorButton.js";
import {
  initFormV2,
  showPhase,
  goNextPhase,
  goBackPhase,
} from "./index/estimator-v2.js";

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

// ══════════════════════════════════════════════════════════════════════════════
//  SETUP V2 (Formulario V2)
// ══════════════════════════════════════════════════════════════════════════════
function setupFormV2BrandModels() {
  // Poblar dropdown de marcas desde constantes compartidas
  const marcas = [
    "TOYOTA",
    "CHEVROLET",
    "HYUNDAI",
    "KIA",
    "MAZDA",
    "NISSAN",
    "FORD",
    "VOLKSWAGEN",
    "RENAULT",
    "PEUGEOT",
    "SUZUKI",
    "CHANGAN",
    "JAC",
    "DFSK",
    "HAVAL",
    "OTRA",
  ];
  setSelectOptions("marcaV2", marcas, "Selecciona la marca...");

  // Estado inicial del combo modelo
  setSelectOptions("modeloV2", [], "Selecciona primero una marca");

  // Cargar modelos cuando cambia marca
  document.getElementById("marcaV2")?.addEventListener("change", (e) => {
    const marca = (e.target.value || "").trim();
    const models = getModelosByMarca(marca);
    setSelectOptions(
      "modeloV2",
      models,
      marca ? "Selecciona el modelo..." : "Selecciona primero una marca",
    );
  });
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  INIT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function initApp() {
  initSession();
  const flags = await loadFeatureFlags();

  // Inicializar formulario V1 o V2 según feature flags
  if (flags.FORM_V2_ENABLED) {
    // Formulario V2
    initFormV2();

    // Poblar selects de marca/modelo para V2
    setupFormV2BrandModels();
  } else {
    // Formulario V1 (por defecto)
    initCotizadorModal({
      onOpenFormulario: () => openFormularioV1({ showStepFn: showStep }),
    });
    loadEstimatorMetadata();
    refreshModeloByMarca();
    toggleModeloOtroField();
    showStep(1);
  }

  track("page_view", {
    url: window.location.href,
    referrer: document.referrer,
  });
}

initApp();

// Expose handlers used by inline HTML attributes
Object.assign(window, {
  consultarValor,
  goBack,
  goNext,
  goBackPhase,
  goNextPhase,
  submitForm,
  toggleCheck,
  toggleWhatsappAccept,
  updateEstimate,
});
