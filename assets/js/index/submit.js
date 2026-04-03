import { WHA_NUMBER } from "./constants.js";
import { api, track, SESSION_ID, utmParams } from "./tracking.js";
import { validateStep } from "./validation.js";
import { getModeloValueForSubmit } from "./catalog.js";
import { updateEstimate } from "./estimator.js";
import { getStepStart } from "./steps.js";

export function toggleCheck(id) {
  document.getElementById(id).checked ^= true;
  updateEstimate();
}

export function toggleWhatsappAccept(event) {
  const input = document.getElementById("whaAccept");
  if (!input) return;
  const target = event.target;
  if (target === input || target.closest("label")) return;
  input.checked = !input.checked;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function row(k, v) {
  return (
    '<div class="data-row"><span class="key">' +
    k +
    '</span><span class="val">' +
    v +
    "</span></div>"
  );
}

export async function submitForm() {
  if (!validateStep(3)) return;

  const v = (id) => document.getElementById(id)?.value?.trim() || "";

  const marca = v("marca");
  const modelo = getModeloValueForSubmit() || "No especificado";
  const anio = v("anio");
  const tipo = v("tipo") || "No especificado";
  const combustible = v("combustible") || "No especificado";
  const transmision = v("transmision") || "No especificado";
  const km = v("kilometraje") || "No especificado";
  const color = v("color") || "No especificado";
  const placa = v("placa") || "No ingresada";
  const estado =
    document.querySelector('input[name="estado"]:checked')?.value ||
    "No indicado";
  const rtv =
    document.querySelector('input[name="rtv"]:checked')?.value || "No indicado";
  const estimado = "Proximamente por WhatsApp";
  const observaciones = v("observaciones") || "Ninguna";
  const nombre = v("nombre");
  const cedula = v("cedula") || "No ingresada";
  const celular = v("celular");
  const email = v("email");
  const ciudad = v("ciudad");
  const horario = v("horario");
  const precioEsp = v("precioEsperado") || "No especificado";
  const whaAcept = document.getElementById("whaAccept").checked;

  const accsMap = {
    acc1: "Aire acondicionado",
    acc2: "Vidrios eléctricos",
    acc3: "Cámara de reversa",
    acc4: "Sensores de parqueo",
    acc5: "Pantalla táctil / GPS",
    acc6: "Sunroof",
    acc7: "Asientos de cuero",
    acc8: "4x4 / Tracción total",
    acc9: "Aros de lujo",
    acc10: "Historial de servicio",
  };
  const accsSeleccionados = Object.entries(accsMap)
    .filter(([id]) => document.getElementById(id)?.checked)
    .map(([, l]) => l);

  await api("/api/lead", {
    marca,
    modelo,
    anio,
    tipo,
    combustible,
    transmision,
    kilometraje: km,
    color,
    placa,
    estado_general: estado,
    rtv_vigente: rtv,
    accesorios: accsSeleccionados,
    observaciones,
    estimado_min: null,
    estimado_max: null,
    estimado_texto: estimado,
    precio_esperado: precioEsp,
    nombre,
    cedula,
    celular,
    email,
    ciudad,
    horario,
    acepta_wha: whaAcept,
    session_id: SESSION_ID,
    utm_source: utmParams.get("utm_source"),
    utm_medium: utmParams.get("utm_medium"),
    utm_campaign: utmParams.get("utm_campaign"),
  });

  api(
    "/api/session",
    { id: SESSION_ID, converted: true, max_step: 3 },
    "PATCH",
  );
  track("form_submit", {
    marca,
    anio,
    estimado,
    ciudad,
    time_on_step: Math.round((Date.now() - getStepStart()) / 1000),
  });

  const ahora = new Date();
  const fechaStr = ahora.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
  });
  const horaStr = ahora.toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  });

  document.getElementById("successData").innerHTML =
    "<h4>📋 Resumen de tu solicitud</h4>" +
    row("Auto", marca + " " + modelo + " " + anio) +
    row("Tipo", tipo) +
    row("Combustible", combustible) +
    row("Transmisión", transmision) +
    row("Kilometraje", km) +
    row("Estado", estado) +
    row(
      "Cotizacion",
      '<span style="color:var(--green);font-size:17px">La recibiras por WhatsApp</span>',
    ) +
    row("Vendedor", nombre) +
    row("Celular", celular) +
    row("Ciudad", ciudad) +
    row("Precio esperado", precioEsp);

  const msg = encodeURIComponent(
    [
      "NUEVA COTIZACION - AutoCash",
      "Fecha: " + fechaStr + " " + horaStr,
      "",
      "DATOS DEL VEHICULO",
      "Marca y modelo: " + marca + " " + modelo,
      "Anio: " + anio,
      "Tipo: " + tipo,
      "Combustible: " + combustible,
      "Transmision: " + transmision,
      "Kilometraje: " + km,
      "Color: " + color,
      "Placa: " + placa,
      "",
      "ESTADO Y EXTRAS",
      "Estado: " + estado,
      "Revision tecnica: " + rtv,
      "Accesorios: " + (accsSeleccionados.join(", ") || "Ninguno"),
      "Observaciones: " + observaciones,
      "",
      "COTIZACION",
      "Estado de cotizacion: " + estimado,
      "Precio esperado: " + precioEsp,
      "(Sujeto a revision tecnica)",
      "",
      "VENDEDOR",
      "Nombre: " + nombre,
      "Cedula: " + cedula,
      "Celular: " + celular,
      "Correo: " + email,
      "Ciudad: " + ciudad,
      "Horario: " + horario,
      "Acepta WhatsApp: " + (whaAcept ? "Si" : "No"),
      "",
      "ID: " + SESSION_ID,
      "autocash-one.vercel.app",
    ].join("\n"),
  );

  const whaLink = document.getElementById("whatsappLink");
  whaLink.href = "https://wa.me/" + WHA_NUMBER + "?text=" + msg;
  whaLink.addEventListener(
    "click",
    () => track("whatsapp_click", { nombre, celular, estimado }),
    { once: true },
  );

  document
    .querySelectorAll(".form-step")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("formNav").style.display = "none";
  document.getElementById("successScreen").classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
