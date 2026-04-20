import useMetric from "../hooks/useMetric.js";

export default function AdminValuations({ password }) {
  const { data, isLoading, isError } = useMetric(password, "valuations_list");

  if (isLoading) return <div className="loading"><div className="spinner" /> Cargando valuaciones...</div>;
  if (isError) return <p style={{ color: "#b91c1c" }}>Error cargando valuaciones.</p>;

  const rows = data?.data || [];
  const total = data?.count || rows.length;

  const fmtPrice = (v) => v ? "$" + Math.round(v).toLocaleString("en-US") : "\u2014";

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>Valuaciones</h3>
        <span className="badge">{total} total</span>
      </div>
      <div className="table-wrap">
        {rows.length === 0 ? (
          <div className="empty">Sin valuaciones registradas.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estimado</th>
                <th>Rango</th>
                <th>Confianza</th>
                <th>Fuente</th>
                <th>WhatsApp</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={{ whiteSpace: "nowrap", fontWeight: 700 }}>
                    {new Date(row.created_at).toLocaleString("es-EC")}
                  </td>
                  <td style={{ fontWeight: 700 }}>{row.estimated_text || fmtPrice(row.estimated_value)}</td>
                  <td>{fmtPrice(row.estimated_min)} \u2013 {fmtPrice(row.estimated_max)}</td>
                  <td>{row.confidence ? row.confidence + "%" : "\u2014"}</td>
                  <td>{row.source || "\u2014"}</td>
                  <td>
                    <span className={`badge ${row.whatsapp_clicked ? "green" : "gray"}`}>
                      {row.whatsapp_clicked ? "S\u00ED" : "No"}
                    </span>
                  </td>
                  <td>
                    {row.feedback_provided ? (
                      <span className="badge green">{row.feedback_rating}/5</span>
                    ) : (
                      <span className="badge gray">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
