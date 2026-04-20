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
];

export default function CiudadesChart({ password }) {
  const { data, isLoading } = useMetric(password, "ciudades");

  const chartConfig = useMemo(() => {
    if (!data?.data || isLoading) return null;

    const counts = {};
    data.data.forEach((r) => {
      if (r.ciudad) counts[r.ciudad] = (counts[r.ciudad] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      type: "bar",
      data: {
        labels: sorted.map(([k]) => k),
        datasets: [
          {
            label: "Leads",
            data: sorted.map(([, v]) => v),
            backgroundColor: COLORS.slice(0, sorted.length),
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 } },
            grid: { color: "rgba(0,0,0,0.05)" },
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 12, weight: "700" } },
          },
        },
      },
    };
  }, [data, isLoading]);

  if (isLoading) {
    return (
      <ChartCard title="Leads por ciudad (Top 6)" sectionId="section-ciudades">
        <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
          Cargando...
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Leads por ciudad (Top 6)" sectionId="section-ciudades">
      <div style={{ height: 320, width: "100%" }}>
        {chartConfig && <ChartCanvas id="chartCiudades" config={chartConfig} />}
      </div>
    </ChartCard>
  );
}
