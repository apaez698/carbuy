export default function Chip({ t, active, onClick, children, size = "md" }) {
  const pad = size === "sm" ? "7px 13px" : "10px 16px";
  const fs  = size === "sm" ? 12 : 13;
  return (
    <button
      onClick={onClick}
      style={{
        padding: pad, borderRadius: 10,
        background: active ? t.accentDim    : t.chipBg,
        border: active ? `1.5px solid ${t.accent}` : "1.5px solid transparent",
        color:  active ? t.accent : t.chipText,
        fontFamily: "DM Sans, system-ui, sans-serif",
        fontWeight: active ? 600 : 500, fontSize: fs,
        cursor: "pointer", transition: "all 120ms ease",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}
