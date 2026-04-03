import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRes } from "./test-utils.js";

const rows = new Map();

function buildSupabaseMock() {
  return {
    from: (table) => {
      if (table !== "feature_flags") {
        throw new Error("Unexpected table");
      }

      return {
        select: vi.fn(async () => ({
          data: [...rows.entries()].map(([name, enabled]) => ({
            name,
            enabled,
          })),
          error: null,
        })),
        upsert: vi.fn(async (payload) => {
          rows.set(payload.name, Boolean(payload.enabled));
          return { error: null };
        }),
      };
    },
  };
}

vi.mock("../api/_supabase.js", () => ({
  getSupabase: () => buildSupabaseMock(),
}));

import handler from "../api/flags.js";

describe("/api/flags", () => {
  beforeEach(() => {
    rows.clear();
    rows.set("NEW_LEADS_VIEW", true);
  });

  it("GET returns defaults merged with DB values", async () => {
    const req = { method: "GET", query: {} };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.flags.NEW_LEADS_VIEW).toBe(true);
    expect(res.body.flags.SHOW_EXPORT_BUTTON).toBe(false);
  });

  it("POST requires dashboard key", async () => {
    process.env.DASHBOARD_PASSWORD = "secret";

    const req = {
      method: "POST",
      query: { key: "wrong" },
      body: { name: "NEW_LEADS_VIEW", value: false },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
  });

  it("POST updates supported flags", async () => {
    process.env.DASHBOARD_PASSWORD = "secret";

    const req = {
      method: "POST",
      query: { key: "secret" },
      body: { name: "SHOW_EXPORT_BUTTON", value: true },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.flags.SHOW_EXPORT_BUTTON).toBe(true);
  });
});
