import ScreenHeader from "./ScreenHeader.jsx";
import TextInput from "../components/TextInput.jsx";
import FieldLabel from "../components/FieldLabel.jsx";
import { PrimaryBtn } from "../components/Buttons.jsx";

const F = "DM Sans, system-ui, sans-serif";

export default function ScreenLead({ t, copy, value, onChange, onBack, onNext, step, totalSteps }) {
  const phoneOk = /^\+?\d{7,}$/.test(value.phone.replace(/\s/g, ""));
  const nameOk  = value.name.trim().length >= 2;
  const valid   = phoneOk && nameOk && value.terms;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <ScreenHeader t={t} onBack={onBack} step={step} total={totalSteps} title={copy.leadTitle} sub={copy.leadSub} />

      <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
        <div>
          <FieldLabel t={t}>Nombre completo</FieldLabel>
          <TextInput
            t={t} value={value.name} autoFocus
            onChange={v => onChange({ ...value, name: v })}
            placeholder="Ej. María González"
          />
        </div>

        <div>
          <FieldLabel t={t}>WhatsApp</FieldLabel>
          <TextInput
            t={t} type="tel" value={value.phone} prefix="🇪🇨 +593"
            onChange={v => onChange({ ...value, phone: v })}
            placeholder="09 9999 9999"
          />
          <div style={{ fontFamily: F, fontSize: 11, color: t.dim, marginTop: 6 }}>
            Por aquí te envía la oferta el asesor.
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginTop: 4 }}>
          <input
            type="checkbox" checked={value.terms}
            onChange={e => onChange({ ...value, terms: e.target.checked })}
            style={{ width: 18, height: 18, accentColor: t.accent, marginTop: 1 }}
          />
          <span style={{ fontFamily: F, fontSize: 12, color: t.muted, lineHeight: 1.5 }}>
            Acepto los{" "}
            <a href="/terminos" target="_blank" style={{ color: t.accent, textDecoration: "none" }}>términos</a>
            {" "}y la{" "}
            <a href="/privacidad" target="_blank" style={{ color: t.accent, textDecoration: "none" }}>política de privacidad</a>
            . Sin spam, solo sobre tu auto.
          </span>
        </label>

        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          <PrimaryBtn t={t} disabled={!valid} onClick={onNext}>Continuar →</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}
