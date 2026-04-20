import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRes } from "./test-utils.js";

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();

vi.mock("../api/_supabase.js", () => ({
  getSupabase: () => ({
    from: (table) => {
      if (table === "valuations") {
        return { update: mockUpdate };
      }
      return { insert: mockInsert };
    },
  }),
}));

import handler from "../api/feedback.js";

describe("POST /api/feedback", () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockSelect.mockReset();
    mockSingle.mockReset();
    mockUpdate.mockReset();
    mockEq.mockReset();

    mockInsert.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockSingle.mockResolvedValue({
      data: { id: "feedback-id-1" },
      error: null,
    });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });
  });

  it("rechaza rating invalido", async () => {
    const req = {
      method: "POST",
      headers: {},
      body: { rating: 9, comment: "test" },
    };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("rating");
  });

  it("rechaza sin rating", async () => {
    const req = {
      method: "POST",
      headers: {},
      body: { comment: "test" },
    };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("guarda feedback valido sin valuation_id", async () => {
    const req = {
      method: "POST",
      headers: {},
      body: { rating: 4, comment: "Buen servicio" },
    };
    const res = createMockRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert.mock.calls[0][0].rating).toBe(4);
    expect(mockInsert.mock.calls[0][0].comment).toBe("Buen servicio");
    // No debe intentar actualizar valuations sin valuation_id
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("guarda feedback y actualiza valuation si tiene valuation_id", async () => {
    const req = {
      method: "POST",
      headers: {},
      body: { rating: 5, comment: "Excelente", valuation_id: "val-123" },
    };
    const res = createMockRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert.mock.calls[0][0].valuation_id).toBe("val-123");
    // Debe actualizar valuations con snapshot de feedback
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate.mock.calls[0][0]).toEqual({
      feedback_provided: true,
      feedback_rating: 5,
      feedback_comment: "Excelente",
    });
  });

  it("expone error cuando Supabase falla en insert", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST204", message: "Table not found" },
    });

    const req = {
      method: "POST",
      headers: {},
      body: { rating: 3, comment: "Regular" },
    };
    const res = createMockRes();
    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Error guardando feedback");
  });

  it("rechaza metodo GET", async () => {
    const req = { method: "GET", headers: {} };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });
});
