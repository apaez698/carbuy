import useMetric from "../hooks/useMetric.js";
import { calcTrend } from "../utils/metrics.js";
import KpiCard from "./KpiCard.jsx";

function formatTrend(cur, prev) {
  const { diff, pct, direction } = calcTrend(cur, prev);
  const arrowPrefix = direction === "up" ? "↑ +" : "↓ -";

  return {
    text: `${arrowPrefix}${Math.abs(diff)} (${pct}%) hoy vs ayer`,
    direction,
  };
}

function KpiGrid({ password }) {
  const { data, isLoading } = useMetric(password, "kpis");

  const totalSessions = data?.totalSessions ?? 0;
  const totalLeads = data?.totalLeads ?? 0;
  const whaClicks = data?.whaClicks ?? 0;
  const sesHoy = data?.sesHoy ?? 0;
  const sesAyer = data?.sesAyer ?? 0;
  const leadsHoy = data?.leadsHoy ?? 0;
  const leadsAyer = data?.leadsAyer ?? 0;
  const whaHoy = data?.whaHoy ?? 0;
  const whaAyer = data?.whaAyer ?? 0;

  const conversion =
    totalSessions > 0 ? ((totalLeads / totalSessions) * 100).toFixed(1) : "0";
  const convHoy = sesHoy > 0 ? (leadsHoy / sesHoy) * 100 : 0;
  const convAyer = sesAyer > 0 ? (leadsAyer / sesAyer) * 100 : 0;

  const visitsTrend = formatTrend(sesHoy, sesAyer);
  const leadsTrend = formatTrend(leadsHoy, leadsAyer);
  const whaTrend = formatTrend(whaHoy, whaAyer);
  const convTrend = calcTrend(convHoy, convAyer);

  const cards = [
    {
      label: "Visitas totales",
      value: isLoading ? "—" : totalSessions.toLocaleString(),
      sub: "Sesiones únicas",
      trend: isLoading ? "—" : visitsTrend.text,
      trendDirection: isLoading ? "up" : visitsTrend.direction,
      colorClass: "blue",
      icon: "👁",
    },
    {
      label: "Leads recibidos",
      value: isLoading ? "—" : totalLeads.toLocaleString(),
      sub: "Formularios completos",
      trend: isLoading ? "—" : leadsTrend.text,
      trendDirection: isLoading ? "up" : leadsTrend.direction,
      colorClass: "green",
      icon: "🚗",
    },
    {
      label: "Tasa de conversión",
      value: isLoading ? "—" : `${conversion}%`,
      sub: "Leads / Visitas",
      trend: isLoading ? "—" : `${convHoy.toFixed(1)}% hoy vs ${convAyer.toFixed(1)}% ayer`,
      trendDirection: isLoading ? "up" : convTrend.direction,
      colorClass: "cta",
      icon: "📊",
    },
    {
      label: "WhatsApp clicks",
      value: isLoading ? "—" : whaClicks.toLocaleString(),
      sub: "Contactos iniciados",
      trend: isLoading ? "—" : whaTrend.text,
      trendDirection: isLoading ? "up" : whaTrend.direction,
      colorClass: "orange",
      icon: "💬",
    },
  ];

  return (
    <div className="kpi-grid" id="section-resumen">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  );
}

export default KpiGrid;
