import { useState } from "react";

function PasswordGate({ onAuth }) {
  const [password, setPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!password.trim()) return;
    onAuth(password);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <form
        className="config-banner"
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "440px",
          flexDirection: "column",
          alignItems: "stretch",
          gap: "12px",
        }}
      >
        <p>Ingresa la contraseña del dashboard</p>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña"
          aria-label="Contraseña del dashboard"
          style={{
            width: "100%",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            padding: "10px 12px",
            font: "inherit",
            background: "#fff",
          }}
        />
        <button type="submit" className="btn-refresh">
          Entrar
        </button>
      </form>
    </div>
  );
}

export default PasswordGate;