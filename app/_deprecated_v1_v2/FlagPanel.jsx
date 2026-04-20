import { FLAGS } from "../featureFlags.js";
import useFlag from "../hooks/useFlag.js";

function FlagToggle({ name, dashboardPassword }) {
  const [enabled, setEnabled] = useFlag(name, { dashboardPassword });

  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        fontSize: 12,
        color: "#e6ebf5",
      }}
    >
      <span style={{ fontFamily: "monospace" }}>{name}</span>
      <input
        type="checkbox"
        checked={Boolean(enabled)}
        onChange={(event) => setEnabled(event.target.checked)}
      />
    </label>
  );
}

export default function FlagPanel({ dashboardPassword }) {
  const isVisible =
    new URLSearchParams(window.location.search).get("flags") === "1" || import.meta.env.DEV;

  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        top: 88,
        width: 260,
        background: "rgba(14, 22, 40, 0.95)",
        border: "1px solid rgba(88, 111, 156, 0.45)",
        borderRadius: 12,
        padding: 12,
        zIndex: 1200,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.35)",
      }}
    >
      <p style={{ margin: "0 0 10px 0", color: "#9fb3d8", fontSize: 11, letterSpacing: 1 }}>
        FEATURE FLAGS
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        {Object.keys(FLAGS).map((flagName) => (
          <FlagToggle key={flagName} name={flagName} dashboardPassword={dashboardPassword} />
        ))}
      </div>
    </div>
  );
}
