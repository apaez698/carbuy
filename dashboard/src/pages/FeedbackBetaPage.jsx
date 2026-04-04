import { useMemo } from "react";
import useMetric from "../hooks/useMetric.js";
import ChartCard from "../components/ChartCard.jsx";
import ChartCanvas from "../components/ChartCanvas.jsx";

function countRatings(rows, key) {
  const buckets = [0, 0, 0, 0, 0];
  rows.forEach((row) => {
    const value = Number.parseInt(row[key], 10);
    if (Number.isInteger(value) && value >= 1 && value <= 5) {
      buckets[value - 1] += 1;
    }
  });
  return buckets;
}

function avgRating(rows, key) {
  if (!rows.length) return 0;
  const sum = rows.reduce(
    (acc, row) => acc + (Number.parseInt(row[key], 10) || 0),
    0,
  );
  return sum / rows.length;
}

function ratingClass(value) {
  const num = Number.parseInt(value, 10);
  if (!Number.isInteger(num) || num < 1 || num > 5) return "gray";
  if (num >= 4) return "green";
  if (num === 3) return "orange";
  return "blue";
}

function priceJusticeLabel(value) {
  if (value === "higher") return "Más alto";
  if (value === "fair") return "Justo";
  if (value === "lower") return "Más bajo";
  return "-";
}

export default function FeedbackBetaPage({ password }) {
  const { data, isLoading, isError } = useMetric(password, "beta_feedback");

  const rows = data?.data || [];
  const total = data?.count || rows.length;

  const analytics = useMemo(() => {
    const easeAverage = avgRating(rows, "section1_data_entry");
    const recommendAverage = avgRating(rows, "section2_recommend");
    const navigationAverage = avgRating(rows, "section4_navigation");

    const priceCount = {
      higher: rows.filter((r) => r.section2_price_justice === "higher").length,
      fair: rows.filter((r) => r.section2_price_justice === "fair").length,
      lower: rows.filter((r) => r.section2_price_justice === "lower").length,
    };

    const dominant =
      Object.entries(priceCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const sentiment =
      dominant === "higher"
        ? "Positivo"
        : dominant === "fair"
          ? "Neutral"
          : dominant === "lower"
            ? "Sorpresa"
            : "-";

    return {
      easeAverage,
      recommendAverage,
      navigationAverage,
      priceCount,
      sentiment,
      easeData: countRatings(rows, "section1_data_entry"),
      recommendData: countRatings(rows, "section2_recommend"),
      navigationData: countRatings(rows, "section4_navigation"),
    };
  }, [rows]);

  const baseBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { size: 11 } },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
    },
  };

  const easeChart = {
    type: "bar",
    data: {
      labels: ["1 - Difícil", "2", "3", "4", "5 - Fácil"],
      datasets: [
        {
          label: "Respuestas",
          data: analytics.easeData,
          backgroundColor: "rgba(30,58,138,0.2)",
          borderColor: "#1E3A8A",
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    },
    options: baseBarOptions,
  };

  const recommendChart = {
    type: "bar",
    data: {
      labels: ["1 - No", "2", "3", "4", "5 - Sí"],
      datasets: [
        {
          label: "Respuestas",
          data: analytics.recommendData,
          backgroundColor: "rgba(16,185,129,0.2)",
          borderColor: "#10B981",
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    },
    options: baseBarOptions,
  };

  const priceChart = {
    type: "bar",
    data: {
      labels: ["Más alto", "Justo", "Más bajo"],
      datasets: [
        {
          label: "Respuestas",
          data: [
            analytics.priceCount.higher,
            analytics.priceCount.fair,
            analytics.priceCount.lower,
          ],
          backgroundColor: [
            "rgba(16,185,129,0.22)",
            "rgba(30,58,138,0.2)",
            "rgba(245,158,11,0.25)",
          ],
          borderColor: ["#10B981", "#1E3A8A", "#F59E0B"],
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    },
    options: baseBarOptions,
  };

  const navigationChart = {
    type: "bar",
    data: {
      labels: ["1 - Confusa", "2", "3", "4", "5 - Clara"],
      datasets: [
        {
          label: "Respuestas",
          data: analytics.navigationData,
          backgroundColor: "rgba(37,99,235,0.2)",
          borderColor: "#2563EB",
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    },
    options: baseBarOptions,
  };

  if (isLoading) {
    return (
      <ChartCard title="Feedback beta" sectionId="section-feedback-beta">
        <div className="loading">
          <div className="spinner" />
          Cargando respuestas...
        </div>
      </ChartCard>
    );
  }

  if (isError) {
    return (
      <ChartCard title="Feedback beta" sectionId="section-feedback-beta">
        <p style={{ color: "#b91c1c", margin: 0, padding: 24 }}>
          No se pudo cargar el feedback. Verifica la clave del dashboard y la
          tabla beta_feedback.
        </p>
      </ChartCard>
    );
  }

  return (
    <>
      <div className="kpi-grid feedback-kpi-grid">
        <div className="kpi-card" data-icon="🧪">
          <p className="kpi-label">Total de respuestas</p>
          <p className="kpi-value blue">{total}</p>
          <p className="kpi-sub">Testers completados</p>
        </div>

        <div className="kpi-card" data-icon="📝">
          <p className="kpi-label">Facilidad promedio</p>
          <p className="kpi-value green">{analytics.easeAverage.toFixed(1)}</p>
          <p className="kpi-sub">Escala 1 a 5</p>
        </div>

        <div className="kpi-card" data-icon="💬">
          <p className="kpi-label">Recomendación promedio</p>
          <p className="kpi-value cta">
            {analytics.recommendAverage.toFixed(1)}
          </p>
          <p className="kpi-sub">¿Lo usarían de nuevo?</p>
        </div>

        <div className="kpi-card" data-icon="🎯">
          <p className="kpi-label">Sentimiento precio</p>
          <p className="kpi-value orange">{analytics.sentiment}</p>
          <p className="kpi-sub">Percepción dominante</p>
        </div>
      </div>

      <div className="feedback-charts-grid">
        <ChartCard
          title="Facilidad de entrada de datos"
          sectionId="section-feedback-ease"
        >
          <div className="chart-wrap tall">
            <ChartCanvas id="chartFeedbackEase" config={easeChart} />
          </div>
        </ChartCard>

        <ChartCard
          title="Recomendación (¿Lo usarías?)"
          sectionId="section-feedback-recommend"
        >
          <div className="chart-wrap tall">
            <ChartCanvas id="chartFeedbackRecommend" config={recommendChart} />
          </div>
        </ChartCard>

        <ChartCard
          title="Percepción del precio"
          sectionId="section-feedback-price"
        >
          <div className="chart-wrap tall">
            <ChartCanvas id="chartFeedbackPrice" config={priceChart} />
          </div>
        </ChartCard>

        <ChartCard
          title="Usabilidad (navegación)"
          sectionId="section-feedback-navigation"
        >
          <div className="chart-wrap tall">
            <ChartCanvas
              id="chartFeedbackNavigation"
              config={navigationChart}
            />
          </div>
        </ChartCard>
      </div>

      <ChartCard
        title="Todas las respuestas"
        badge={`${rows.length} mostradas`}
        sectionId="section-feedback-table"
      >
        <div className="table-wrap">
          {rows.length === 0 ? (
            <div className="empty">
              📭 Aún no hay respuestas en beta_feedback.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Nombre</th>
                  <th>Facilidad</th>
                  <th>Claridad</th>
                  <th>Precio</th>
                  <th>Recomienda</th>
                  <th>Navegación</th>
                  <th>Contacto</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        color: "var(--text)",
                        fontWeight: 700,
                      }}
                    >
                      {new Date(row.created_at).toLocaleString("es-EC")}
                    </td>
                    <td>{row.name || "Anónimo"}</td>
                    <td>
                      <span
                        className={`badge ${ratingClass(row.section1_data_entry)}`}
                      >
                        {row.section1_data_entry || "-"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${ratingClass(row.section1_understanding)}`}
                      >
                        {row.section1_understanding || "-"}
                      </span>
                    </td>
                    <td>{priceJusticeLabel(row.section2_price_justice)}</td>
                    <td>
                      <span
                        className={`badge ${ratingClass(row.section2_recommend)}`}
                      >
                        {row.section2_recommend || "-"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${ratingClass(row.section4_navigation)}`}
                      >
                        {row.section4_navigation || "-"}
                      </span>
                    </td>
                    <td>{row.contact || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </ChartCard>
    </>
  );
}
