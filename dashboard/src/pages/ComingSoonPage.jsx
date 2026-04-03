export default function ComingSoonPage({ title }) {
  return (
    <div className="chart-card" id="section-coming-soon">
      <div className="card-header">
        <h3>{title}</h3>
      </div>
      <div className="card-body">
        <div className="empty">🚧 Aún lo estamos construyendo.</div>
      </div>
    </div>
  );
}
