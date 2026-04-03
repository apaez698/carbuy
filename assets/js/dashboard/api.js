export async function fetchMetric(dashPass, q) {
  const res = await fetch(
    `/api/metrics?key=${encodeURIComponent(dashPass)}&q=${q}`,
  );

  if (res.status === 401) {
    alert("Contraseña incorrecta");
    location.reload();
    return null;
  }

  if (!res.ok) return null;
  return res.json();
}

export async function clearTestData(dashPass, onSuccess) {
  const ok = confirm(
    "Esta accion eliminara leads, eventos y sesiones de prueba. Deseas continuar?",
  );
  if (!ok) return;

  const res = await fetch(
    `/api/reset-data?key=${encodeURIComponent(dashPass)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE_TEST_DATA" }),
    },
  );

  if (!res.ok) {
    alert("No se pudo limpiar la data. Verifica la clave del dashboard.");
    return;
  }

  alert("Data de prueba eliminada correctamente.");
  if (typeof onSuccess === "function") {
    onSuccess();
  }
}
