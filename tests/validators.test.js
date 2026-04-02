import { describe, expect, it } from "vitest";
import { isValidEmail, normalizeEcCellphone } from "../api/_validators.js";

describe("normalizeEcCellphone", () => {
  it("normaliza formato local 09XXXXXXXX", () => {
    expect(normalizeEcCellphone("0987444724")).toBe("593987444724");
  });

  it("normaliza formato internacional +593XXXXXXXXX", () => {
    expect(normalizeEcCellphone("+593987444724")).toBe("593987444724");
  });

  it("acepta formato 9XXXXXXXX y completa codigo", () => {
    expect(normalizeEcCellphone("987444724")).toBe("593987444724");
  });

  it("retorna null en formatos invalidos", () => {
    expect(normalizeEcCellphone("12345")).toBeNull();
  });
});

describe("isValidEmail", () => {
  it("valida email correcto", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
  });

  it("rechaza email invalido", () => {
    expect(isValidEmail("correo-invalido")).toBe(false);
  });
});
