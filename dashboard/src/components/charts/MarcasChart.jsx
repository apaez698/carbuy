import { useMemo } from "react";
import useMetric from "../../hooks/useMetric.js";
import ChartCanvas from "../ChartCanvas.jsx";
import ChartCard from "../ChartCard.jsx";

const COLORS = [
  "#1E3A8A",
  "#10B981",
  "#2563EB",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

export default function MarcasChart({ password }) {
  const { data, isLoading } = useMetric(password, "marcas");

  const chartConfig = useMemo(() => {
    if (!data?.data || isLoading) return null;

    const counts = {};
    data.data.forEach((r) => {
      if (r.marca) counts[r.marca] = (counts[r.marca] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      type: "doughnut",
      data: {
        labels: sorted.map(([k]) => k),
        datasets: [
          {
            data: sorted.map(([, v]) => v),
            backgroundColor: COLORS,
            borderWidth: 2,
            borderColor: "white",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { font: { size: 11, weight: "700" }, padding: 10 },
          },
        },
        cutout: "60%",
      },
    };
  }, [data, isLoading]);

  if (isLoading) {
    return (
      <ChartCard title="Leads por marca (Top 8)" sectionId="section-marcas">
        <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
          Cargando...
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Leads por marca (Top 8)" sectionId="section-marcas">
      <div style={{ height: 320, width: "100%" }}>
        {chartConfig && <ChartCanvas id="chartMarcas" config={chartConfig} />}
      </div>
    </ChartCard>
  );
}
