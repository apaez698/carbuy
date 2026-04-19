import { useState } from "react";

export default function TextInput({ t, value, onChange, placeholder, type = "text", autoFocus, prefix, onBlur, error }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      height: 52, padding: "0 16px", borderRadius: 12,
      background: t.card,
      border: `1px solid ${error ? "rgb(248,113,113)" : focus ? t.accent : t.border}`,
      transition: "border-color 120ms",
    }}>
      {prefix && (
        <span style={{ fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 14, color: t.muted, whiteSpace: "nowrap" }}>
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={e => { setFocus(false); onBlur?.(e); }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          flex: 1, background: "transparent", border: "none", outline: "none",
          color: t.text, fontFamily: "DM Sans, system-ui, sans-serif",
          fontSize: 15, height: "100%",
        }}
      />
    </div>
  );
}
