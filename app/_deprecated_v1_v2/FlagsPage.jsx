import { FLAGS } from "../featureFlags.js";
import useFlag from "../hooks/useFlag.js";

const FLAG_DESCRIPTIONS = {
  NEW_LEADS_VIEW: "Reemplaza la tabla de leads por la nueva vista en construcción.",
  SHOW_EXPORT_BUTTON: "Muestra el botón de exportar datos en el dashboard.",
  FORM_V1_HIDDEN: "Oculta el formulario actual de la página principal.",
  FORM_V2_ENABLED: "Muestra el nuevo formulario en la página principal.",
  COTIZADOR_BUTTON: "Muestra el botón 'Cotizar auto' en la landing principal.",
};

function FlagRow({ name, dashboardPassword }) {
  const [enabled, setEnabled] = useFlag(name, { dashboardPassword });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        gap: 20,
        padding: "18px 24px",
        borderBottom: "1px solid rgba(88, 111, 156, 0.15)",
      }}
    >
      <div>
        <p style={{ margin: 0, fontFamily: "monospace", fontSize: 13, color: "var(--text)", fontWeight: 700 }}>
          {name}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-mid)" }}>
          {FLAG_DESCRIPTIONS[name] ?? "—"}
        </p>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <span style={{ fontSize: 12, color: enabled ? "var(--green)" : "var(--text-mid)", minWidth: 36 }}>
          {enabled ? "ON" : "OFF"}
        </span>
        <div
          onClick={() => setEnabled(!enabled)}
          role="switch"
          aria-checked={Boolean(enabled)}
          tabIndex={0}
          onKeyDown={(e) => (e.key === " " || e.key === "Enter") && setEnabled(!enabled)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            background: enabled ? "var(--green)" : "rgba(88, 111, 156, 0.35)",
            position: "relative",
            transition: "background 0.2s",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 3,
              left: enabled ? 23 : 3,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.2s",
              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }}
          />
        </div>
      </label>
    </div>
  );
}

export default function FlagsPage({ password }) {
  return (
    <div style={{ maxWidth: 640 }}>
      <div className="chart-card" id="section-flags">
        <div className="card-header">
          <h3>Feature Flags</h3>
          <span className="badge" style={{ background: "rgba(88,111,156,0.2)", color: "var(--text-mid)", fontSize: 11 }}>
            {Object.keys(FLAGS).length} flags
          </span>
        </div>

        <p style={{ margin: "0 24px 0", padding: "16px 0", fontSize: 13, color: "var(--text-mid)", borderBottom: "1px solid rgba(88, 111, 156, 0.15)" }}>
          Los cambios se guardan en la base de datos y aplican a todos los usuarios sin recargar.
        </p>

        <div>
          {Object.keys(FLAGS).map((name) => (
            <FlagRow key={name} name={name} dashboardPassword={password} />
          ))}
        </div>
      </div>
    </div>
  );
}
