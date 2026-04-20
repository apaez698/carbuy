import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useMetric from "./useMetric.js";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useMetric", () => {
  it("starts with isLoading in true", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));

    const { result } = renderHook(() => useMetric("secret", "kpis"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("returns data when fetch resolves 200", async () => {
    const payload = { total: 42 };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: vi.fn().mockResolvedValue(payload),
      }),
    );

    const { result } = renderHook(() => useMetric("secret", "kpis"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(payload);
    expect(result.current.isError).toBe(false);
  });
});
