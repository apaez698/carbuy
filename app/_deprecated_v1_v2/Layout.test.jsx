import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Layout from "./Layout.jsx";

afterEach(() => {
  cleanup();
});

function renderLayout(props = {}) {
  return render(
    <MemoryRouter>
      <Layout
        password="secret"
        onRefresh={vi.fn()}
        onClearData={vi.fn()}
        lastUpdate="Hace 1 min"
        {...props}
      >
        <p>Contenido</p>
      </Layout>
    </MemoryRouter>,
  );
}

describe("Layout", () => {
  it("renders the VendoYa wordmark", () => {
    renderLayout();

    expect(screen.getByText("Vendo")).toBeInTheDocument();
    expect(screen.getByText("Ya")).toBeInTheDocument();
  });

  it("sets active class to Leads and removes it from previous item", () => {
    renderLayout();

    const resumenItem = screen.getByText("Resumen").closest(".nav-item");
    const leadsItem = screen.getByText("Leads").closest(".nav-item");

    expect(resumenItem).toHaveClass("active");
    expect(leadsItem).not.toHaveClass("active");

    fireEvent.click(leadsItem);

    expect(leadsItem).toHaveClass("active");
    expect(resumenItem).not.toHaveClass("active");
  });

  it("calls onRefresh when clicking update button", () => {
    const onRefresh = vi.fn();
    renderLayout({ onRefresh });

    fireEvent.click(screen.getByRole("button", { name: "↻ Actualizar" }));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});