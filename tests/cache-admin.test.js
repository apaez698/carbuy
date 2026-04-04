import { beforeEach, describe, expect, it } from "vitest";
import { createMockRes } from "./test-utils.js";
import handler from "../api/cache-admin.js";

describe("/api/cache-admin", () => {
  beforeEach(() => {
    process.env.DASHBOARD_PASSWORD = "secret";

    globalThis.__pricingPredictCache = new Map([
      ["k1", { value: { amount: 1 }, expiresAt: Date.now() + 60_000 }],
      ["k2", { value: { amount: 2 }, expiresAt: Date.now() + 120_000 }],
    ]);

    globalThis.__pricingMetadataCache = {
      value: { marcas: ["Toyota"] },
      expiresAt: Date.now() + 180_000,
    };
  });

  it("GET requires dashboard key", async () => {
    const req = { method: "GET", query: { key: "wrong" } };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
  });

  it("GET returns cache state", async () => {
    const req = { method: "GET", query: { key: "secret" } };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.predict.size).toBe(2);
    expect(res.body.metadata.hasValue).toBe(true);
  });

  it("POST clear_predict empties only predict cache", async () => {
    const req = {
      method: "POST",
      query: { key: "secret" },
      body: { action: "clear_predict" },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.predict.size).toBe(0);
    expect(res.body.metadata.hasValue).toBe(true);
  });

  it("POST clear_all empties predict and metadata cache", async () => {
    const req = {
      method: "POST",
      query: { key: "secret" },
      body: { action: "clear_all" },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.predict.size).toBe(0);
    expect(res.body.metadata.hasValue).toBe(false);
  });
});
