import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRes } from "./test-utils.js";

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

vi.mock("../api/_supabase.js", () => ({
  getSupabase: () => ({
    from: () => ({
      insert: mockInsert,
    }),
  }),
}));

import handler from "../api/lead.js";

describe("POST /api/lead", () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockSelect.mockReset();
    mockSingle.mockReset();

    mockInsert.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      single: mockSingle,
    });
    mockSingle.mockResolvedValue({
      data: { id: "lead-id-1" },
      error: null,
    });
  });

  it("rechaza celular invalido", async () => {
    const req = {
      method: "POST",
      headers: {},
      body: {
        nombre: "Ana",
        celular: "123",
        email: "ana@test.com",
        marca: "Toyota",
      },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("Celular invalido");
  });

  it("normaliza celular local y guarda lead", async () => {
    const req = {
      method: "POST",
      headers: { "user-agent": "Vitest" },
      body: {
        nombre: "Ana",
        celular: "0987444724",
        email: "ana@test.com",
        marca: "Toyota",
      },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert.mock.calls[0][0].celular).toBe("593987444724");
    expect(res.body.ok).toBe(true);
  });
});
