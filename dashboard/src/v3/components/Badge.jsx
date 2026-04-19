function Dot({ color, size = 8 }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      borderRadius: size / 2, background: color,
    }} />
  );
}

export default function Badge({ t, children }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 12px", borderRadius: 20,
      background: t.accentDim, border: `1px solid ${t.accentBorder}`,
      width: "fit-content",
    }}>
      <Dot color={t.accent} size={6} />
      <span style={{
        fontFamily: "DM Sans, system-ui, sans-serif",
        fontWeight: 500, fontSize: 11, letterSpacing: 0.44, color: t.accent,
      }}>
        {children}
      </span>
    </div>
  );
}
