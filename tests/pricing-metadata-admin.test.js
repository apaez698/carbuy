import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMockRes } from "./test-utils.js";
import handler from "../api/pricing-metadata.js";

describe("api/pricing-metadata _admin mode", () => {
  beforeEach(() => {
    process.env.DASHBOARD_PASSWORD = "secret";
  });

  afterEach(() => {
    delete process.env.DASHBOARD_PASSWORD;
    delete globalThis.__pricingMetadataCache;
  });

  it("_admin=state returns metadata cache state", async () => {
    globalThis.__pricingMetadataCache = {
      value: { marcas: ["Toyota"] },
      expiresAt: Date.now() + 180_000,
    };

    const req = { method: "GET", query: { _admin: "state", key: "secret" } };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.hasValue).toBe(true);
    expect(res.body.ttlMs).toBe(1_800_000);
    expect(res.body.ttlRemainingSec).toBeGreaterThan(0);
    expect(res.body.expiresAtIso).toBeTruthy();
  });

  it("_admin=clear empties metadata cache", async () => {
    globalThis.__pricingMetadataCache = {
      value: { marcas: ["Toyota"] },
      expiresAt: Date.now() + 180_000,
    };

    const req = { method: "GET", query: { _admin: "clear", key: "secret" } };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.hasValue).toBe(false);
    expect(res.body.ttlRemainingSec).toBe(0);
  });

  it("_admin rejects invalid password", async () => {
    const req = { method: "GET", query: { _admin: "state", key: "wrong" } };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
  });
});
