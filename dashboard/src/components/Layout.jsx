import { useState } from "react";

const NAV_ITEMS = [
  { id: "section-resumen", icon: "📊", label: "Resumen" },
  { id: "section-leads", icon: "🚗", label: "Leads" },
  { id: "section-conversion", icon: "📈", label: "Conversión" },
  { id: "section-funnel", icon: "🗺️", label: "Funnel" },
];

const DATA_ITEMS = [
  { id: "section-formularios", icon: "📋", label: "Formularios" },
  { id: "section-whatsapp", icon: "💬", label: "WhatsApp" },
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

  const handleSectionClick = (id) => {
    setActiveSection(id);
    if (onSectionChange) onSectionChange(id);
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
            <a
              key={item.id}
              className={`nav-item ${activeSection === item.id ? "active" : ""}`.trim()}
              data-target={item.id}
              onClick={() => handleSectionClick(item.id)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-label">Datos</div>
          {DATA_ITEMS.map((item) => (
            <a
              key={item.id}
              className={`nav-item ${activeSection === item.id ? "active" : ""}`.trim()}
              data-target={item.id}
              onClick={() => handleSectionClick(item.id)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </a>
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