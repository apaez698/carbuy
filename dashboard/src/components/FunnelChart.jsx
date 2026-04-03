import useMetric from '../hooks/useMetric.js';
import ChartCard from './ChartCard.jsx';

const STEPS_CONFIG = [
  { key: 's1', label: '1. Datos del auto', color: '#1E3A8A' },
  { key: 's2', label: '2. Estado y extras', color: '#2563EB' },
  { key: 's3', label: '3. Datos contacto', color: '#10B981' },
  { key: 'sub', label: '✅ Formulario enviado', color: '#059669' },
  { key: 'wha', label: '💬 Click WhatsApp', color: '#25D366' },
];

export default function FunnelChart({ password }) {
  const { data, isLoading } = useMetric(password, 'funnel');

  if (isLoading) {
    return (
      <ChartCard title="Funnel de conversión" sectionId="section-funnel">
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-mid)' }}>
          Cargando...
        </div>
      </ChartCard>
    );
  }

  const counters = { s1: 0, s2: 0, s3: 0, sub: 0, wha: 0 };
  (data?.data || []).forEach((r) => {
    if (r.event_type === 'step_start' && r.step === 1) counters.s1++;
    if (r.event_type === 'step_start' && r.step === 2) counters.s2++;
    if (r.event_type === 'step_start' && r.step === 3) counters.s3++;
    if (r.event_type === 'form_submit') counters.sub++;
    if (r.event_type === 'whatsapp_click') counters.wha++;
  });

  const base = counters.s1 || 1;

  return (
    <ChartCard title="Funnel de conversión" sectionId="section-funnel">
      <div className="funnel">
        {STEPS_CONFIG.map((step) => {
          const n = counters[step.key];
          const pct = Math.round((n / base) * 100);
          return (
            <div key={step.key} className="funnel-step">
              <div className="funnel-label">
                <span>{step.label}</span>
                <span>{n} ({pct}%)</span>
              </div>
              <div className="funnel-bar-track">
                <div
                  className="funnel-bar-fill"
                  style={{ width: `${pct}%`, background: step.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
