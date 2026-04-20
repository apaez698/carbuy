const COTIZADOR_BUTTON_ID = "cotizadorButton";
const COTIZADOR_MODAL_ID = "cotizadorModal";
const COTIZADOR_MODAL_CLOSE_ID = "cotizadorModalClose";
const COTIZADOR_OPEN_FORM_ID = "cotizadorOpenForm";

export function isCotizadorButtonEnabled(flags) {
  return Boolean(flags?.COTIZADOR_BUTTON);
}

export function applyCotizadorButtonFlag(flags, doc = document) {
  const button = doc.getElementById(COTIZADOR_BUTTON_ID);
  if (!button) return false;

  const isEnabled = isCotizadorButtonEnabled(flags);
  button.hidden = !isEnabled;
  button.setAttribute("aria-hidden", String(!isEnabled));

  return isEnabled;
}

export function openFormularioV1({ doc = document, showStepFn } = {}) {
  showStepFn?.(1);
  const form = doc.getElementById("formulario");
  form?.scrollIntoView?.({ behavior: "smooth", block: "start" });
}

export function initCotizadorModal({ doc = document, onOpenFormulario } = {}) {
  const button = doc.getElementById(COTIZADOR_BUTTON_ID);
  const modal = doc.getElementById(COTIZADOR_MODAL_ID);
  const closeButton = doc.getElementById(COTIZADOR_MODAL_CLOSE_ID);
  const openFormButton = doc.getElementById(COTIZADOR_OPEN_FORM_ID);

  if (!button || !modal || !closeButton || !openFormButton) {
    return null;
  }

  const openModal = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    doc.body.classList.add("cotizador-modal-open");
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    doc.body.classList.remove("cotizador-modal-open");
  };

  button.addEventListener("click", openModal);
  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  openFormButton.addEventListener("click", () => {
    closeModal();
    onOpenFormulario?.();
  });

  doc.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

  return { openModal, closeModal };
}
