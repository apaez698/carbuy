const form = document.getElementById("feedbackForm");
const messageEl = document.getElementById("formMessage");
const submitButton = document.getElementById("submitButton");
const issuesGroup = document.getElementById("issuesGroup");

if (issuesGroup) {
  issuesGroup.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.name !== "section4_issues") return;

    const checks = Array.from(
      issuesGroup.querySelectorAll('input[name="section4_issues"]'),
    );

    if (target.value === "none" && target.checked) {
      checks.forEach((item) => {
        if (item.value !== "none") item.checked = false;
      });
      return;
    }

    if (target.value !== "none" && target.checked) {
      const noneOption = checks.find((item) => item.value === "none");
      if (noneOption) noneOption.checked = false;
    }
  });
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    setMessage("Completa todas las preguntas obligatorias.", "error");
    form.reportValidity();
    return;
  }

  const selectedIssues = getCheckedValues("section4_issues");
  if (selectedIssues.length === 0) {
    setMessage(
      "Selecciona al menos una opcion en 'Hubo problemas con...'.",
      "error",
    );
    return;
  }

  const payload = {
    section1_data_entry: getRadioValue("section1_data_entry"),
    section1_understanding: getRadioValue("section1_understanding"),
    section1_missing_data: getTextValue("section1_missing_data"),

    section2_price_justice: getRadioValue("section2_price_justice"),
    section2_price_details: getTextValue("section2_price_details"),
    section2_recommend: getRadioValue("section2_recommend"),

    section3_contact_visibility: getRadioValue("section3_contact_visibility"),
    section3_next_steps: getRadioValue("section3_next_steps"),

    section4_navigation: getRadioValue("section4_navigation"),
    section4_issues: selectedIssues,
    section4_improvements: getTextValue("section4_improvements"),

    name: getTextValue("name"),
    contact: getTextValue("contact"),
  };

  try {
    submitButton.disabled = true;
    setMessage("Enviando feedback...", "");

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await readResponseBody(response);
    if (!response.ok) {
      const details = buildErrorDetails(data);
      throw new Error(
        `Error ${response.status}: ${data?.error || "No se pudo enviar el feedback"}${details}`,
      );
    }

    setMessage("Gracias. Tu feedback fue enviado correctamente.", "success");
    form.reset();
  } catch (error) {
    setMessage(error.message || "Ocurrio un error inesperado.", "error");
  } finally {
    submitButton.disabled = false;
  }
});

function getRadioValue(name) {
  const input = form.querySelector(`input[name="${name}"]:checked`);
  return input ? input.value : null;
}

function getTextValue(name) {
  const input = form.querySelector(`[name="${name}"]`);
  if (!input) return null;
  const value = String(input.value || "").trim();
  return value || null;
}

function getCheckedValues(name) {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map(
    (input) => input.value,
  );
}

function setMessage(text, kind) {
  messageEl.textContent = text;
  messageEl.classList.remove("error", "success");
  if (kind) messageEl.classList.add(kind);
}

async function readResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  try {
    const text = await response.text();
    return { error: text || "Respuesta sin cuerpo" };
  } catch {
    return { error: "No se pudo leer la respuesta del servidor" };
  }
}

function buildErrorDetails(data) {
  if (!data) return "";

  const parts = [];
  if (data.requestId) parts.push(`requestId=${data.requestId}`);
  if (data.supabaseHost) parts.push(`supabaseHost=${data.supabaseHost}`);
  if (data?.debug?.code) parts.push(`code=${data.debug.code}`);
  if (data?.debug?.message) parts.push(`message=${data.debug.message}`);
  if (data?.debug?.details) parts.push(`details=${data.debug.details}`);
  if (data?.debug?.hint) parts.push(`hint=${data.debug.hint}`);
  if (data?.debug?.vercelEnv) parts.push(`env=${data.debug.vercelEnv}`);
  if (data?.debug?.leadsProbe) {
    const probe = data.debug.leadsProbe;
    const probeTxt = `leadsProbe.ok=${Boolean(probe.ok)}${probe.error ? `,leadsProbe.error=${probe.error}` : ""}`;
    parts.push(probeTxt);
  }

  return parts.length ? ` | ${parts.join(" | ")}` : "";
}
