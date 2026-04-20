import { describe, it, expect } from "vitest";
import { buildWhatsAppLink } from "./whatsapp.js";

describe("buildWhatsAppLink", () => {
  it("strips leading 0 and adds 593 prefix", () => {
    const url = buildWhatsAppLink("0991234567", "Ana", "Toyota", "Corolla");
    expect(url).toContain("593991234567");
    expect(url).not.toContain("5930");
  });

  it("does not duplicate 593 prefix when already present", () => {
    const url = buildWhatsAppLink("991234567", "Luis", "Kia", "Sportage");
    expect(url).toContain("593991234567");
    const matches = url.match(/593/g);
    expect(matches).toHaveLength(1);
  });

  it("does not add 593 when number already starts with 593", () => {
    const url = buildWhatsAppLink("593991234567", "Maria", "Ford", "Explorer");
    expect(url).toContain("593991234567");
    const matches = url.match(/593/g);
    expect(matches).toHaveLength(1);
  });

  it("builds a valid wa.me URL", () => {
    const url = buildWhatsAppLink("0991234567", "Ana", "Toyota", "Corolla");
    expect(url).toMatch(/^https:\/\/wa\.me\/593\d+\?text=.+/);
  });

  it("includes nombre, marca and modelo in the message", () => {
    const url = buildWhatsAppLink("0991234567", "Carlos", "Honda", "Civic");
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain("Carlos");
    expect(decoded).toContain("Honda");
    expect(decoded).toContain("Civic");
  });

  it("handles missing celular without crashing", () => {
    const url = buildWhatsAppLink(undefined, "Carlos", "Honda", "Civic");
    expect(url).toContain("https://wa.me/593?text=");
  });
});
