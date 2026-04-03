import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import PasswordGate from "./components/PasswordGate.jsx";
import Layout from "./components/Layout.jsx";
import KpiGrid from "./components/KpiGrid.jsx";

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
    queryClient.invalidateQueries({ queryKey: ["metric"] });
    setLastUpdate(getLastUpdateLabel());
  };

  if (!password) {
    return <PasswordGate onAuth={setPassword} />;
  }

  return (
    <Layout
      password={password}
      lastUpdate={lastUpdate}
      onRefresh={handleRefresh}
    >
      <KpiGrid password={password} />
    </Layout>
  );
}

export default App
