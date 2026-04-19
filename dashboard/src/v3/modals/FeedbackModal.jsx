import { useState } from "react";
import { PrimaryBtn } from "../components/Buttons.jsx";

const F = "DM Sans, system-ui, sans-serif";

function FeedbackChip({ t, active, icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "12px 6px", borderRadius: 12,
      background: active ? t.accentDim : t.chipBg,
      border: `1.5px solid ${active ? t.accent : t.chipBorder}`,
      color: active ? t.accent : t.chipText,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      cursor: "pointer", transition: "all 120ms", fontFamily: F,
    }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 11 }}>{label}</div>
    </button>
  );
}

export default function FeedbackModal({ t, preset, required, onClose, onSubmit }) {
  const [rating,  setRating]  = useState(preset || null);
  const [comment, setComment] = useState("");
  const canSend = rating != null;

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      zIndex: 40, animation: "fadeIn 180ms ease",
    }}>
      <div style={{
        width: "100%", background: t.card,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        border: `1px solid ${t.border}`, borderBottom: "none",
        padding: "20px 22px 22px",
        animation: "slideUp 240ms cubic-bezier(0.2,0.8,0.2,1)",
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: t.border, margin: "0 auto 14px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div style={{ fontFamily: F, fontWeight: 700, fontSize: 16, color: t.text }}>
              {required ? "Antes de continuar…" : "¿Qué te pareció la valuación?"}
            </div>
            <div style={{ fontFamily: F, fontSize: 12, color: t.muted, marginTop: 4, lineHeight: 1.5 }}>
              {required
                ? "Contános rápido qué te pareció la valuación y seguimos."
                : "Ayúdanos a afinar nuestro modelo para tu próximo auto."}
            </div>
          </div>
          {!required && (
            <button onClick={onClose} style={{
              background: "transparent", border: "none",
              color: t.muted, fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 0,
            }}>✕</button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
          <FeedbackChip t={t} active={rating === "low"}  icon="😕" label="Muy baja"      onClick={() => setRating("low")} />
          <FeedbackChip t={t} active={rating === "fair"} icon="🤔" label="Razonable"     onClick={() => setRating("fair")} />
          <FeedbackChip t={t} active={rating === "high"} icon="😃" label="Buena / justa" onClick={() => setRating("high")} />
        </div>

        <div style={{ marginTop: 14 }}>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="(Opcional) ¿Qué esperabas recibir? Comenta aquí…"
            rows={3}
            style={{
              width: "100%", resize: "none", padding: "12px 14px",
              background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10,
              color: t.text, fontFamily: F, fontSize: 13, outline: "none",
            }}
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <PrimaryBtn t={t} disabled={!canSend} onClick={() => onSubmit({ rating, comment })}>
            Enviar feedback
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
}
