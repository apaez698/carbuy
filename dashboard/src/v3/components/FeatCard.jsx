export default function FeatCard({ t, icon, title, body }) {
  return (
    <div style={{
      background: t.card, border: `1px solid ${t.border}`,
      borderRadius: 14, padding: 16,
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: t.accentDim, border: `1px solid ${t.accentBorder}`,
        display: "grid", placeItems: "center", fontSize: 14,
      }}>
        {icon}
      </div>
      <div style={{
        fontFamily: "DM Sans, system-ui, sans-serif",
        fontWeight: 600, fontSize: 13, color: t.text, marginTop: 4,
      }}>
        {title}
      </div>
      <div style={{
        fontFamily: "DM Sans, system-ui, sans-serif",
        fontSize: 11, color: t.muted, lineHeight: 1.45,
      }}>
        {body}
      </div>
    </div>
  );
}
