export default function ChartCard({ title, badge, children, sectionId }) {
  return (
    <div className="chart-card" id={sectionId}>
      <div className="card-header">
        <h3>{title}</h3>
        {badge && <span className="badge green">{badge}</span>}
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}
