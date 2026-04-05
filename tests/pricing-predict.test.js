import { afterEach, describe, expect, it, vi } from "vitest";

import handler from "../api/pricing-predict.js";
import { createMockRes } from "./test-utils.js";

describe("api/pricing-predict", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.__pricingPredictCache;
  });

  it("returns 200 with local fallback when upstream requires computed features", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          error: {
            message: "Validation failed",
            details: {
              payload: [
                "Missing computed features required by feature_order: motor_cc, potencia_hp, carroceria, tipo_combustible, traccion, segmento, pais_origen",
              ],
            },
          },
        }),
      }),
    );

    const req = {
      method: "POST",
      body: {
        vehicle: {
          anio: 2020,
          kilometraje: 45000,
          cilindrada: 4.0,
          marca: "TOYOTA",
          modelo: "LAND CRUISER",
          tipo: "SUV",
          transmision: "MANUAL",
          combustible: "DESCONOCIDO",
          provincia: "PICHINCHA",
          color: "BLANCO",
        },
      },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeTruthy();
    expect(res.body.source).toBe("local_fallback_v1");
    expect(Number.isFinite(Number(res.body.predicted_value))).toBe(true);
    expect(res.body.range_min).toBeLessThanOrEqual(res.body.predicted_value);
    expect(res.body.range_max).toBeGreaterThanOrEqual(res.body.predicted_value);
  });

  it("keeps upstream 422 when the error is not missing computed features", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          error: {
            message: "Validation failed",
            details: {
              modelo: {
                received: "LAND CRUISER",
                valid_options: ["COROLLA", "YARIS"],
              },
            },
          },
        }),
      }),
    );

    const req = {
      method: "POST",
      body: {
        vehicle: {
          anio: 2020,
          kilometraje: 45000,
          cilindrada: 4.0,
          marca: "TOYOTA",
          modelo: "LAND CRUISER",
          tipo: "SUV",
          transmision: "MANUAL",
          combustible: "DESCONOCIDO",
          provincia: "PICHINCHA",
          color: "BLANCO",
        },
      },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(422);
    expect(res.body).toBeTruthy();
    expect(res.body.error?.message).toBe("Validation failed");
  });
});
