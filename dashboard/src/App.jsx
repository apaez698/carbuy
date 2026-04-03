import { useState } from "react";
import PasswordGate from "./components/PasswordGate.jsx";
import MetricDebug from "./components/MetricDebug.jsx";

function App() {
  const [password, setPassword] = useState("");

  if (!password) {
    return <PasswordGate onAuth={setPassword} />;
  }

  return <MetricDebug password={password} />;
}

export default App
