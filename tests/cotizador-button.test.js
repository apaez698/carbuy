import { describe, expect, it, vi } from "vitest";
import {
  applyCotizadorButtonFlag,
  initCotizadorModal,
  isCotizadorButtonEnabled,
  openFormularioV1,
} from "../assets/js/index/cotizadorButton.js";

function createElementMock() {
  const listeners = new Map();

  return {
    hidden: false,
    classList: {
      _classes: new Set(),
      add(name) {
        this._classes.add(name);
      },
      remove(name) {
        this._classes.delete(name);
      },
      contains(name) {
        return this._classes.has(name);
      },
    },
    setAttribute: vi.fn(),
    addEventListener: vi.fn((type, cb) => {
      listeners.set(type, cb);
    }),
    trigger(type, event = {}) {
      const cb = listeners.get(type);
      if (cb) cb(event);
    },
  };
}

function createDocMock() {
  const button = createElementMock();
  const modal = createElementMock();
  const closeButton = createElementMock();
  const openFormButton = createElementMock();
  const form = { scrollIntoView: vi.fn() };
  const keydownListeners = [];

  const doc = {
    body: {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
    },
    getElementById: vi.fn((id) => {
      if (id === "cotizadorButton") return button;
      if (id === "cotizadorModal") return modal;
      if (id === "cotizadorModalClose") return closeButton;
      if (id === "cotizadorOpenForm") return openFormButton;
      if (id === "formulario") return form;
      return null;
    }),
    addEventListener: vi.fn((type, cb) => {
      if (type === "keydown") keydownListeners.push(cb);
    }),
    triggerKeydown(event) {
      for (const cb of keydownListeners) cb(event);
    },
  };

  return {
    doc,
    button,
    modal,
    closeButton,
    openFormButton,
    form,
  };
}

describe("cotizador button", () => {
  it("validates button flag state", () => {
    expect(isCotizadorButtonEnabled({ COTIZADOR_BUTTON: true })).toBe(true);
    expect(isCotizadorButtonEnabled({ COTIZADOR_BUTTON: false })).toBe(false);
  });

  it("applies visibility based on COTIZADOR_BUTTON flag", () => {
    const { doc, button } = createDocMock();

    applyCotizadorButtonFlag({ COTIZADOR_BUTTON: false }, doc);
    expect(button.hidden).toBe(true);

    applyCotizadorButtonFlag({ COTIZADOR_BUTTON: true }, doc);
    expect(button.hidden).toBe(false);
  });

  it("opens V1 form from modal action", () => {
    const { doc, form } = createDocMock();
    const showStepFn = vi.fn();

    openFormularioV1({ doc, showStepFn });

    expect(showStepFn).toHaveBeenCalledWith(1);
    expect(form.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("binds modal open and close behavior", () => {
    const { doc, button, modal, closeButton, openFormButton } = createDocMock();
    const onOpenFormulario = vi.fn();

    initCotizadorModal({ doc, onOpenFormulario });

    button.trigger("click");
    expect(modal.classList.contains("is-open")).toBe(true);

    closeButton.trigger("click");
    expect(modal.classList.contains("is-open")).toBe(false);

    button.trigger("click");
    openFormButton.trigger("click");
    expect(onOpenFormulario).toHaveBeenCalledTimes(1);
  });
});
