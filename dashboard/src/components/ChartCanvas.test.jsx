import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import ChartCanvas from "./ChartCanvas.jsx";

const mockChartInstances = [];

vi.mock("chart.js/auto", () => {
  const MockChart = vi.fn(function (ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this.destroy = vi.fn();
    this.update = vi.fn();
    mockChartInstances.push(this);
  });

  return {
    default: MockChart,
  };
});

describe("ChartCanvas", () => {
  beforeEach(() => {
    mockChartInstances.length = 0;
  });

  afterEach(() => {
    cleanup();
  });

  it("renders a canvas with the given id", () => {
    const { getByTestId } = render(
      <ChartCanvas
        id="test-chart"
        config={{ type: "bar", data: { labels: [], datasets: [] } }}
      />
    );

    const canvas = getByTestId("chart-canvas-test-chart");
    expect(canvas).toBeDefined();
    expect(canvas.id).toBe("test-chart");
  });

  it("creates a Chart instance on mount", async () => {
    mockChartInstances.length = 0;
    
    const config = { type: "bar", data: { labels: ["a"], datasets: [] } };
    render(<ChartCanvas id="test-chart" config={config} />);

    expect(mockChartInstances.length).toBe(1);
    expect(mockChartInstances[0].config).toEqual(config);
  });

  it("destroys the chart on unmount", async () => {
    mockChartInstances.length = 0;
    
    const config = { type: "bar", data: { labels: ["a"], datasets: [] } };
    const { unmount } = render(
      <ChartCanvas id="test-chart" config={config} />
    );

    const chartInstance = mockChartInstances[0];
    expect(chartInstance.destroy).not.toHaveBeenCalled();

    unmount();

    expect(chartInstance.destroy).toHaveBeenCalled();
  });

  it("destroys and recreates chart when config changes", async () => {
    mockChartInstances.length = 0;
    
    const initialConfig = { type: "bar", data: { labels: ["a"], datasets: [] } };
    const newConfig = { type: "line", data: { labels: ["b"], datasets: [] } };

    const { rerender } = render(
      <ChartCanvas id="test-chart" config={initialConfig} />
    );

    const firstInstance = mockChartInstances[0];
    expect(firstInstance.destroy).not.toHaveBeenCalled();

    rerender(<ChartCanvas id="test-chart" config={newConfig} />);

    expect(firstInstance.destroy).toHaveBeenCalled();
    expect(mockChartInstances.length).toBe(2);
  });

  it("applies custom className", () => {
    mockChartInstances.length = 0;
    
    const { container } = render(
      <ChartCanvas
        id="test-chart"
        config={{ type: "bar", data: { labels: [], datasets: [] } }}
        className="custom-class"
      />
    );

    const canvas = container.querySelector('canvas[id="test-chart"]');
    expect(canvas.className).toContain("custom-class");
  });
});
