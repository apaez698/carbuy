import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("triggers fetch when clicking refresh", async () => {
    renderWithQueryClient(<App />);

    fireEvent.change(screen.getByLabelText("Contraseña del dashboard"), {
      target: { value: "mi-clave" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    const fetchMock = global.fetch;
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    const callsBeforeRefresh = fetchMock.mock.calls.length;

    fireEvent.click(screen.getByRole("button", { name: "↻ Actualizar" }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBeforeRefresh);
    });
  });

  it("updates lastUpdate on auto interval", () => {
    vi.useFakeTimers();

    renderWithQueryClient(<App />);

    fireEvent.change(screen.getByLabelText("Contraseña del dashboard"), {
      target: { value: "mi-clave" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByText(/Actualizado/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(screen.getByText(/Actualizado/)).toBeInTheDocument();
  });

  it("navigates to dedicated leads page from sidebar", async () => {
    renderWithQueryClient(<App />);

    fireEvent.change(screen.getByLabelText("Contraseña del dashboard"), {
      target: { value: "mi-clave" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    fireEvent.click(screen.getByRole("button", { name: /Leads/ }));

    await waitFor(() => {
      expect(screen.getByText("Últimos leads")).toBeInTheDocument();
    });
    expect(screen.queryByText("Funnel de conversión")).not.toBeInTheDocument();
  });

  it("navigates to conversion page from sidebar", async () => {
    renderWithQueryClient(<App />);

    fireEvent.change(screen.getByLabelText("Contraseña del dashboard"), {
      target: { value: "mi-clave" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    fireEvent.click(screen.getByRole("button", { name: /Conversión/ }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Conversión" })).toBeInTheDocument();
    });
    expect(screen.getByText("🚧 Aún lo estamos construyendo.")).toBeInTheDocument();
  });

  it("navigates to funnel page with only funnel info", async () => {
    renderWithQueryClient(<App />);

    fireEvent.change(screen.getByLabelText("Contraseña del dashboard"), {
      target: { value: "mi-clave" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    fireEvent.click(screen.getByRole("button", { name: /Funnel/ }));

    await waitFor(() => {
      expect(screen.getByText("Funnel de conversión")).toBeInTheDocument();
    });
    expect(screen.queryByText("Últimos leads")).not.toBeInTheDocument();
  });

  it("shows coming soon page for Formularios and WhatsApp", async () => {
    renderWithQueryClient(<App />);

    fireEvent.change(screen.getByLabelText("Contraseña del dashboard"), {
      target: { value: "mi-clave" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    fireEvent.click(screen.getByRole("button", { name: /Formularios/ }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Formularios" })).toBeInTheDocument();
    });
    expect(screen.getByText("🚧 Aún lo estamos construyendo.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /WhatsApp/ }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "WhatsApp" })).toBeInTheDocument();
    });
    expect(screen.getByText("🚧 Aún lo estamos construyendo.")).toBeInTheDocument();
  });
});
