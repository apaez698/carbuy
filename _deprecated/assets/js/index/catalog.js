import { BRAND_ALIASES, BRAND_MODEL_MAP } from "./constants.js";
import { clearFieldError } from "./validation.js";

let estimatorCatalog = {};

export function normalizeCatalogText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

export const NORMALIZED_BRAND_MODEL_MAP = Object.entries(
  BRAND_MODEL_MAP,
).reduce((acc, [brand, models]) => {
  acc[normalizeCatalogText(brand)] = models;
  return acc;
}, {});

export function setSelectOptions(selectId, values, placeholder) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = placeholder;
  select.appendChild(defaultOption);

  (values || []).forEach((item) => {
    const value =
      item && typeof item === "object" ? item.value : String(item || "");
    const label =
      item && typeof item === "object" ? item.label : String(item || "");
    const normalized = normalizeCatalogText(value);

    const isDesconocido =
      normalized === "DESCONOCIDO" ||
      normalized === "UNKNOWN" ||
      normalized === "NO DEFINIDO" ||
      normalized === "N/A";

    if (isDesconocido && selectId !== "modelo") return;

    const option = document.createElement("option");
    option.value = String(value);
    option.textContent =
      normalized === "DESCONOCIDO" ? "Desconocido" : String(label);
    select.appendChild(option);
  });
}

export function getModelosByMarca(marcaValue) {
  const normalizedMarca = normalizeCatalogText(marcaValue);
  if (!normalizedMarca) return [];

  const aliasTarget = BRAND_ALIASES[normalizedMarca];
  if (aliasTarget) {
    const aliasModels =
      NORMALIZED_BRAND_MODEL_MAP[normalizeCatalogText(aliasTarget)];
    if (Array.isArray(aliasModels)) return aliasModels;
  }

  return NORMALIZED_BRAND_MODEL_MAP[normalizedMarca] || [];
}

export function ensureModeloOtherOption() {
  const modeloSelect = document.getElementById("modelo");
  if (!modeloSelect) return;

  const hasOther = Array.from(modeloSelect.options).some(
    (opt) => opt.value === "OTRO",
  );
  if (hasOther) return;

  const otherOption = document.createElement("option");
  otherOption.value = "OTRO";
  otherOption.textContent = "Otra (escribir modelo)";
  modeloSelect.appendChild(otherOption);
}

export function toggleModeloOtroField() {
  const modeloValue = (document.getElementById("modelo")?.value || "").trim();
  const modeloOtroField = document.getElementById("modeloOtroField");
  const modeloOtroInput = document.getElementById("modeloOtro");

  const useOtro = modeloValue === "OTRO";
  if (modeloOtroField) modeloOtroField.hidden = !useOtro;

  if (!useOtro && modeloOtroInput) {
    modeloOtroInput.value = "";
    clearFieldError("modeloOtro");
  }
}

export function getModeloValueForSubmit() {
  const modelo = (document.getElementById("modelo")?.value || "").trim();
  if (modelo !== "OTRO") return modelo;
  return (document.getElementById("modeloOtro")?.value || "").trim();
}

export function getProvinciaOptions() {
  return [
    { value: "AZUAY", label: "Azuay" },
    { value: "EL ORO", label: "El Oro" },
    { value: "GUAYAS", label: "Guayas" },
    { value: "ORELLANA", label: "Orellana" },
    { value: "PICHINCHA", label: "Pichincha" },
    {
      value: "SANTO DOMINGO DE LOS TSÁCHILAS",
      label: "Santo Domingo de los Tsáchilas",
    },
  ];
}

export function refreshModeloByMarca() {
  const marca = (document.getElementById("marca")?.value || "").trim();
  const modelos = getModelosByMarca(marca);

  setSelectOptions(
    "modelo",
    modelos,
    marca ? "Seleccionar modelo" : "Selecciona primero una marca",
  );
  ensureModeloOtherOption();

  const modeloSelect = document.getElementById("modelo");
  if (modeloSelect) modeloSelect.disabled = !marca;

  toggleModeloOtroField();
}

export async function loadEstimatorMetadata() {
  const apiError = document.getElementById("estimateApiError");

  try {
    const res = await fetch("/api/pricing-metadata", {
      method: "GET",
    });
    if (!res.ok) throw new Error("No se pudo cargar metadata");

    const metadata = await res.json();
    const categoricalValues = metadata?.categorical_values || {};
    estimatorCatalog = categoricalValues;

    setSelectOptions("color", categoricalValues.color, "Seleccionar");

    const marcasApi = Array.isArray(categoricalValues.marca)
      ? categoricalValues.marca
      : [];
    const marcasDisponibles = [...new Set(marcasApi)].filter(
      (m) => getModelosByMarca(m).length > 0,
    );

    setSelectOptions("marca", marcasDisponibles, "Seleccionar marca");
    if (marcasDisponibles.length === 0) {
      setSelectOptions(
        "marca",
        Object.keys(BRAND_MODEL_MAP),
        "Seleccionar marca",
      );
    }

    setSelectOptions(
      "provincia",
      getProvinciaOptions(),
      "Seleccionar provincia",
    );
    setSelectOptions(
      "transmision",
      categoricalValues.transmision,
      "Seleccionar",
    );

    refreshModeloByMarca();
  } catch (err) {
    console.error("[AutoValor] Error cargando /metadata:", err);
    apiError.textContent =
      "Estamos mejorando nuestra plataforma. No se pudo cargar la metadata del estimador.";
    apiError.classList.add("show");
    refreshModeloByMarca();
  }
}
