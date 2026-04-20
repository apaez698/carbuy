const F = "DM Sans, system-ui, sans-serif";

export default function ScreenHeader({ t, onBack, step, total, title, sub }) {
  return (
    <div style={{ background: t.surface, padding: "52px 24px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={onBack}
          style={{
            width: 30, height: 30, borderRadius: 8,
            background: t.card, border: `1px solid ${t.border}`,
            color: t.dim, cursor: "pointer", fontFamily: F,
            fontSize: 14, display: "grid", placeItems: "center",
          }}
        >
          ←
        </button>
        <span style={{ fontFamily: F, fontSize: 12, color: t.muted }}>Volver</span>
        <span style={{
          marginLeft: "auto", padding: "3px 10px", borderRadius: 20,
          background: t.card, border: `1px solid ${t.border}`,
          fontFamily: F, fontSize: 11, color: t.dim,
        }}>
          {step} / {total}
        </span>
      </div>

      <h2 style={{ margin: "12px 0 0", fontFamily: F, fontWeight: 700, fontSize: 22, color: t.text, lineHeight: 1.2 }}>
        {title}
      </h2>
      <p style={{ margin: 0, fontFamily: F, fontSize: 12, color: t.dim, lineHeight: 1.4 }}>
        {sub}
      </p>

      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i < step ? t.accent : t.border,
              transition: "background 200ms",
            }}
          />
        ))}
      </div>
    </div>
  );
}
