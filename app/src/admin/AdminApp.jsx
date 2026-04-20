import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { clearTestData } from "../api.js";
import useMetric from "../hooks/useMetric.js";
import AdminHome from "./AdminHome.jsx";
import AdminClients from "./AdminClients.jsx";
import AdminVehicles from "./AdminVehicles.jsx";
import AdminValuations from "./AdminValuations.jsx";
import AdminInteractions from "./AdminInteractions.jsx";
import "../dashboard.css";

const NAV_ITEMS = [
  { label: "Resumen", icon: "📊", path: "" },
  { label: "Clientes", icon: "👤", path: "clients" },
  { label: "Vehículos", icon: "🚗", path: "vehicles" },
  { label: "Valuaciones", icon: "💰", path: "valuations" },
  { label: "Interacciones", icon: "🔄", path: "interactions" },
];

function getLastUpdateLabel() {
  return `Actualizado ${new Date().toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function AdminApp({ password }) {
  const [lastUpdate, setLastUpdate] = useState("—");
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setLastUpdate(getLastUpdateLabel());
    const timerId = setInterval(() => {
      setLastUpdate(getLastUpdateLabel());
    }, 30000);
    return () => clearInterval(timerId);
  }, []);

  const handleRefresh = () => {
    queryClient.refetchQueries({ queryKey: ["metric"], type: "active" });
    setLastUpdate(getLastUpdateLabel());
  };

  const handleClearData = async () => {
    const shouldDelete = window.confirm(
      "Esta accion eliminara leads, eventos, sesiones y feedback de prueba. Deseas continuar?",
    );
    if (!shouldDelete) return;

    const result = await clearTestData(password);
    if (!result.ok) {
      window.alert(
        result.status === 401
          ? "No autorizado. Verifica la clave."
          : "No se pudo limpiar la data.",
      );
      return;
    }

    queryClient.refetchQueries({ queryKey: ["metric"], type: "active" });
    setLastUpdate(getLastUpdateLabel());
    window.alert("Data de prueba eliminada correctamente.");
  };

  const currentPath = location.pathname.replace(/^\/admin\/?/, "").replace(/\/$/, "");

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="wordmark">
            <span className="v">Auto</span>
            <span className="y">Cash</span>
          </div>
          <p>Dashboard · Admin</p>
        </div>

        <div className="nav-section">
          <div className="nav-label">Datos</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`nav-item ${currentPath === item.path ? "active" : ""}`.trim()}
              style={{
                background: "none",
                border: "none",
                textAlign: "left",
                width: "100%",
              }}
              onClick={() => navigate(`/admin/${item.path}`)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-label">Acciones</div>
          <button
            type="button"
            className="nav-item"
            style={{
              background: "none",
              border: "none",
              textAlign: "left",
              width: "100%",
            }}
            onClick={() => window.open("/", "_blank")}
          >
            <span className="icon">🚀</span>
            Ver Cotizador
          </button>
        </div>

        <div className="sidebar-footer">
          Auto-refresh cada 30s
          <br />
          <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>
            {lastUpdate}
          </span>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <h1>DASHBOARD — AUTOCASH</h1>
          <div className="topbar-right">
            <div className="badge-live">EN VIVO</div>
            <button className="btn-refresh" onClick={handleRefresh}>
              ↻ Actualizar
            </button>
            <button className="btn-danger" onClick={handleClearData}>
              🧹 Limpiar data de prueba
            </button>
          </div>
        </div>

        <div className="content">
          <Routes>
            <Route index element={<AdminHome password={password} />} />
            <Route path="clients" element={<AdminClients password={password} />} />
            <Route path="vehicles" element={<AdminVehicles password={password} />} />
            <Route path="valuations" element={<AdminValuations password={password} />} />
            <Route path="interactions" element={<AdminInteractions password={password} />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
