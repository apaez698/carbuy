export default function CondCard({ t, icon, title, sub, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 8px", borderRadius: 12,
        background: active ? t.accentDim : t.chipBg,
        border: `1.5px solid ${active ? t.accent : t.chipBorder}`,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        cursor: "pointer", transition: "all 120ms",
      }}
    >
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{
        fontFamily: "DM Sans, system-ui, sans-serif",
        fontWeight: 600, fontSize: 12,
        color: active ? t.accent : t.text,
      }}>
        {title}
      </div>
      <div style={{
        fontFamily: "DM Sans, system-ui, sans-serif",
        fontSize: 10, lineHeight: 1.3, textAlign: "center",
        color: active ? t.accent : t.muted, opacity: active ? 0.9 : 1,
      }}>
        {sub}
      </div>
    </button>
  );
}
