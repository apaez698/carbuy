import { useMemo } from "react";
import useMetric from "../../hooks/useMetric.js";
import ChartCanvas from "../ChartCanvas.jsx";
import ChartCard from "../ChartCard.jsx";

export default function LeadsDiaChart({ password }) {
  const { data, isLoading } = useMetric(password, "leads_dia");

  const chartConfig = useMemo(() => {
    if (!data?.data || isLoading) return null;

    const counts = {};
    data.data.forEach((r) => {
      const day = r.created_at.slice(0, 10);
      counts[day] = (counts[day] || 0) + 1;
    });

    const labels = [];
    const values = [];
    for (let i = 29; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().slice(0, 10);
      labels.push(
        dt.toLocaleDateString("es-EC", { month: "short", day: "numeric" })
      );
      values.push(counts[key] || 0);
    }

    return {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Leads",
            data: values,
            backgroundColor: "rgba(30,58,138,0.15)",
            borderColor: "#1E3A8A",
            borderWidth: 2,
            borderRadius: 6,
            hoverBackgroundColor: "#1E3A8A",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 10, font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 } },
            grid: { color: "rgba(0,0,0,0.05)" },
          },
        },
      },
    };
  }, [data, isLoading]);

  if (isLoading) {
    return (
      <ChartCard title="Leads por día" sectionId="section-leads-dia">
        <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
          Cargando...
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Leads por día" sectionId="section-leads-dia">
      <div style={{ height: 320, width: "100%" }}>
        {chartConfig && <ChartCanvas id="chartLeadsDia" config={chartConfig} />}
      </div>
    </ChartCard>
  );
}
