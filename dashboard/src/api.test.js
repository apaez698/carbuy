import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthError, clearTestData, fetchMetric } from "./api.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchMetric", () => {
  it("throws AuthError on 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
      }),
    );

    await expect(fetchMetric("secret", "overview")).rejects.toBeInstanceOf(
      AuthError,
    );
  });

  it("returns JSON on 200", async () => {
    const payload = { leads: 10 };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: vi.fn().mockResolvedValue(payload),
      }),
    );

    await expect(fetchMetric("secret", "overview")).resolves.toEqual(payload);
  });
});

describe("clearTestData", () => {
  it("returns detailed success result when response is ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true }),
      }),
    );

    await expect(clearTestData("secret")).resolves.toEqual({
      ok: true,
      status: 200,
      error: null,
    });
  });

  it("returns detailed failure result when response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 400,
        ok: false,
        json: vi.fn().mockResolvedValue({ error: "Confirmacion invalida" }),
      }),
    );

    await expect(clearTestData("secret")).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Confirmacion invalida",
    });
  });
});
