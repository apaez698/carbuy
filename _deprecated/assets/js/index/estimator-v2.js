/**
 * ESTIMADOR V2
 * Nueva versión del formulario de cotización con 3 fases:
 * 1. Datos de contacto + permiso WhatsApp
 * 2. Datos del vehículo + consulta estimado
 * 3. Resultado + envío WhatsApp
 */

import { WHA_NUMBER } from "./constants.js";
import { clearFieldError, setFieldError } from "./validation.js";
import { track, api, SESSION_ID, utmParams } from "./tracking.js";

// ============================================================
// ESTADO GLOBAL
// ============================================================
let currentPhase = 1;
let phaseStartTime = Date.now();
let formData = {
  // Fase 1: Contacto
  nombre: "",
  celular: "",
  email: "",
  aceptaWhatsapp: false,
  leadId: null,

  // Fase 2: Vehículo
  marca: "",
  modelo: "",
  anio: "",
  kilometraje: "",
  cilindraje: "",
  carroceria: "",
  transmision: "",
  combustible: "",
  traccion: "",
  color: "",

  // Fase 3: Estimado
  estimadoValor: null,
  estimadoMin: null,
  estimadoMax: null,
  precision: null,
};

// Lookup: marca → segmento (feature importance 0.128)
const MARCA_SEGMENTO = {
  AUDI: "ALTO",
  BMW: "ALTO",
  "MERCEDES BENZ": "ALTO",
  LEXUS: "ALTO",
  MINI: "ALTO",
  JEEP: "MEDIO-ALTO",
  TOYOTA: "MEDIO-ALTO",
  MAZDA: "MEDIO-ALTO",
  VOLKSWAGEN: "MEDIO-ALTO",
  FORD: "MEDIO-ALTO",
  HONDA: "MEDIO-ALTO",
  HYUNDAI: "MEDIO",
  KIA: "MEDIO",
  CHEVROLET: "MEDIO",
  NISSAN: "MEDIO",
  RENAULT: "MEDIO",
  MITSUBISHI: "MEDIO",
  SUZUKI: "MEDIO",
  PEUGEOT: "MEDIO",
  CITROEN: "MEDIO",
  FIAT: "MEDIO",
  OPEL: "MEDIO",
  SSANGYONG: "MEDIO",
  DODGE: "MEDIO",
  RAM: "MEDIO",
  CHERY: "MEDIO-BAJO",
  CHANGAN: "MEDIO-BAJO",
  BYD: "MEDIO-BAJO",
  "JAC AUTOS": "MEDIO-BAJO",
  "JAC MOTORS": "MEDIO-BAJO",
  "GREAT WALL": "MEDIO-BAJO",
  HAVAL: "MEDIO-BAJO",
  "MG MOTOR": "MEDIO-BAJO",
  GEELY: "MEDIO-BAJO",
  "GAC MOTOR": "MEDIO-BAJO",
  JETOUR: "MEDIO-BAJO",
  LIVAN: "MEDIO-BAJO",
  BAIC: "BAJO",
  FAW: "BAJO",
  DONGFENG: "BAJO",
  "D.F.S.K. (DONGFENG)": "BAJO",
  FOTON: "BAJO",
  ZOTYE: "BAJO",
  SHINERAY: "BAJO",
  SINOTRUK: "BAJO",
  SOUEAST: "BAJO",
  KYC: "BAJO",
  JMC: "BAJO",
  "ZX AUTO": "BAJO",
  DAIHATSU: "BAJO",
};

// Lookup: marca → país de origen (feature importance 0.036)
const MARCA_PAIS = {
  TOYOTA: "JAPÓN",
  MAZDA: "JAPÓN",
  HONDA: "JAPÓN",
  NISSAN: "JAPÓN",
  SUZUKI: "JAPÓN",
  MITSUBISHI: "JAPÓN",
  DAIHATSU: "JAPÓN",
  LEXUS: "JAPÓN",
  HYUNDAI: "COREA DEL SUR",
  KIA: "COREA DEL SUR",
  SSANGYONG: "COREA DEL SUR",
  CHEVROLET: "USA",
  FORD: "USA",
  DODGE: "USA",
  JEEP: "USA",
  RAM: "USA",
  BMW: "ALEMANIA",
  AUDI: "ALEMANIA",
  VOLKSWAGEN: "ALEMANIA",
  "MERCEDES BENZ": "ALEMANIA",
  OPEL: "ALEMANIA",
  MINI: "ALEMANIA",
  RENAULT: "FRANCIA",
  PEUGEOT: "FRANCIA",
  CITROEN: "FRANCIA",
  FIAT: "ITALIA",
  BYD: "CHINA",
  CHANGAN: "CHINA",
  CHERY: "CHINA",
  BAIC: "CHINA",
  DONGFENG: "CHINA",
  "D.F.S.K. (DONGFENG)": "CHINA",
  FAW: "CHINA",
  FOTON: "CHINA",
  "GAC MOTOR": "CHINA",
  GEELY: "CHINA",
  "GREAT WALL": "CHINA",
  HAVAL: "CHINA",
  "JAC AUTOS": "CHINA",
  "JAC MOTORS": "CHINA",
  JETOUR: "CHINA",
  JMC: "CHINA",
  KYC: "CHINA",
  LIVAN: "CHINA",
  "MG MOTOR": "CHINA",
  SHINERAY: "CHINA",
  SINOTRUK: "CHINA",
  SOUEAST: "CHINA",
  ZOTYE: "CHINA",
  "ZX AUTO": "CHINA",
};

// ============================================================
// SCROLL INTELIGENTE (solo si es necesario)
// ============================================================
function scrollToFormIfNeeded() {
  const formSection = document.getElementById("formulario-nuevo");
  if (!formSection) return;

  const rect = formSection.getBoundingClientRect();
  const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

  if (!isVisible) {
    const top = Math.max(0, window.scrollY + rect.top - 12);
    window.scrollTo({ top, behavior: "smooth" });
  }
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
export function initFormV2() {
  const resultScreen = document.getElementById("resultScreenV2");
  if (resultScreen) resultScreen.hidden = true;

  const formNav = document.getElementById("formNavV2");
  if (formNav) formNav.style.display = "flex";

  setupPhaseNavigation();
  setupFormValidation();
  showPhase(1);
  track("form_v2_start", {});
}

// ============================================================
// NAVEGACIÓN POR FASES
// ============================================================
function setupPhaseNavigation() {
  const btnNext = document.getElementById("btnNextV2");
  const btnBack = document.getElementById("btnBackV2");

  if (btnNext) {
    btnNext.addEventListener("click", goNextPhase);
  }
  if (btnBack) {
    btnBack.addEventListener("click", goBackPhase);
  }
}

export function showPhase(n) {
  if (n < 1 || n > 3) return;

  const resultScreen = document.getElementById("resultScreenV2");
  if (resultScreen) resultScreen.hidden = true;

  const formNav = document.getElementById("formNavV2");
  if (formNav) formNav.style.display = "flex";

  // Ocultar todas las fases
  document.querySelectorAll("[data-phase]").forEach((el) => {
    el.hidden = true;
  });

  // Mostrar fase actual
  const phaseEl = document.querySelector(`[data-phase="${n}"]`);
  if (phaseEl) phaseEl.hidden = false;

  if (n === 3) {
    renderPhase3Content();
  }

  // Actualizar indicadores
  updatePhaseIndicators(n);

  // Resetear temporizador de fase
  phaseStartTime = Date.now();
  currentPhase = n;

  track("phase_start", { phase: n });
}

function updatePhaseIndicators(n) {
  // Actualizar dots/lineas de progreso
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById(`phaseIndicator${i}`);
    const label = document.getElementById(`phaseLabel${i}`);
    if (!dot) continue;

    dot.classList.remove("active", "done", "completed");
    label?.classList.remove("active");

    if (i < n) {
      dot.classList.add("done");
      dot.textContent = "✓";
    } else if (i === n) {
      dot.classList.add("active");
      label?.classList.add("active");
      dot.textContent = i;
    } else {
      dot.textContent = i;
    }
  }

  // Actualizar líneas de progreso
  for (let i = 1; i < 3; i++) {
    const line = document.getElementById(`phaseLine${i}`);
    if (line) {
      line.classList.toggle("done", i < n);
    }
  }

  // Actualizar botones
  const btnBack = document.getElementById("btnBackV2");
  if (btnBack) {
    btnBack.style.visibility = n > 1 ? "visible" : "hidden";
  }

  const btnNext = document.getElementById("btnNextV2");
  if (btnNext) {
    if (n === 3) {
      btnNext.style.display = "none";
    } else {
      btnNext.style.display = "";
      btnNext.textContent = "Siguiente →";
      btnNext.className = "btn btn-next";
    }
  }
}

export async function goNextPhase() {
  const timeOnPhase = Math.round((Date.now() - phaseStartTime) / 1000);

  // Validar fase actual
  if (!validatePhase(currentPhase)) {
    track("phase_validation_error", { phase: currentPhase });
    // Scroll al primer campo con error para que el usuario lo vea
    const firstError = document.querySelector(
      "[data-phase].form-phase:not([hidden]) .field.has-error",
    );
    if (firstError) {
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  // Guardar datos
  try {
    if (currentPhase === 1) {
      await savePhase1();
    } else if (currentPhase === 2) {
      await savePhase2();
      renderPhase3Content();
    }
  } catch (err) {
    console.error("[FormV2] Error avanzando fase:", err?.message || err);
    track("estimate_error", { error: err?.message || "Error desconocido" });
    return;
  }

  track("phase_complete", { phase: currentPhase, time_on_phase: timeOnPhase });

  // Ir a siguiente fase
  if (currentPhase < 3) {
    showPhase(currentPhase + 1);
  } else {
    // Enviar formulario completamente
    await submitFormV2();
  }
}

function renderPhase3Content() {
  const resultContent = document.getElementById("resultContentV2");
  if (!resultContent) return;

  const hasEstimate = Number.isFinite(formData.estimadoValor);

  if (!hasEstimate) {
    resultContent.innerHTML = `
      <div class="step-title">RESULTADO</div>
      <div class="step-subtitle">No se pudo calcular el estimado todavía. Revisa los datos del vehículo e inténtalo nuevamente.</div>
    `;
    return;
  }

  resultContent.innerHTML = `
    <div class="result-header">
      <h2>Resultado Cotización Inicial</h2>
      <p>Tu auto tiene un valor estimado de:</p>
    </div>
    <div class="result-value">
      <div class="valor-estimado">${formatUsd(formData.estimadoValor)}</div>
      <div class="rango">Rango: ${formatUsd(formData.estimadoMin)} - ${formatUsd(formData.estimadoMax)}</div>
      <div class="precision">⚠️ Este es un valor inicial basado en los datos que compartiste. Nuestro asesor de compras reviará en detalle para darte una cotización más precisa y aterrizada.</div>
    </div>

    <div class="result-meeting-section">
      <h3>🎯 Siguiente paso: Reunión Online</h3>
      <p>Para ofrecerte una cotización más aterrizada y ajustada a la realidad de tu vehículo, nuestro equipo necesita:</p>
      <ul class="meeting-benefits">
        <li>📸 Analizar fotos o video del estado del auto</li>
        <li>🔍 Hacer preguntas técnicas y de mantenimiento</li>
        <li>💬 Aclarar detalles que pueden afectar el precio</li>
        <li>✅ Darte una cotización definitiva y vinculante</li>
      </ul>
      <p class="meeting-time">La reunión toma <strong>15-20 minutos</strong> y puedes hacerla <strong>cuando quieras</strong> por videollamada o WhatsApp.</p>
    </div>

    <div class="result-summary">
      <h4>📋 Tu vehículo</h4>
      <div class="summary-row">
        <span class="label">Auto:</span>
        <span class="value">${formData.marca} ${formData.modelo} ${formData.anio}</span>
      </div>
      <div class="summary-row">
        <span class="label">Kilometraje:</span>
        <span class="value">${formatNumber(formData.kilometraje)} km</span>
      </div>
      <div class="summary-row">
        <span class="label">Cilindraje:</span>
        <span class="value">${formData.cilindraje}L</span>
      </div>
      <div class="summary-row">
        <span class="label">Carrocería:</span>
        <span class="value">${formData.carroceria}</span>
      </div>
      <div class="summary-row">
        <span class="label">Transmisión:</span>
        <span class="value">${formData.transmision}</span>
      </div>
      <div class="summary-row">
        <span class="label">Combustible:</span>
        <span class="value">${formData.combustible}</span>
      </div>
      <div class="summary-row">
        <span class="label">Tracción:</span>
        <span class="value">${formData.traccion}</span>
      </div>
      <div class="summary-row">
        <span class="label">Color:</span>
        <span class="value">${formData.color}</span>
      </div>
      <div class="summary-row">
        <span class="label">Contacto:</span>
        <span class="value">${formData.nombre}</span>
      </div>
    </div>

    <div class="result-actions">
      <button id="btnAgendarV2" class="btn btn-primary">💬 Agendar Reunión Online (WhatsApp)</button>
    </div>
  `;

  // Setup botón de agendar reunión
  setupAgendarButton();
}

export function goBackPhase() {
  if (currentPhase > 1) {
    const timeOnPhase = Math.round((Date.now() - phaseStartTime) / 1000);
    track("phase_back", { phase: currentPhase, time_on_phase: timeOnPhase });
    showPhase(currentPhase - 1);
  }
}

// ============================================================
// VALIDACIÓN POR FASE
// ============================================================
function setupFormValidation() {
  // Los inputs de cada fase se validan cuando se intenta pasar a siguiente
}

function validatePhase(n) {
  clearAllErrors();

  if (n === 1) {
    return validatePhase1();
  } else if (n === 2) {
    return validatePhase2();
  }
  return true;
}

function validatePhase1() {
  let valid = true;

  // Nombre
  const nombre = (document.getElementById("nombreV2")?.value || "").trim();
  if (!nombre || nombre.length < 2) {
    setFieldError("nombreV2", "Ingresa tu nombre completo.");
    valid = false;
  } else {
    formData.nombre = nombre;
  }

  // Celular
  const celular = (document.getElementById("celularV2")?.value || "").trim();
  if (!isValidCellphone(celular)) {
    setFieldError(
      "celularV2",
      "Celular inválido. Usa +593XXXXXXXXX o 09XXXXXXXX",
    );
    valid = false;
  } else {
    formData.celular = normalizeCellphone(celular);
  }

  // Email
  const email = (document.getElementById("emailV2")?.value || "").trim();
  if (!isValidEmail(email)) {
    setFieldError("emailV2", "Email inválido.");
    valid = false;
  } else {
    formData.email = email;
  }

  // Permiso WhatsApp
  const aceptaWha = document.getElementById("aceptaWhaV2")?.checked || false;
  if (!aceptaWha) {
    showFieldError(
      "aceptaWhaV2",
      "Debes aceptar poder ser contactado por WhatsApp para continuar.",
    );
    valid = false;
  } else {
    formData.aceptaWhatsapp = true;
  }

  return valid;
}

function validatePhase2() {
  let valid = true;

  // Marca
  const marcaSelect = (document.getElementById("marcaV2")?.value || "").trim();
  if (!marcaSelect) {
    setFieldError("marcaV2", "Selecciona la marca de tu auto.");
    valid = false;
  } else {
    const marcaManual = (
      document.getElementById("marcaOtraV2")?.value || ""
    ).trim();
    if (marcaSelect === "OTRA") {
      if (!marcaManual) {
        setFieldError("marcaOtraV2", "Escribe la marca exacta de tu auto.");
        valid = false;
      } else {
        formData.marca = marcaManual;
      }
    } else {
      formData.marca = marcaSelect;
    }
  }

  // Modelo
  const modeloSelect = (
    document.getElementById("modeloV2")?.value || ""
  ).trim();
  if (!modeloSelect) {
    setFieldError("modeloV2", "Selecciona el modelo de tu auto.");
    valid = false;
  } else {
    const modeloManual = (
      document.getElementById("modeloOtroV2")?.value || ""
    ).trim();
    if (modeloSelect === "OTRO") {
      if (!modeloManual) {
        setFieldError("modeloOtroV2", "Escribe el modelo exacto de tu auto.");
        valid = false;
      } else {
        formData.modelo = modeloManual;
      }
    } else {
      formData.modelo = modeloSelect;
    }
  }

  // Año
  const anio = parseInt(document.getElementById("anioV2")?.value || "", 10);
  const nowYear = new Date().getFullYear() + 1;
  if (!Number.isInteger(anio) || anio < 1980 || anio > nowYear) {
    setFieldError("anioV2", `Año válido entre 1980 y ${nowYear}.`);
    valid = false;
  } else {
    formData.anio = anio;
  }

  // Kilometraje
  const kilometraje = parseFloat(
    document.getElementById("kilometrajeV2")?.value || "",
  );
  if (!Number.isFinite(kilometraje) || kilometraje < 0) {
    setFieldError("kilometrajeV2", "Kilometraje válido (>= 0).");
    valid = false;
  } else {
    formData.kilometraje = kilometraje;
  }

  // Cilindraje
  const cilindraje = parseFloat(
    document.getElementById("cilindrajeV2")?.value || "",
  );
  if (!Number.isFinite(cilindraje) || cilindraje < 0.6 || cilindraje > 8) {
    setFieldError(
      "cilindrajeV2",
      "Cilindraje en litros entre 0.6 y 8.0 (ejemplo: 1.6).",
    );
    valid = false;
  } else {
    formData.cilindraje = cilindraje;
  }

  // Carrocería (optional — use default if field not in DOM)
  const carroceriaEl = document.getElementById("carroceriaV2");
  if (carroceriaEl) {
    const carroceria = (carroceriaEl.value || "").trim();
    if (!carroceria) {
      setFieldError("carroceriaV2", "Selecciona el tipo de carrocería.");
      valid = false;
    } else {
      formData.carroceria = carroceria;
    }
  } else {
    formData.carroceria = "SUV";
  }

  // Transmisión (optional — use default if field not in DOM)
  const transmisionEl = document.getElementById("transmisionV2");
  if (transmisionEl) {
    const transmision = (transmisionEl.value || "").trim();
    if (!transmision) {
      setFieldError("transmisionV2", "Selecciona el tipo de transmisión.");
      valid = false;
    } else {
      formData.transmision = transmision;
    }
  } else {
    formData.transmision = "MANUAL";
  }

  // Combustible (optional — use default if field not in DOM)
  const combustibleEl = document.getElementById("combustibleV2");
  if (combustibleEl) {
    const combustible = (combustibleEl.value || "").trim();
    if (!combustible) {
      setFieldError("combustibleV2", "Selecciona el tipo de combustible.");
      valid = false;
    } else {
      formData.combustible = combustible;
    }
  } else {
    formData.combustible = "GASOLINA";
  }

  // Tracción (optional — use default if field not in DOM)
  const traccionEl = document.getElementById("traccionV2");
  if (traccionEl) {
    const traccion = (traccionEl.value || "").trim();
    if (!traccion) {
      setFieldError("traccionV2", "Selecciona el tipo de tracción.");
      valid = false;
    } else {
      formData.traccion = traccion;
    }
  } else {
    formData.traccion = "DESCONOCIDO";
  }

  // Color (optional — use default if field not in DOM)
  const colorEl = document.getElementById("colorV2");
  if (colorEl) {
    const color = (colorEl.value || "").trim();
    if (!color) {
      setFieldError("colorV2", "Selecciona el color de tu auto.");
      valid = false;
    } else {
      formData.color = color;
    }
  } else {
    formData.color = "BLANCO";
  }

  return valid;
}

function clearAllErrors() {
  document.querySelectorAll(".field.has-error").forEach((field) => {
    field.classList.remove("has-error");
    const msg = field.querySelector(".error-msg");
    if (msg) msg.textContent = "";
  });

  const whaWrap = document.querySelector(".whatsapp-opt-v2");
  if (whaWrap) {
    whaWrap.classList.remove("has-error");
    const whaError = whaWrap.querySelector(".error-msg-wha");
    if (whaError) whaError.classList.remove("show");
  }
}

function showFieldError(id, message) {
  if (id === "aceptaWhaV2") {
    const whaWrap = document.querySelector(".whatsapp-opt-v2");
    if (whaWrap) {
      whaWrap.classList.add("has-error");
      const whaError = whaWrap.querySelector(".error-msg-wha");
      if (whaError) {
        whaError.textContent = message;
        whaError.classList.add("show");
      }
    }
    return;
  }

  setFieldError(id, message);
}

// ============================================================
// GUARDAR DATOS POR FASE
// ============================================================
async function savePhase1() {
  // Crear un lead inicial con datos de contacto
  try {
    const response = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: formData.nombre,
        celular: formData.celular,
        email: formData.email,
        acepta_wha: formData.aceptaWhatsapp,
        session_id: SESSION_ID,
        utm_source: utmParams.get("utm_source"),
        utm_medium: utmParams.get("utm_medium"),
        utm_campaign: utmParams.get("utm_campaign"),
        // Campos de vehículo vacíos por ahora
        marca: "PENDIENTE",
        modelo: "PENDIENTE",
      }),
      keepalive: true,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[FormV2] Error creando lead:", error);
      throw new Error(error?.error || "Error guardando datos de contacto");
    }

    const data = await response.json();
    formData.leadId = data.id;
    track("lead_created", { lead_id: data.id });
  } catch (err) {
    console.error("[FormV2] Error en savePhase1:", err.message);
    throw err;
  }
}

async function savePhase2() {
  // Consultar estimado
  await consultarEstimado();

  // Actualizar lead con datos del vehículo
  if (formData.leadId) {
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Re-enviar todos los datos
          nombre: formData.nombre,
          celular: formData.celular,
          email: formData.email,
          acepta_wha: formData.aceptaWhatsapp,
          marca: formData.marca,
          modelo: formData.modelo,
          anio: formData.anio,
          kilometraje: formData.kilometraje,
          cilindrada: formData.cilindraje,
          carroceria: formData.carroceria,
          transmision: formData.transmision,
          tipo_combustible: formData.combustible,
          traccion: formData.traccion,
          color: formData.color,
          estimado_min: formData.estimadoMin,
          estimado_max: formData.estimadoMax,
          estimado_texto: `${formatUsd(formData.estimadoValor)}`,
          session_id: SESSION_ID,
          utm_source: utmParams.get("utm_source"),
          utm_medium: utmParams.get("utm_medium"),
          utm_campaign: utmParams.get("utm_campaign"),
        }),
        keepalive: true,
      });
    } catch (err) {
      console.error("[FormV2] Error guardando fase 2:", err);
    }
  }

  track("vehicle_data_saved", {
    marca: formData.marca,
    anio: formData.anio,
  });
}

// ============================================================
// CONSULTAR ESTIMADO
// ============================================================
async function consultarEstimado() {
  const btn = document.getElementById("btnNextV2");
  const originalText = btn?.textContent;

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Calculando estimado...";
    }

    // Validar datos antes de enviar
    const anio = Number(formData.anio);
    const kilometraje = Number(formData.kilometraje);
    const cilindraje = Number(formData.cilindraje);

    if (!Number.isFinite(anio) || anio < 1980 || anio > 2030) {
      throw new Error(`Año no válido: ${formData.anio}`);
    }
    if (!Number.isFinite(kilometraje) || kilometraje < 0) {
      throw new Error(`Kilometraje no válido: ${formData.kilometraje}`);
    }
    if (!Number.isFinite(cilindraje) || cilindraje < 0.6 || cilindraje > 8.0) {
      throw new Error(
        `Cilindraje no válido: ${formData.cilindraje}. Rango válido: 0.6-8.0L`,
      );
    }

    // Convertir cilindraje de litros a cc para el modelo
    const motor_cc = Math.round(cilindraje * 1000);
    // Computar antigüedad
    const currentYear = new Date().getFullYear();
    const antiguedad = Math.max(0, currentYear - anio);
    // Lookup segmento y país de origen por marca
    const marcaNorm = normalizePredictText(formData.marca);
    const segmento = MARCA_SEGMENTO[marcaNorm] || "MEDIO";
    const pais_origen = MARCA_PAIS[marcaNorm] || "DESCONOCIDO";

    const payload = {
      anio: anio,
      antiguedad: antiguedad,
      kilometraje: kilometraje,
      motor_cc: motor_cc,
      potencia_hp: 120,
      marca: marcaNorm || "DESCONOCIDO",
      modelo: normalizePredictText(formData.modelo) || "DESCONOCIDO",
      carroceria: normalizePredictText(formData.carroceria) || "SUV",
      transmision: normalizePredictText(formData.transmision) || "MANUAL",
      tipo_combustible:
        normalizePredictText(formData.combustible) || "GASOLINA",
      provincia: "PICHINCHA",
      traccion: normalizePredictText(formData.traccion) || "DESCONOCIDO",
      segmento: segmento,
      pais_origen: pais_origen,
      color: normalizePredictText(formData.color) || "BLANCO",
    };

    const cacheVehicle = { ...payload };

    console.log("[FormV2] Payload preparado:", payload);
    console.log("[FormV2] Consultando estimado:", payload);

    let { res, data } = await fetchPredict(payload, cacheVehicle);

    if (!res.ok && res.status === 422) {
      const suggestedModelo = getSuggestedModeloFromValidation(
        payload.modelo,
        data,
      );

      if (suggestedModelo && suggestedModelo !== payload.modelo) {
        // Reintento con modelo valido sugerido por upstream.
        const fallbackPayload = {
          ...payload,
          modelo: suggestedModelo,
        };
        console.warn(
          `[FormV2] Reintentando predict con modelo sugerido por upstream: ${suggestedModelo}`,
        );
        console.log("[FormV2] Fallback payload:", fallbackPayload);
        ({ res, data } = await fetchPredict(fallbackPayload, {
          ...cacheVehicle,
          modelo: suggestedModelo,
        }));
      }
    }

    if (!res.ok && res.status === 422) {
      // Fallback final: no bloquear el flujo del formulario por drift del esquema upstream.
      data = buildLocalEstimateClient(payload);
      res = { ...res, ok: true, status: 200 };
      console.warn(
        "[FormV2] Upstream 422 persistente; usando estimado local para continuar flujo",
        data,
      );
    }

    if (
      !res.ok &&
      (res.status === 504 || res.status === 502 || res.status === 503)
    ) {
      // Timeout o servicio no disponible: usar fallback local para no bloquear al usuario.
      data = buildLocalEstimateClient(payload);
      res = { ...res, ok: true, status: 200 };
      console.warn(
        `[FormV2] Upstream ${res.status} (timeout/unavailable); usando estimado local`,
        data,
      );
    }

    if (!res.ok) {
      console.error("[FormV2] Error estimador (response no OK):", data);
      // Mostrar error específico del upstream
      const errorMsg =
        data?.error?.message || data?.error || "Error consultando estimado";
      const rawDetail = data?.error?.details;
      const payloadDetail = Array.isArray(rawDetail?.payload)
        ? rawDetail.payload[0]
        : "";
      const modeloDetail =
        typeof rawDetail?.modelo === "string"
          ? rawDetail.modelo
          : Array.isArray(rawDetail?.modelo)
            ? rawDetail.modelo[0]
            : rawDetail?.modelo?.received
              ? `Modelo recibido: ${rawDetail.modelo.received}`
              : "";
      const errorDetail =
        payloadDetail ||
        modeloDetail ||
        data?.detail ||
        data?.validation_error ||
        data?.message ||
        "";
      const fullError = `${errorMsg}${errorDetail ? ": " + errorDetail : ""}`;
      console.error("[FormV2] Error completo:", fullError);
      throw new Error(fullError);
    }

    const predictedValue = parsePredictNumeric(data?.predicted_value);
    let rangeMin = parsePredictNumeric(
      data?.range_min ?? data?.lower_bound ?? data?.min_value,
    );
    let rangeMax = parsePredictNumeric(
      data?.range_max ?? data?.upper_bound ?? data?.max_value,
    );

    if (!Number.isFinite(predictedValue)) {
      console.error("[FormV2] Valor estimado inválido:", data?.predicted_value);
      throw new Error("Valor estimado inválido");
    }

    // Si no hay rango, calcular ±8%
    if (!Number.isFinite(rangeMin) || !Number.isFinite(rangeMax)) {
      rangeMin = Math.max(0, predictedValue * 0.92);
      rangeMax = predictedValue * 1.08;
    }

    if (rangeMin > rangeMax) {
      const tmp = rangeMin;
      rangeMin = rangeMax;
      rangeMax = tmp;
    }

    // Calcular precisión
    const precision =
      Math.round(((rangeMax - rangeMin) / (rangeMax + rangeMin)) * 50 * 100) ||
      75;

    formData.estimadoValor = predictedValue;
    formData.estimadoMin = rangeMin;
    formData.estimadoMax = rangeMax;
    formData.precision = precision;

    console.log("[FormV2] Estimado calculado:", {
      valor: predictedValue,
      min: rangeMin,
      max: rangeMax,
      precision,
    });

    track("estimate_calculated", {
      valor: predictedValue,
      precision,
    });
  } catch (err) {
    console.error("[FormV2] Error en estimado:", err);
    throw err;
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
}

function parsePredictNumeric(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizePredictText(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function normalizeComparableText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9 ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function getSuggestedModeloFromValidation(originalModelo, errorData) {
  const rawMessage =
    errorData?.error?.details?.modelo?.[0] ||
    errorData?.error?.message ||
    errorData?.message ||
    "";

  if (!/valid options\s*:/i.test(rawMessage)) return null;

  const optionsChunk = rawMessage.split(/valid options\s*:/i)[1] || "";
  const options = optionsChunk
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!options.length) return null;

  const original = normalizeComparableText(originalModelo);
  if (!original) return options[0];

  let best = null;
  let bestScore = -1;

  for (const option of options) {
    const normalizedOption = normalizeComparableText(option);
    if (!normalizedOption) continue;

    // Prioriza coincidencias por inclusion (ej: LAND CRUISER dentro de LAND CRUISER PRADO).
    if (
      original.includes(normalizedOption) ||
      normalizedOption.includes(original)
    ) {
      const inclusionScore = 1000 + normalizedOption.length;
      if (inclusionScore > bestScore) {
        best = option;
        bestScore = inclusionScore;
      }
      continue;
    }

    const originalTokens = new Set(original.split(" "));
    const optionTokens = normalizedOption.split(" ");
    const overlap = optionTokens.filter((t) => originalTokens.has(t)).length;
    if (overlap > bestScore) {
      best = option;
      bestScore = overlap;
    }
  }

  if (bestScore <= 0) {
    // Fallback conservador para cuando no hay similitud suficiente.
    return "COROLLA";
  }

  return best;
}

function buildLocalEstimateClient(vehicle) {
  const currentYear = new Date().getFullYear();
  const anio = Number(vehicle?.anio) || currentYear;
  const kilometraje = Math.max(0, Number(vehicle?.kilometraje) || 0);
  const motor_cc = Number(vehicle?.motor_cc) || 1600;
  const cilindrada = motor_cc / 1000;
  const marca = normalizePredictText(vehicle?.marca);

  const brandMultiplier = {
    TOYOTA: 1.12,
    MAZDA: 1.08,
    KIA: 1.02,
    HYUNDAI: 1.0,
    CHEVROLET: 0.98,
    NISSAN: 1.0,
    SUZUKI: 0.97,
    VOLKSWAGEN: 1.04,
  };

  const age = Math.min(40, Math.max(0, currentYear - anio));
  const depreciationFactor = Math.pow(0.92, age);
  const kmPenalty = Math.min(15000, kilometraje * 0.035);
  const ccFactor = Math.min(1.6, Math.max(0.75, 1 + (cilindrada - 1.6) * 0.08));
  const brandFactor = brandMultiplier[marca] || 1;

  let predictedValue =
    22000 * depreciationFactor * ccFactor * brandFactor - kmPenalty;
  predictedValue = Math.min(120000, Math.max(2500, Math.round(predictedValue)));

  return {
    predicted_value: predictedValue,
    range_min: Math.round(predictedValue * 0.9),
    range_max: Math.round(predictedValue * 1.1),
    source: "client_local_fallback_v1",
    warning:
      "Upstream schema changed; local fallback estimate used to keep flow available.",
  };
}

async function fetchPredict(vehicle, cacheVehicle) {
  const res = await fetch("/api/pricing-predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicle,
      cache_vehicle: cacheVehicle,
    }),
  });

  const data = await res.json().catch(() => ({}));
  return { res, data };
}

// ============================================================
// ENVIAR FORMULARIO
// ============================================================
async function submitFormV2() {
  // Guardar sesión como completada
  track("form_submit", {
    marca: formData.marca,
    anio: formData.anio,
    valor: formData.estimadoValor,
    nombre: formData.nombre,
    form_version: "v2",
  });

  // Mostrar pantalla de resultado
  showResultPhase();

  if (resultScreen) resultScreen.hidden = false;

  renderPhase3Content();

  // Setup botón de WhatsApp
  setupWhatsappButton();

  scrollToFormIfNeeded();
}

function buildWhatsappMessage() {
  const ahora = new Date();
  const fechaStr = ahora.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
  });
  const horaStr = ahora.toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return encodeURIComponent(
    [
      "NUEVA COTIZACION - AutoCash",
      `Fecha: ${fechaStr} ${horaStr}`,
      "",
      "DATOS DEL VEHICULO",
      `Marca y modelo: ${formData.marca} ${formData.modelo}`,
      `Anio: ${formData.anio}`,
      `Kilometraje: ${formatNumber(formData.kilometraje)} km`,
      `Cilindraje: ${formData.cilindraje}L | Carroceria: ${formData.carroceria}`,
      `Transmision: ${formData.transmision} | Combustible: ${formData.combustible}`,
      `Traccion: ${formData.traccion} | Color: ${formData.color}`,
      "",
      "COTIZACION",
      `Valor estimado: ${formatUsd(formData.estimadoValor)}`,
      `Rango: ${formatUsd(formData.estimadoMin)} - ${formatUsd(formData.estimadoMax)}`,
      "Valor estimado segun datos disponibles",
      "",
      "DATOS DEL CLIENTE",
      `Nombre: ${formData.nombre}`,
      `Celular: ${formData.celular}`,
      `Email: ${formData.email}`,
      `ID Sesion: ${SESSION_ID}`,
      "",
      "Deseas continuar con el proceso de venta?",
      "autocash-one.vercel.app | FormularioV2",
    ].join("\n"),
  );
}

function setupWhatsappButton() {
  const whaLink = document.getElementById("whatsappLinkV2");
  if (!whaLink) return;

  const msg = buildWhatsappMessage();
  whaLink.href = `https://wa.me/${WHA_NUMBER}?text=${msg}`;
  whaLink.addEventListener("click", () => {
    track("whatsapp_click", {
      nombre: formData.nombre,
      celular: formData.celular,
      valor: formData.estimadoValor,
      source: "result_screen_v2",
    });
  });
}

function sendWhatsappAutomatic() {
  const msg = buildWhatsappMessage();
  const waUrl = `https://wa.me/${WHA_NUMBER}?text=${msg}`;

  // Registrar el evento
  track("whatsapp_click", {
    nombre: formData.nombre,
    celular: formData.celular,
    valor: formData.estimadoValor,
    source: "auto_send_v2",
  });

  // Abrir WhatsApp en nueva pestaña
  window.open(waUrl, "_blank");
}

function sendPhase2WhatsApp() {
  const ahora = new Date();
  const fechaStr = ahora.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
  });
  const horaStr = ahora.toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const msg = encodeURIComponent(
    [
      "INFORMACION DEL VEHICULO - AutoCash",
      `Fecha: ${fechaStr} ${horaStr}`,
      "",
      "DATOS DEL VEHICULO",
      `Marca y modelo: ${formData.marca} ${formData.modelo}`,
      `Anio: ${formData.anio}`,
      `Kilometraje: ${formatNumber(formData.kilometraje)} km`,
      `Cilindraje: ${formData.cilindraje}L | Carroceria: ${formData.carroceria}`,
      `Transmision: ${formData.transmision} | Combustible: ${formData.combustible}`,
      `Traccion: ${formData.traccion} | Color: ${formData.color}`,
      "",
      "DATOS DEL CLIENTE",
      `Nombre: ${formData.nombre}`,
      `Celular: ${formData.celular}`,
      `Email: ${formData.email}`,
      "",
      "Calculando cotizacion...",
      "autocash-one.vercel.app | FormularioV2",
    ].join("\n"),
  );

  const waUrl = `https://wa.me/${WHA_NUMBER}?text=${msg}`;

  // Registrar el evento
  track("whatsapp_click", {
    nombre: formData.nombre,
    marca: formData.marca,
    modelo: formData.modelo,
    source: "phase2_auto_send_v2",
  });

  // Abrir WhatsApp en nueva pestaña
  window.open(waUrl, "_blank");
}

function setupAgendarButton() {
  const btnAgendar = document.getElementById("btnAgendarV2");
  if (!btnAgendar) return;

  btnAgendar.addEventListener("click", () => {
    const ahora = new Date();
    const fechaStr = ahora.toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
    });
    const horaStr = ahora.toLocaleTimeString("es-EC", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const msg = encodeURIComponent(
      [
        "AGENDAR REUNION - COTIZACION ATERRIZADA",
        `Solicitud: ${fechaStr} ${horaStr}`,
        "",
        "DATOS DEL VEHICULO",
        `Marca y modelo: ${formData.marca} ${formData.modelo}`,
        `Anio: ${formData.anio}`,
        `Kilometraje: ${formatNumber(formData.kilometraje)} km`,
        `Cilindraje: ${formData.cilindraje}L | Carroceria: ${formData.carroceria}`,
        `Transmision: ${formData.transmision} | Combustible: ${formData.combustible}`,
        `Traccion: ${formData.traccion} | Color: ${formData.color}`,
        "",
        "COTIZACION INICIAL",
        `Valor estimado: ${formatUsd(formData.estimadoValor)}`,
        `Rango: ${formatUsd(formData.estimadoMin)} - ${formatUsd(formData.estimadoMax)}`,
        "",
        "SOLICITUD",
        "Quisiera agendar una reunion online (videollamada o WhatsApp) para una cotizacion mas aterrizada de mi vehiculo.",
        "",
        "DATOS DEL CLIENTE",
        `Nombre: ${formData.nombre}`,
        `Celular: ${formData.celular}`,
        `Email: ${formData.email}`,
        `ID Sesion: ${SESSION_ID}`,
        "",
        "Puedo atender en cualquier momento del dia. Cuando esta disponible?",
        "autocash-one.vercel.app - Formulario v2",
      ].join("\n"),
    );

    track("whatsapp_agendar_reunion", {
      nombre: formData.nombre,
      celular: formData.celular,
      valor: formData.estimadoValor,
    });

    const waUrl = `https://wa.me/${WHA_NUMBER}?text=${msg}`;
    window.open(waUrl, "_blank");
  });
}

// ============================================================
// UTILIDADES
// ============================================================
function isValidCellphone(value) {
  // Ecuador: +5939XXXXXXXX, 5939XXXXXXXX, 09XXXXXXXX, 9XXXXXXXX
  const cleaned = String(value).replace(/\D/g, "");
  if (cleaned.startsWith("5939") && cleaned.length === 12) return true;
  if (cleaned.startsWith("09") && cleaned.length === 10) return true;
  if (cleaned.startsWith("9") && cleaned.length === 9) return true;
  return false;
}

function normalizeCellphone(value) {
  const cleaned = String(value).replace(/\D/g, "");
  // Ya viene en formato 5939XXXXXXXX
  if (cleaned.length === 12 && cleaned.startsWith("593")) {
    return cleaned;
  }

  // Formato local 09XXXXXXXX -> 5939XXXXXXXX
  if (cleaned.length === 10 && cleaned.startsWith("0")) {
    return "593" + cleaned.slice(1);
  }

  // Formato corto 9XXXXXXXX -> 5939XXXXXXXX
  if (cleaned.length === 9 && cleaned.startsWith("9")) {
    return "593" + cleaned;
  }

  return cleaned;
}

function isValidEmail(value) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(value).toLowerCase());
}

export function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-EC").format(Number(value));
}
