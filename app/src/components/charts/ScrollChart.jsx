import { useMemo } from "react";
import useMetric from "../../hooks/useMetric.js";
import ChartCanvas from "../ChartCanvas.jsx";
import ChartCard from "../ChartCard.jsx";

export default function ScrollChart({ password }) {
  const { data, isLoading } = useMetric(password, "scroll");

  const chartConfig = useMemo(() => {
    if (!data?.data || isLoading) return null;

    const buckets = { 25: 0, 50: 0, 75: 0, 90: 0, 100: 0 };
    data.data.forEach((r) => {
      const pct = r.event_data?.value;
      if (buckets[pct] !== undefined) buckets[pct]++;
    });

    return {
      type: "bar",
      data: {
        labels: ["25%", "50%", "75%", "90%", "100%"],
        datasets: [
          {
            label: "Usuarios",
            data: Object.values(buckets),
            backgroundColor: [
              "#BFDBFE",
              "#93C5FD",
              "#60A5FA",
              "#3B82F6",
              "#1E3A8A",
            ],
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 } },
            grid: { color: "rgba(0,0,0,0.05)" },
          },
          x: { grid: { display: false } },
        },
      },
    };
  }, [data, isLoading]);

  if (isLoading) {
    return (
      <ChartCard title="Profundidad de scroll" sectionId="section-scroll">
        <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
          Cargando...
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Profundidad de scroll" sectionId="section-scroll">
      <div style={{ height: 320, width: "100%" }}>
        {chartConfig && <ChartCanvas id="chartScroll" config={chartConfig} />}
      </div>
    </ChartCard>
  );
}
