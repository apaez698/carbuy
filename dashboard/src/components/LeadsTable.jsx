import useMetric from '../hooks/useMetric.js';
import useFlag from '../hooks/useFlag.js';
import { buildWhatsAppLink } from '../utils/whatsapp.js';
import ChartCard from './ChartCard.jsx';

export default function LeadsTable({ password }) {
  const [newLeadsViewEnabled] = useFlag('NEW_LEADS_VIEW');
  const { data, isLoading } = useMetric(password, 'leads_tabla');

  if (!newLeadsViewEnabled) {
    return (
      <ChartCard title="Últimos leads" sectionId="section-leads">
        <p style={{ padding: '24px', margin: 0 }}>Nueva vista (en construcción)</p>
      </ChartCard>
    );
  }

  if (isLoading) {
    return (
      <ChartCard title="Últimos leads" sectionId="section-leads">
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-mid)' }}>
          Cargando...
        </div>
      </ChartCard>
    );
  }

  const count = data?.count || 0;
  const rows = data?.data || [];

  return (
    <ChartCard title="Últimos leads" badge={`${count} total`} sectionId="section-leads">
      <div className="table-wrap">
        {rows.length === 0 ? (
          <div className="empty">📭 Sin leads aún.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Nombre</th>
                <th>Auto</th>
                <th>Año</th>
                <th>KM</th>
                <th>Estado</th>
                <th>Estimado</th>
                <th>Teléfono</th>
                <th>Ciudad</th>
                <th>Fuente</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const fecha = new Date(r.created_at).toLocaleDateString('es-EC', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                const badge =
                  r.estado_general === 'Excelente'
                    ? 'green'
                    : r.estado_general === 'Bueno'
                    ? 'blue'
                    : 'orange';

                const whaUrl = buildWhatsAppLink(r.celular, r.nombre, r.marca, r.modelo);

                return (
                  <tr key={r.id || r.created_at}>
                    <td style={{ color: 'var(--text)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {fecha}
                    </td>
                    <td style={{ color: 'var(--text)', fontWeight: 700 }}>{r.nombre || '—'}</td>
                    <td>
                      <strong>{r.marca || '—'} {r.modelo || ''}</strong>
                    </td>
                    <td>{r.anio || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.kilometraje || '—'}</td>
                    <td>
                      <span className={`badge ${badge}`}>{r.estado_general || '—'}</span>
                    </td>
                    <td style={{ color: 'var(--green)', fontWeight: 800, whiteSpace: 'nowrap' }}>
                      {r.estimado_texto || '—'}
                    </td>
                    <td>
                      <a
                        href={whaUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--green)', fontWeight: 700, textDecoration: 'none' }}
                      >
                        📱 {r.celular || '—'}
                      </a>
                    </td>
                    <td>{r.ciudad || '—'}</td>
                    <td>
                      <span className="badge gray">{r.utm_source || 'orgánico'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </ChartCard>
  );
}
