import useMetric from "../hooks/useMetric.js";

export default function AdminInteractions({ password }) {
  const { data, isLoading, isError } = useMetric(password, "interactions");

  if (isLoading) return <div className="loading"><div className="spinner" /> Cargando interacciones...</div>;
  if (isError) return <p style={{ color: "#b91c1c" }}>Error cargando interacciones.</p>;

  const rows = data?.data || [];
  const total = data?.count || rows.length;

  const fmtPrice = (v) => v ? "$" + Math.round(v).toLocaleString("en-US") : "\u2014";

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>Interacciones completas</h3>
        <span className="badge">{total} clientes</span>
      </div>
      <p style={{ fontSize: 13, color: "var(--text-secondary, #64748b)", margin: "0 0 16px" }}>
        Flujo: Cliente \u2192 Veh\u00EDculo \u2192 Valuaci\u00F3n
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.length === 0 ? (
          <div className="empty">Sin interacciones registradas.</div>
        ) : (
          rows.map((client) => (
            <div key={client.id} style={{
              border: "1px solid var(--border, #334155)",
              borderRadius: 12,
              padding: 16,
              background: "var(--card-bg, #0f172a)",
            }}>
              {/* Client header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <strong style={{ fontSize: 14 }}>{client.nombre}</strong>
                  <span style={{ marginLeft: 10, fontSize: 12, color: "var(--text-secondary, #94a3b8)" }}>
                    {client.celular}
                    {client.email ? ` \u00B7 ${client.email}` : ""}
                    {client.ciudad ? ` \u00B7 ${client.ciudad}` : ""}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-secondary, #64748b)" }}>
                  {new Date(client.created_at).toLocaleString("es-EC")}
                </span>
              </div>

              {/* Vehicles */}
              {(client.vehicles || []).length === 0 ? (
                <div style={{ fontSize: 12, color: "#64748b", padding: "4px 0" }}>Sin veh\u00EDculos</div>
              ) : (
                client.vehicles.map((v) => (
                  <div key={v.id} style={{
                    marginLeft: 16,
                    padding: "8px 12px",
                    borderLeft: "2px solid #3b82f6",
                    marginBottom: 6,
                    fontSize: 13,
                  }}>
                    <strong>{v.marca} {v.modelo} {v.anio}</strong>
                    <span style={{ marginLeft: 8, color: "#94a3b8" }}>
                      {v.kilometraje ? v.kilometraje.toLocaleString("en-US") + " km" : ""}
                      {v.estado_general ? ` \u00B7 ${v.estado_general}` : ""}
                    </span>
                  </div>
                ))
              )}

              {/* Valuations */}
              {(client.valuations || []).length === 0 ? (
                <div style={{ fontSize: 12, color: "#64748b", padding: "4px 0 0 16px" }}>Sin valuaciones</div>
              ) : (
                client.valuations.map((val) => (
                  <div key={val.id} style={{
                    marginLeft: 32,
                    padding: "8px 12px",
                    borderLeft: "2px solid #10b981",
                    marginBottom: 4,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}>
                    <strong>{val.estimated_text || fmtPrice(val.estimated_value)}</strong>
                    {val.whatsapp_clicked && (
                      <span className="badge green" style={{ fontSize: 10 }}>WA</span>
                    )}
                    {val.feedback_provided && (
                      <span className="badge blue" style={{ fontSize: 10 }}>{val.feedback_rating}/5</span>
                    )}
                  </div>
                ))
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
