import useMetric from "../hooks/useMetric.js";

export default function AdminVehicles({ password }) {
  const { data, isLoading, isError } = useMetric(password, "vehicles_list");

  if (isLoading) return <div className="loading"><div className="spinner" /> Cargando veh\u00EDculos...</div>;
  if (isError) return <p style={{ color: "#b91c1c" }}>Error cargando veh\u00EDculos.</p>;

  const rows = data?.data || [];
  const total = data?.count || rows.length;

  const fmtKm = (km) => km ? km.toLocaleString("en-US") + " km" : "\u2014";

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>Veh\u00EDculos</h3>
        <span className="badge">{total} total</span>
      </div>
      <div className="table-wrap">
        {rows.length === 0 ? (
          <div className="empty">Sin veh\u00EDculos registrados.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Auto</th>
                <th>A\u00F1o</th>
                <th>KM</th>
                <th>Estado</th>
                <th>Fuente</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={{ whiteSpace: "nowrap", fontWeight: 700 }}>
                    {new Date(row.created_at).toLocaleString("es-EC")}
                  </td>
                  <td>{row.marca} {row.modelo}</td>
                  <td>{row.anio || "\u2014"}</td>
                  <td>{fmtKm(row.kilometraje)}</td>
                  <td>
                    <span className={`badge ${
                      row.estado_general === "Excelente" ? "green" :
                      row.estado_general === "Bueno" ? "blue" : "orange"
                    }`}>
                      {row.estado_general || "\u2014"}
                    </span>
                  </td>
                  <td>{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
