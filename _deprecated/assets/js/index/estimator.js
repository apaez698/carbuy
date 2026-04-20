import { clearFieldError, setFieldError } from "./validation.js";
import { getModeloValueForSubmit } from "./catalog.js";
import { track } from "./tracking.js";

export function updateEstimate() {
  document.getElementById("estimateApiError")?.classList.remove("show");
}

export function parsePredictNumeric(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function buildVehiclePayload() {
  const fieldsToReset = [
    "anio",
    "kilometraje",
    "cilindrada",
    "color",
    "combustible",
    "estado_carroceria",
    "estado_motor",
    "marca",
    "modelo",
    "modeloOtro",
    "provincia",
    "tipo",
    "transmision",
  ];
  fieldsToReset.forEach(clearFieldError);

  let valid = true;
  const nowYear = new Date().getFullYear() + 1;

  const anio = parseInt(document.getElementById("anio")?.value || "", 10);
  if (!Number.isInteger(anio) || anio < 1980 || anio > nowYear) {
    setFieldError(
      "anio",
      "Ingresa un año válido entre 1980 y " + nowYear + ".",
    );
    valid = false;
  }

  const kilometraje = parseFloat(
    document.getElementById("kilometraje")?.value || "",
  );
  if (!Number.isFinite(kilometraje) || kilometraje < 0) {
    setFieldError("kilometraje", "Ingresa un kilometraje válido (>= 0).");
    valid = false;
  }

  const cilindrada = parseFloat(
    document.getElementById("cilindrada")?.value || "",
  );
  if (!Number.isFinite(cilindrada) || cilindrada < 0.6 || cilindrada > 8) {
    setFieldError(
      "cilindrada",
      "Ingresa cilindrada en litros entre 0.6 y 8.0 (ejemplo: 1.6).",
    );
    valid = false;
  }

  const requiredFields = ["color", "marca", "provincia", "transmision", "tipo"];
  const categoricalValues = {};
  requiredFields.forEach((id) => {
    const value = (document.getElementById(id)?.value || "").trim();
    if (!value) {
      setFieldError(id, "Este campo es obligatorio.");
      valid = false;
    }
    categoricalValues[id] = value;
  });

  const modeloValue = getModeloValueForSubmit();
  if (!modeloValue) {
    const selectedModelo = (
      document.getElementById("modelo")?.value || ""
    ).trim();
    if (selectedModelo === "OTRO") {
      setFieldError("modeloOtro", "Escribe el modelo exacto de tu auto.");
    } else {
      setFieldError("modelo", "Este campo es obligatorio.");
    }
    valid = false;
  }
  categoricalValues.modelo = modeloValue;

  if (!valid) return null;

  categoricalValues.combustible = "DESCONOCIDO";
  categoricalValues.estado_carroceria = "DESCONOCIDO";
  categoricalValues.estado_motor = "DESCONOCIDO";

  return { anio, kilometraje, cilindrada, ...categoricalValues };
}

export function buildPredictPayload(fullPayload) {
  return {
    anio: fullPayload.anio,
    kilometraje: fullPayload.kilometraje,
    cilindrada: fullPayload.cilindrada,
    color: fullPayload.color,
    marca: fullPayload.marca,
    provincia: fullPayload.provincia,
    transmision: fullPayload.transmision,
    tipo: fullPayload.tipo,
    combustible: "DESCONOCIDO",
    estado_carroceria: "DESCONOCIDO",
    estado_motor: "DESCONOCIDO",
    modelo: "DESCONOCIDO",
  };
}

export function setEstimateView(predictedValue, rangeMin, rangeMax) {
  document.getElementById("estRange").textContent = "Resultado";
  document.getElementById("estRangeValue").textContent =
    formatUsd(predictedValue);
  document.getElementById("estRangeInterval").textContent =
    formatUsd(rangeMin) + " - " + formatUsd(rangeMax);
  document.getElementById("estNote").textContent =
    "Este valor es una estimación automática. Puede cambiar tras la revisión física.";
}

export function showEstimateApiError(message) {
  const apiError = document.getElementById("estimateApiError");
  apiError.textContent = message;
  apiError.classList.add("show");
}

function logApiError(context, status, payload, responseData) {
  console.group("%c[AutoValor] " + context, "color:#ef4444;font-weight:bold");
  console.error("Status:", status);
  console.error("Payload enviado:", JSON.stringify(payload, null, 2));
  console.error("Respuesta API:", responseData);
  if (responseData?.error?.details) {
    console.table(
      Object.entries(responseData.error.details).map(([field, detail]) => ({
        campo: field,
        problema:
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail[0]
              : JSON.stringify(detail),
      })),
    );
  }
  console.groupEnd();
}

export async function consultarValor() {
  const btn = document.getElementById("btnEstimate");
  const apiError = document.getElementById("estimateApiError");
  apiError.classList.remove("show");

  const vehicleFullPayload = buildVehiclePayload();
  if (!vehicleFullPayload) return;

  const vehicleForPredict = buildPredictPayload(vehicleFullPayload);

  console.group(
    "%c[AutoValor] Consultando /predict",
    "color:#2563eb;font-weight:bold",
  );
  console.log("Payload completo (guardado):", vehicleFullPayload);
  console.log("Payload para /predict:", vehicleForPredict);
  console.groupEnd();

  btn.disabled = true;
  btn.textContent = "Consultando...";

  try {
    const res = await fetch("/api/pricing-predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicle: vehicleForPredict }),
    });

    const data = await res.json().catch((parseErr) => {
      console.error("[AutoValor] Error parseando JSON de respuesta:", parseErr);
      return {};
    });

    if (!res.ok) {
      logApiError(
        "Error HTTP " + res.status + " en /predict",
        res.status,
        vehicleForPredict,
        data,
      );
      const details = data?.error?.details || {};
      Object.entries(details).forEach(([field, detail]) => {
        if (typeof detail === "string") {
          setFieldError(field, detail);
        } else if (Array.isArray(detail) && detail.length > 0) {
          setFieldError(field, String(detail[0]));
        } else if (detail && typeof detail === "object") {
          const opts = Array.isArray(detail.valid_options)
            ? detail.valid_options.slice(0, 5).join(", ")
            : "";
          setFieldError(
            field,
            opts
              ? "Valor inválido. Opciones sugeridas: " + opts
              : "Valor inválido para este campo.",
          );
        }
      });
      showEstimateApiError(
        "Estamos mejorando nuestra plataforma. No pudimos calcular el valor en este momento.",
      );
      return;
    }

    console.log("[AutoValor] Respuesta exitosa:", data);

    const predictedValue = parsePredictNumeric(data?.predicted_value);
    if (!Number.isFinite(predictedValue)) {
      console.error(
        "[AutoValor] predicted_value inválido:",
        data?.predicted_value,
        "| Respuesta completa:",
        data,
      );
      showEstimateApiError(
        "Estamos mejorando nuestra plataforma. La respuesta del estimador no fue válida.",
      );
      return;
    }

    let rangeMin = parsePredictNumeric(
      data?.range_min ?? data?.lower_bound ?? data?.min_value,
    );
    let rangeMax = parsePredictNumeric(
      data?.range_max ?? data?.upper_bound ?? data?.max_value,
    );

    if (!Number.isFinite(rangeMin) || !Number.isFinite(rangeMax)) {
      console.warn("[AutoValor] Rango no disponible, calculando ±8%.", {
        rangeMin: data?.range_min,
        rangeMax: data?.range_max,
      });
      rangeMin = Math.max(0, predictedValue * 0.92);
      rangeMax = predictedValue * 1.08;
    }

    if (rangeMin > rangeMax) {
      const t = rangeMin;
      rangeMin = rangeMax;
      rangeMax = t;
    }

    setEstimateView(predictedValue, rangeMin, rangeMax);

    track("estimate_view", {
      value: predictedValue,
      marca: vehicleFullPayload.marca,
      anio: vehicleFullPayload.anio,
      km: vehicleFullPayload.kilometraje,
      transmision: vehicleFullPayload.transmision,
    });
  } catch (err) {
    console.error("[AutoValor] Error de red o inesperado en /predict:", err);
    showEstimateApiError(
      "Estamos mejorando nuestra plataforma. No pudimos conectarnos con el estimador.",
    );
  } finally {
    btn.disabled = false;
    btn.textContent = "Consultar valor";
  }
}
