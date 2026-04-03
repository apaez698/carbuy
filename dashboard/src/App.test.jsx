import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App.jsx";

afterEach(() => {
  cleanup();
});

describe("App", () => {
  it("shows password form when not authenticated", () => {
    render(<App />);

    expect(
      screen.getByLabelText("Contraseña del dashboard"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("shows authenticated message after submit", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Contraseña del dashboard"), {
      target: { value: "mi-clave" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByText("Autenticado")).toBeInTheDocument();
  });
});
