import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { id: "section-resumen", icon: "📊", label: "Resumen", path: "/" },
  { id: "section-leads", icon: "🚗", label: "Leads", path: "/leads" },
  {
    id: "section-conversion",
    icon: "📈",
    label: "Conversión",
    path: "/conversion",
    comingSoon: true,
  },
  { id: "section-funnel", icon: "🗺️", label: "Funnel", path: "/funnel" },
];

const DATA_ITEMS = [
  {
    id: "section-formularios",
    icon: "📋",
    label: "Formularios",
    path: "/formularios",
    comingSoon: true,
  },
  {
    id: "section-whatsapp",
    icon: "💬",
    label: "WhatsApp",
    path: "/whatsapp",
    comingSoon: true,
  },
];

function Layout({
  children,
  password,
  onRefresh,
  onClearData,
  lastUpdate,
  onSectionChange,
}) {
  const [activeSection, setActiveSection] = useState("section-resumen");
  const navigate = useNavigate();
  const location = useLocation();

  const handleSectionClick = (item) => {
    setActiveSection(item.id);
    if (onSectionChange) onSectionChange(item.id);
    if (item.path && location.pathname !== item.path) {
      navigate(item.path);
    }
  };

  const isItemActive = (item) => {
    if (location.pathname === "/" && item.id === "section-resumen") return true;
    if (location.pathname === "/leads" && item.id === "section-leads") return true;
    if (location.pathname === "/conversion" && item.id === "section-conversion") return true;
    if (location.pathname === "/funnel" && item.id === "section-funnel") return true;
    if (location.pathname === "/formularios" && item.id === "section-formularios") return true;
    if (location.pathname === "/whatsapp" && item.id === "section-whatsapp") return true;
    return activeSection === item.id;
  };

  const updateLabel = lastUpdate || "Cargando...";

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="wordmark">
            <span className="v">Vendo</span>
            <span className="y">Ya</span>
          </div>
          <p>Dashboard · Admin</p>
        </div>

        <div className="nav-section">
          <div className="nav-label">Análisis</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isItemActive(item) ? "active" : ""}`.trim()}
              data-target={item.id}
              style={{ background: "none", border: "none", textAlign: "left", width: "100%" }}
              onClick={() => handleSectionClick(item)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
              {item.comingSoon ? (
                <span style={{ opacity: 0.65, marginLeft: 6, fontSize: 12 }}>
                  (en construcción)
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-label">Datos</div>
          {DATA_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isItemActive(item) ? "active" : ""}`.trim()}
              data-target={item.id}
              style={{ background: "none", border: "none", textAlign: "left", width: "100%" }}
              onClick={() => handleSectionClick(item)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
              {item.comingSoon ? (
                <span style={{ opacity: 0.65, marginLeft: 6, fontSize: 12 }}>
                  (en construcción)
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          Auto-refresh cada 30s
          <br />
          <span id="lastUpdate" style={{ color: "rgba(255, 255, 255, 0.3)" }}>
            {updateLabel}
          </span>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <h1>DASHBOARD — VENDOYA</h1>
          <div className="topbar-right">
            <div className="badge-live">EN VIVO</div>
            <button className="btn-refresh" onClick={() => onRefresh?.()}>
              ↻ Actualizar
            </button>
            <button className="btn-danger" onClick={() => onClearData?.()}>
              🧹 Limpiar data de prueba
            </button>
          </div>
        </div>

        <div className="content">{children}</div>
      </main>
    </div>
  );
}

export default Layout;