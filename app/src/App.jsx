import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CotizadorApp from "./v3/App.jsx";
import AdminApp from "./admin/AdminApp.jsx";
import PasswordGate from "./components/PasswordGate.jsx";

const queryClient = new QueryClient();

function AppRouter() {
  const [password, setPassword] = useState("");

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin/*"
          element={
            password ? (
              <AdminApp password={password} />
            ) : (
              <PasswordGate onAuth={setPassword} />
            )
          }
        />
        <Route path="/*" element={<CotizadorApp />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  );
}

export default App;
