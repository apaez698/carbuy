import { describe, expect, it, vi } from "vitest";
import { createMockRes } from "./test-utils.js";

const mockInsert = vi.fn().mockResolvedValue({ error: null });

vi.mock("../api/_supabase.js", () => ({
  getSupabase: () => ({
    from: () => ({
      insert: mockInsert,
    }),
  }),
}));

import handler from "../api/track.js";

describe("/api/track", () => {
  it("responde 200 a OPTIONS preflight", async () => {
    const req = {
      method: "OPTIONS",
      headers: {},
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.ended).toBe(true);
  });

  it("rechaza event_type invalido", async () => {
    const req = {
      method: "POST",
      headers: {},
      body: {
        session_id: "session-1",
        event_type: "invalid_event",
      },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
  });
});
