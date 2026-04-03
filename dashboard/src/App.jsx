import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PasswordGate from "./components/PasswordGate.jsx";
import Layout from "./components/Layout.jsx";
import OverviewPage from "./pages/OverviewPage.jsx";
import LeadsFunnelPage from "./pages/LeadsFunnelPage.jsx";
import ComingSoonPage from "./pages/ComingSoonPage.jsx";
import FlagsPage from "./pages/FlagsPage.jsx";

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

  if (!password) {
    return <PasswordGate onAuth={setPassword} />;
  }

  return (
    <BrowserRouter>
      <Layout
        password={password}
        lastUpdate={lastUpdate}
        onRefresh={handleRefresh}
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
            path="/flags"
            element={<FlagsPage password={password} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App
