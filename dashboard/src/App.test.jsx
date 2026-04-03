import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import App from "./App.jsx";

function renderWithQueryClient(ui) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: vi.fn().mockResolvedValue({
        totalSessions: 0,
        totalLeads: 0,
        whaClicks: 0,
        leadsHoy: 0,
        leadsAyer: 0,
        sesHoy: 0,
        sesAyer: 0,
      }),
    }),
  );
});

describe("App", () => {
  it("shows password form when not authenticated", () => {
    renderWithQueryClient(<App />);

    expect(
      screen.getByLabelText("Contraseña del dashboard"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("shows layout content after submit", () => {
    renderWithQueryClient(<App />);

    fireEvent.change(screen.getByLabelText("Contraseña del dashboard"), {
      target: { value: "mi-clave" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByText("Vendo")).toBeInTheDocument();
    expect(screen.getByText("Ya")).toBeInTheDocument();
    expect(screen.getByText("Visitas totales")).toBeInTheDocument();
    expect(screen.getByText("Leads recibidos")).toBeInTheDocument();
  });

  it("updates lastUpdate on refresh and auto interval", () => {
    vi.useFakeTimers();

    renderWithQueryClient(<App />);

    fireEvent.change(screen.getByLabelText("Contraseña del dashboard"), {
      target: { value: "mi-clave" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByText(/Actualizado/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "↻ Actualizar" }));
    expect(screen.getByText(/Actualizado/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(screen.getByText(/Actualizado/)).toBeInTheDocument();
  });
});
