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

import handler from "../api/feedback.js";

function validBody() {
  return {
    section1_data_entry: 5,
    section1_understanding: 4,
    section1_missing_data: "Historial de mantenimiento",

    section2_price_justice: "fair",
    section2_price_details: "Alineado con lo que esperaba",
    section2_recommend: 5,

    section3_contact_visibility: 5,
    section3_next_steps: 4,

    section4_navigation: 4,
    section4_issues: ["none"],
    section4_improvements: "Mejorar microcopys",

    name: "Luis",
    contact: "luis@test.com",
  };
}

describe("POST /api/feedback", () => {
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
      data: { id: "feedback-id-1" },
      error: null,
    });
  });

  it("rechaza escala invalida", async () => {
    const req = {
      method: "POST",
      headers: {},
      body: {
        ...validBody(),
        section1_data_entry: 9,
      },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("Escalas invalidas");
  });

  it("rechaza cuando no se seleccionan issues", async () => {
    const req = {
      method: "POST",
      headers: {},
      body: {
        ...validBody(),
        section4_issues: [],
      },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("Debes seleccionar");
  });

  it("guarda feedback valido", async () => {
    const req = {
      method: "POST",
      headers: {
        "user-agent": "Vitest",
        "x-forwarded-for": "10.20.30.40",
      },
      body: validBody(),
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert.mock.calls[0][0].ip_address).toBe("10.20.30.40");
    expect(mockInsert.mock.calls[0][0].section4_issues).toBe("none");
  });

  it("ignora ip invalida en headers y guarda igual", async () => {
    const req = {
      method: "POST",
      headers: {
        "user-agent": "Vitest",
        "x-forwarded-for": "unknown",
      },
      body: validBody(),
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert.mock.calls[0][0].ip_address).toBeNull();
  });

  it("expone detalle de error cuando Supabase falla", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: {
        code: "PGRST204",
        message: "Could not find the column",
        details: "column section2_price_details does not exist",
        hint: null,
      },
    });

    const req = {
      method: "POST",
      headers: { "user-agent": "Vitest" },
      body: validBody(),
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Error guardando feedback");
    expect(res.body.requestId).toBeTruthy();
    expect(res.body.debug.code).toBe("PGRST204");
  });
});
