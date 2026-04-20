import useMetric from "../hooks/useMetric.js";

export default function AdminClients({ password }) {
  const { data, isLoading, isError } = useMetric(password, "clients_list");

  if (isLoading) return <div className="loading"><div className="spinner" /> Cargando clientes...</div>;
  if (isError) return <p style={{ color: "#b91c1c" }}>Error cargando clientes.</p>;

  const rows = data?.data || [];
  const total = data?.count || rows.length;

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>Clientes</h3>
        <span className="badge">{total} total</span>
      </div>
      <div className="table-wrap">
        {rows.length === 0 ? (
          <div className="empty">Sin clientes registrados.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Nombre</th>
                <th>Tel\u00E9fono</th>
                <th>Email</th>
                <th>Ciudad</th>
                <th>WhatsApp</th>
                <th>Fuente</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={{ whiteSpace: "nowrap", fontWeight: 700 }}>
                    {new Date(row.created_at).toLocaleString("es-EC")}
                  </td>
                  <td>{row.nombre}</td>
                  <td>
                    <a
                      href={`https://wa.me/${row.celular}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#25D366" }}
                    >
                      {row.celular}
                    </a>
                  </td>
                  <td>{row.email || "\u2014"}</td>
                  <td>{row.ciudad || "\u2014"}</td>
                  <td>
                    <span className={`badge ${row.acepta_whatsapp ? "green" : "gray"}`}>
                      {row.acepta_whatsapp ? "S\u00ED" : "No"}
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
