import { useMemo } from "react";
import FieldLabel from "../components/FieldLabel.jsx";
import { PrimaryBtn, GhostBtn } from "../components/Buttons.jsx";
import CarGlyph from "../components/CarGlyph.jsx";

const F = "DM Sans, system-ui, sans-serif";
const S = "DM Serif Display, DM Sans, serif";

function fmt$(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
function fmtKm(n) { return n.toLocaleString("en-US") + " km"; }

// ── Loader state ──
function Loader({ t }) {
  return (
    <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 36,
          background: t.accentDim, border: `2px solid ${t.accent}`,
          display: "grid", placeItems: "center",
          animation: "pulseRing 1.8s infinite",
        }}>
          <CarGlyph size={32} color={t.accent} />
        </div>
        <div style={{ fontFamily: F, fontWeight: 600, fontSize: 15, color: t.text, textAlign: "center" }}>
          Analizando mercado…
        </div>
        <div style={{ fontFamily: F, fontSize: 12, color: t.muted, textAlign: "center", maxWidth: 260, lineHeight: 1.5 }}>
          Comparando con transacciones similares en Quito de los últimos 90 días.
        </div>
      </div>
    </div>
  );
}

// ── Breakdown row ──
function Row({ t, k, v, pos, neg, last }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "13px 0",
      borderBottom: last ? "none" : `1px solid ${t.border}`,
    }}>
      <span style={{ fontFamily: F, fontSize: 12, color: t.muted }}>{k}</span>
      <span style={{ fontFamily: F, fontWeight: 500, fontSize: 12, color: pos ? t.accent : neg ? "rgb(248,113,113)" : t.dim }}>
        {v}
      </span>
    </div>
  );
}

// ── Related listings ──
function RelatedListings({ t, vehicle, estimate, onUnlock }) {
  const comps = useMemo(() => {
    const base = estimate.estimate;
    return [
      { dk: -12000, dp: 800,  status: "Vendido",    when: "hace 6 días" },
      { dk: +8000,  dp: -350, status: "Vendido",    when: "hace 18 días" },
      { dk: -3000,  dp: 200,  status: "En mercado", when: "hace 2 días" },
    ].map((v, i) => ({
      title: `${vehicle.brand} ${vehicle.model} ${vehicle.year + (i % 3 === 0 ? -1 : i % 3 === 1 ? 0 : 1)}`,
      km:    Math.max(5000, vehicle.km + v.dk),
      price: Math.max(1000, base + v.dp),
      status: v.status,
      when:   v.when,
    }));
  }, [vehicle.brand, vehicle.model, vehicle.year, vehicle.km, estimate.estimate]);

  function ListingCard({ c }) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: 12,
        borderRadius: 12, background: t.card, border: `1px solid ${t.border}`,
      }}>
        <div style={{
          width: 48, height: 40, borderRadius: 8,
          background: t.surface, border: `1px solid ${t.border}`,
          display: "grid", placeItems: "center", flexShrink: 0,
        }}>
          <CarGlyph size={22} color={t.muted} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F, fontWeight: 600, fontSize: 13, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {c.title}
          </div>
          <div style={{ fontFamily: F, fontSize: 11, color: t.muted, marginTop: 2 }}>
            {fmtKm(c.km)} · {c.when}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: F, fontWeight: 700, fontSize: 14, color: t.text }}>{fmt$(c.price)}</div>
          <div style={{ fontFamily: F, fontSize: 10, color: c.status === "Vendido" ? t.accent : t.dim, marginTop: 2 }}>{c.status}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
        <FieldLabel t={t}>Anuncios relacionados en Quito</FieldLabel>
        <span style={{ fontFamily: F, fontSize: 10, color: t.dim }}>últ. 90 días</span>
      </div>

      {/* First listing — visible as free preview */}
      <ListingCard c={comps[0]} />

      {/* Remaining listings — blurred with unlock CTA */}
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, filter: "blur(5px)", pointerEvents: "none", userSelect: "none" }} aria-hidden="true">
          {comps.slice(1).map((c, i) => <ListingCard key={i} c={c} />)}
        </div>
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(180deg, ${t.bg}66 0%, ${t.bg}dd 55%, ${t.bg}ee 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 12, padding: 12,
        }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, maxWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>🔒</span>
              <div style={{ fontFamily: F, fontWeight: 700, fontSize: 13, color: t.text, lineHeight: 1.3 }}>
                +{comps.length - 1} anuncios similares vendidos cerca
              </div>
            </div>
            <div style={{ fontFamily: F, fontSize: 11, color: t.muted, lineHeight: 1.45 }}>
              Un asesor te los envía por WhatsApp para que compares precios reales.
            </div>
            <button onClick={onUnlock} style={{
              marginTop: 2, padding: "9px 16px", borderRadius: 10,
              background: t.accent, color: t.onAccent, border: "none",
              fontFamily: F, fontWeight: 700, fontSize: 12, cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
            }}>
              📱 Ver anuncios con asesor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inline feedback prompt ──
function InlineFeedbackPrompt({ t, onOpen }) {
  const opts = [
    { k: "low",  icon: "😕", label: "Muy baja" },
    { k: "fair", icon: "🤔", label: "Razonable" },
    { k: "high", icon: "😃", label: "Justa" },
  ];
  return (
    <div style={{
      padding: "16px 16px 14px", borderRadius: 14,
      background: t.accentDim, border: `1.5px solid ${t.accentBorder}`,
      display: "flex", flexDirection: "column", gap: 10,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -24, right: -24, width: 80, height: 80, borderRadius: 40, background: t.accent, opacity: 0.08 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: t.accent, color: t.onAccent, display: "grid", placeItems: "center", fontSize: 17 }}>
          💬
        </div>
        <div>
          <div style={{ fontFamily: F, fontWeight: 700, fontSize: 14, color: t.text }}>¿Qué te pareció la valuación?</div>
          <div style={{ fontFamily: F, fontSize: 11, color: t.muted, marginTop: 2 }}>Te toma 5 segundos y nos ayuda un montón.</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {opts.map(o => (
          <button key={o.k} onClick={() => onOpen(o.k)} style={{
            padding: "10px 6px", borderRadius: 10,
            background: t.surface, border: `1.5px solid ${t.accentBorder}`,
            color: t.text, display: "flex", flexDirection: "column",
            alignItems: "center", gap: 4, cursor: "pointer",
            fontFamily: F, transition: "all 120ms",
          }}>
            <div style={{ fontSize: 20 }}>{o.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 11 }}>{o.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main export ──
export default function ScreenResult({ t, copy, resultStyle, vehicle, estimate, loading, onBack, onWhatsApp, onAnother, onFeedback }) {
  if (loading || !estimate) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
        <Loader t={t} />
      </div>
    );
  }

  const spread = Math.round(((estimate.range_high - estimate.range_low) / 2 / estimate.estimate) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      {/* Header with estimate */}
      <div style={{
        background: t.surface, padding: "52px 24px 24px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
        position: "relative",
      }}>
        <button onClick={onBack} style={{
          position: "absolute", left: 24, top: 52,
          width: 30, height: 30, borderRadius: 8,
          background: t.card, border: `1px solid ${t.border}`,
          color: t.dim, cursor: "pointer", fontFamily: F,
          fontSize: 14, display: "grid", placeItems: "center",
        }}>←</button>

        <div style={{ width: 56, height: 56, borderRadius: 14, background: t.accentDim, border: `1px solid ${t.accentBorder}`, display: "grid", placeItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>💰</span>
        </div>

        <div style={{ fontFamily: F, fontWeight: 600, fontSize: 13, color: t.text, textAlign: "center" }}>
          {vehicle.brand} {vehicle.model} {vehicle.year}
        </div>
        <div style={{ fontFamily: F, fontSize: 11, color: t.muted, textAlign: "center" }}>
          {fmtKm(vehicle.km)} · Estado {vehicle.estado.toLowerCase()}
        </div>

        {resultStyle === "hero" ? (
          <>
            <div style={{ fontFamily: F, fontSize: 11, color: t.dim, marginTop: 12, letterSpacing: 0.3 }}>
              {copy.resultSub}
            </div>
            <div style={{ fontFamily: S, fontWeight: 400, fontSize: 52, color: t.accent, lineHeight: 1, marginTop: 4 }}>
              {fmt$(estimate.estimate)}
            </div>
            <div style={{ fontFamily: F, fontSize: 11, color: t.dim, marginTop: 6 }}>
              Rango estimado: {fmt$(estimate.range_low)} – {fmt$(estimate.range_high)}
            </div>
          </>
        ) : (
          <div style={{ width: "100%", marginTop: 14, padding: 18, borderRadius: 16, background: t.card, border: `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontFamily: F, fontSize: 11, color: t.muted }}>{copy.resultSub}</div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontFamily: F, fontWeight: 700, fontSize: 32, color: t.text }}>{fmt$(estimate.estimate)}</div>
              <div style={{ fontFamily: F, fontSize: 11, color: t.accent, background: t.accentDim, padding: "4px 8px", borderRadius: 6 }}>
                ±{spread}%
              </div>
            </div>
            <div style={{ fontFamily: F, fontSize: 11, color: t.dim }}>
              {fmt$(estimate.range_low)} – {fmt$(estimate.range_high)}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Confidence bar */}
        <div style={{ padding: 16, borderRadius: 14, background: t.card, border: `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: F, fontSize: 12, color: t.muted }}>Confianza del modelo</span>
            <span style={{ fontFamily: F, fontWeight: 700, fontSize: 13, color: t.accent }}>{estimate.confidence}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: t.border, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${estimate.confidence}%`, background: t.accent, transition: "width 600ms ease" }} />
          </div>
          <div style={{ fontFamily: F, fontSize: 10, color: t.dim, lineHeight: 1.5 }}>
            Basado en {estimate.sample_size}+ transacciones similares en Quito (últimos 90 días)
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ borderRadius: 14, background: t.card, border: `1px solid ${t.border}`, padding: "6px 16px", display: "flex", flexDirection: "column" }}>
          <Row t={t} k="Precio base mercado" v={fmt$(estimate.base_market)} />
          <Row t={t} k="Impacto kilometraje"
            v={(estimate.km_impact >= 0 ? "+" : "−") + fmt$(Math.abs(estimate.km_impact))}
            neg={estimate.km_impact < 0} />
          <Row t={t} k="Bonificación estado"
            v={(estimate.condition_bonus >= 0 ? "+" : "−") + fmt$(Math.abs(estimate.condition_bonus))}
            pos={estimate.condition_bonus > 0} neg={estimate.condition_bonus < 0} />
          <Row t={t} k="Mercado Quito (últ. 90d)"
            v={`${fmt$(estimate.market_low)} – ${fmt$(estimate.market_high)}`} />
          <Row t={t} k="Próximo paso"
            v={<span style={{ color: t.accent }}>Asesor WhatsApp ↗</span>} last />
        </div>

        {/* Related listings */}
        <RelatedListings t={t} vehicle={vehicle} estimate={estimate} onUnlock={onWhatsApp} />

        {/* Inline feedback */}
        <InlineFeedbackPrompt t={t} onOpen={onFeedback} />

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          <PrimaryBtn t={t} onClick={onWhatsApp}>{copy.whatsApp}</PrimaryBtn>
          <GhostBtn t={t} onClick={onAnother}>Evaluar otro auto</GhostBtn>
        </div>

        <p style={{ fontFamily: F, fontSize: 10, color: t.dim, textAlign: "center", lineHeight: 1.5, margin: "4px 0 0", whiteSpace: "pre-line" }}>
          {copy.footer}
        </p>
      </div>
    </div>
  );
}
