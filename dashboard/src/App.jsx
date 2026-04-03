import { useState } from "react";
import PasswordGate from "./components/PasswordGate.jsx";

function App() {
  const [password, setPassword] = useState("");

  if (!password) {
    return <PasswordGate onAuth={setPassword} />;
  }

  return <p>Autenticado</p>;
}

export default App
