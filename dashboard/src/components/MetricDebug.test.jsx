import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MetricDebug from "./MetricDebug.jsx";

vi.mock("../hooks/useMetric.js", () => ({
  default: vi.fn(),
}));

import useMetric from "../hooks/useMetric.js";

afterEach(() => {
  vi.clearAllMocks();
});

describe("MetricDebug", () => {
  it("shows loading state", () => {
    useMetric.mockReturnValue({ data: null, isLoading: true, isError: false });

    render(<MetricDebug password="secret" />);

    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    useMetric.mockReturnValue({ data: null, isLoading: false, isError: true });

    render(<MetricDebug password="secret" />);

    expect(screen.getByText("Error auth")).toBeInTheDocument();
  });

  it("shows data as json", () => {
    useMetric.mockReturnValue({
      data: { leads: 12 },
      isLoading: false,
      isError: false,
    });

    render(<MetricDebug password="secret" />);

    expect(screen.getByText(/"leads": 12/)).toBeInTheDocument();
  });
});
