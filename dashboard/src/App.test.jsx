import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("App", () => {
  it("shows password form when not authenticated", () => {
    renderWithQueryClient(<App />);

    expect(
      screen.getByLabelText("Contraseña del dashboard"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("shows loading message after submit", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));

    renderWithQueryClient(<App />);

    fireEvent.change(screen.getByLabelText("Contraseña del dashboard"), {
      target: { value: "mi-clave" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });
});
