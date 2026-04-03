import { useState } from "react";
import PasswordGate from "./components/PasswordGate.jsx";
import Layout from "./components/Layout.jsx";

function App() {
  const [password, setPassword] = useState("");

  if (!password) {
    return <PasswordGate onAuth={setPassword} />;
  }

  return (
    <Layout password={password} lastUpdate="Cargando...">
      <p>Contenido</p>
    </Layout>
  );
}

export default App
