import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { clearTestData } from "./api.js";
import PasswordGate from "./components/PasswordGate.jsx";
import Layout from "./components/Layout.jsx";
import OverviewPage from "./pages/OverviewPage.jsx";
import LeadsFunnelPage from "./pages/LeadsFunnelPage.jsx";
import ComingSoonPage from "./pages/ComingSoonPage.jsx";
import FlagsPage from "./pages/FlagsPage.jsx";
import CachePage from "./pages/CachePage.jsx";
import FeedbackBetaPage from "./pages/FeedbackBetaPage.jsx";

function getLastUpdateLabel() {
  return `Actualizado ${new Date().toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function App() {
  const [password, setPassword] = useState("");
  const [lastUpdate, setLastUpdate] = useState("—");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!password) return undefined;

    setLastUpdate(getLastUpdateLabel());
    const timerId = setInterval(() => {
      setLastUpdate(getLastUpdateLabel());
    }, 30000);

    return () => clearInterval(timerId);
  }, [password]);

  const handleRefresh = () => {
    queryClient.refetchQueries({ queryKey: ["metric"], type: "active" });
    setLastUpdate(getLastUpdateLabel());
  };

  const handleClearData = async () => {
    const shouldDelete = window.confirm(
      "Esta accion eliminara leads, eventos, sesiones y feedback beta de prueba. Deseas continuar?",
    );
    if (!shouldDelete) return;

    const result = await clearTestData(password);
    if (!result.ok) {
      if (result.status === 401) {
        window.alert("No autorizado. Verifica la clave del dashboard.");
        return;
      }

      if (result.status === 400) {
        window.alert("No se pudo limpiar la data: confirmacion invalida.");
        return;
      }

      window.alert("No se pudo limpiar la data. Intenta nuevamente.");
      return;
    }

    queryClient.refetchQueries({ queryKey: ["metric"], type: "active" });
    setLastUpdate(getLastUpdateLabel());
    window.alert("Data de prueba eliminada correctamente.");
  };

  if (!password) {
    return <PasswordGate onAuth={setPassword} />;
  }

  return (
    <BrowserRouter>
      <Layout
        password={password}
        lastUpdate={lastUpdate}
        onRefresh={handleRefresh}
        onClearData={handleClearData}
      >
        <Routes>
          <Route path="/" element={<OverviewPage password={password} />} />
          <Route
            path="/conversion"
            element={<ComingSoonPage title="Conversión" />}
          />
          <Route
            path="/leads"
            element={<LeadsFunnelPage password={password} mode="leads" />}
          />
          <Route
            path="/funnel"
            element={<LeadsFunnelPage password={password} mode="funnel" />}
          />
          <Route
            path="/formularios"
            element={<ComingSoonPage title="Formularios" />}
          />
          <Route
            path="/whatsapp"
            element={<ComingSoonPage title="WhatsApp" />}
          />
          <Route
            path="/feedback-beta"
            element={<FeedbackBetaPage password={password} />}
          />
          <Route path="/flags" element={<FlagsPage password={password} />} />
          <Route path="/cache" element={<CachePage password={password} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
