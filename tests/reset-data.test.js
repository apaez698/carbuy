import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRes } from "./test-utils.js";

const mockNeq = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();

vi.mock("../api/_supabase.js", () => ({
  getSupabase: () => ({
    from: mockFrom,
  }),
}));

import handler from "../api/reset-data.js";

describe("POST /api/reset-data", () => {
  beforeEach(() => {
    process.env.DASHBOARD_PASSWORD = "secret";

    mockNeq.mockReset();
    mockDelete.mockReset();
    mockFrom.mockReset();

    mockNeq.mockResolvedValue({ error: null });
    mockDelete.mockReturnValue({ neq: mockNeq });
    mockFrom.mockReturnValue({ delete: mockDelete });
  });

  it("rechaza si la clave no coincide", async () => {
    const req = {
      method: "POST",
      query: { key: "wrong" },
      body: { confirm: "DELETE_TEST_DATA" },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
  });

  it("limpia tablas cuando confirmacion es valida", async () => {
    const req = {
      method: "POST",
      query: { key: "secret" },
      body: { confirm: "DELETE_TEST_DATA" },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(mockFrom).toHaveBeenCalledTimes(3);
    expect(res.body.ok).toBe(true);
  });
});
