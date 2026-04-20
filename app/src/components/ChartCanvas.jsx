import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function ChartCanvas({ id, config, className = "" }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !config) return;

    // Destroy existing chart if present
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    // Create new chart instance
    chartRef.current = new Chart(canvasRef.current, config);

    // Cleanup on unmount
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [config]);

  return (
    <canvas
      ref={canvasRef}
      id={id}
      className={className}
      data-testid={`chart-canvas-${id}`}
    />
  );
}
