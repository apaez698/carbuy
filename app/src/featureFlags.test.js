import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FLAGS, getFlag, setFlag } from "./featureFlags.js";

function createStorageMock(initialStore = {}) {
  let store = { ...initialStore };

  return {
    getItem: vi.fn((key) =>
      Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null,
    ),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
}

describe("featureFlags", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal("localStorage", createStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getFlag returns default when localStorage is empty", () => {
    expect(getFlag("NEW_LEADS_VIEW")).toBe(FLAGS.NEW_LEADS_VIEW);
    expect(getFlag("SHOW_EXPORT_BUTTON")).toBe(FLAGS.SHOW_EXPORT_BUTTON);
  });

  it("setFlag and getFlag persist the correct value", () => {
    setFlag("NEW_LEADS_VIEW", true);

    expect(getFlag("NEW_LEADS_VIEW")).toBe(true);
  });

  it("getFlag returns false for unknown flag names", () => {
    expect(getFlag("NOT_A_REAL_FLAG")).toBe(false);
  });
});
