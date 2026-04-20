const FONT = "DM Sans, system-ui, sans-serif";

export function PrimaryBtn({ t, onClick, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={e => (e.currentTarget.style.transform = "")}
      onMouseLeave={e => (e.currentTarget.style.transform = "")}
      style={{
        width: "100%", height: 52, borderRadius: 14, border: "none",
        background: disabled ? "rgba(100,120,180,0.25)" : t.accent,
        color: disabled ? "rgba(200,210,230,0.5)" : t.onAccent,
        fontFamily: FONT, fontWeight: 700, fontSize: 15,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 4px 14px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.1) inset",
        transition: "transform 120ms ease, box-shadow 120ms ease",
      }}
    >
      {children}
    </button>
  );
}

export function GhostBtn({ t, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", height: 52, borderRadius: 14,
        background: "transparent", color: t.muted,
        border: `1px solid ${t.border}`,
        fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
