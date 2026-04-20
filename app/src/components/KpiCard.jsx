function KpiCard({
  label,
  value,
  sub,
  trend,
  trendDirection,
  colorClass,
  icon,
}) {
  return (
    <div className="kpi-card" data-icon={icon}>
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${colorClass}`.trim()}>{value}</div>
      <div className="kpi-sub">{sub}</div>
      <div className={`kpi-trend ${trendDirection || "up"}`.trim()}>{trend}</div>
    </div>
  );
}

export default KpiCard;
