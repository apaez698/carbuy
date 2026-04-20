import useMetric from "../hooks/useMetric.js";

function KpiCard({ icon, label, value, sub }) {
  return (
    <div className="kpi-card" data-icon={icon}>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value blue">{value}</p>
      {sub && <p className="kpi-sub">{sub}</p>}
    </div>
  );
}

export default function AdminHome({ password }) {
  const { data, isLoading, isError } = useMetric(password, "kpis");

  if (isLoading) return <div className="loading"><div className="spinner" /> Cargando...</div>;
  if (isError) return <p style={{ color: "#b91c1c" }}>Error cargando KPIs.</p>;

  const d = data || {};

  const convRate = d.totalSessions > 0
    ? ((d.totalClients / d.totalSessions) * 100).toFixed(1) + "%"
    : "0%";

  const trend = (hoy, ayer) => {
    if (!ayer) return "";
    const diff = hoy - ayer;
    if (diff > 0) return ` (+${diff})`;
    if (diff < 0) return ` (${diff})`;
    return " (=)";
  };

  return (
    <>
      <div className="kpi-grid">
        <KpiCard
          icon="👥"
          label="Clientes"
          value={d.totalClients ?? 0}
          sub={`Hoy: ${d.clientsHoy ?? 0}${trend(d.clientsHoy, d.clientsAyer)}`}
        />
        <KpiCard
          icon="🚗"
          label="Vehículos"
          value={d.totalVehicles ?? 0}
        />
        <KpiCard
          icon="💰"
          label="Valuaciones"
          value={d.totalValuations ?? 0}
        />
        <KpiCard
          icon="📈"
          label="Conversión"
          value={convRate}
          sub={`Sesiones: ${d.totalSessions ?? 0}`}
        />
        <KpiCard
          icon="💬"
          label="WhatsApp"
          value={d.whaClicks ?? 0}
          sub={`Hoy: ${d.whaHoy ?? 0}${trend(d.whaHoy, d.whaAyer)}`}
        />
      </div>
    </>
  );
}
