import BrandMark from "../components/BrandMark.jsx";
import Badge from "../components/Badge.jsx";
import FeatCard from "../components/FeatCard.jsx";
import { PrimaryBtn } from "../components/Buttons.jsx";

const F = "DM Sans, system-ui, sans-serif";

function Dot({ color, size = 8 }) {
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: size / 2, background: color }} />;
}

export default function ScreenHero({ t, copy, onStart }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div style={{ background: t.surface, padding: "56px 24px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <BrandMark t={t} />
          <span style={{ fontFamily: F, fontSize: 11, color: t.dim }}>Quito · Ecuador</span>
        </div>

        <Badge t={t}>IA + asesoría real en minutos</Badge>

        <h1 style={{
          margin: 0, fontFamily: "DM Serif Display, DM Sans, serif",
          fontWeight: 400, fontSize: 42, lineHeight: 1.05,
          color: t.text, letterSpacing: -0.5,
        }}>
          {copy.heroTitle[0]} <br />
          <span style={{ color: t.accent }}>{copy.heroTitle[1]}</span>
        </h1>

        <p style={{
          margin: 0, fontFamily: F, fontSize: 13,
          color: t.muted, lineHeight: 1.55, whiteSpace: "pre-line",
        }}>
          {copy.heroSub}
        </p>

        <div style={{ marginTop: 6 }}>
          <PrimaryBtn t={t} onClick={onStart}>{copy.cta}</PrimaryBtn>
        </div>
      </div>

      <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FeatCard t={t} icon="⚡" title="IA instantánea"  body="Modelo entrenado en precios reales de mercado" />
        <FeatCard t={t} icon="💬" title="Asesor real"     body="Te contactamos por WhatsApp con oferta final" />
        <FeatCard t={t} icon="📋" title="Sin trámites"    body="Gestionamos papeleo y transferencia" />
        <FeatCard t={t} icon="🔒" title="100% seguro"     body="Datos protegidos, sin spam ni terceros" />
      </div>

      <div style={{
        marginTop: "auto", borderTop: `1px solid ${t.border}`,
        padding: "14px 24px",
        display: "flex", gap: 18, justifyContent: "center", alignItems: "center",
      }}>
        <span style={{ fontFamily: F, fontSize: 11, color: t.dim }}>+200 autos vendidos</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Dot color={t.accent} size={5} />
          <span style={{ fontFamily: F, fontSize: 11, color: t.dim }}>Quito</span>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Dot color={t.accent} size={5} />
          <span style={{ fontFamily: F, fontSize: 11, color: t.dim }}>Gratis</span>
        </span>
      </div>
    </div>
  );
}
