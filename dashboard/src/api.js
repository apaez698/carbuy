export class AuthError extends Error {
  constructor(message = "Contraseña incorrecta") {
    super(message);
    this.name = "AuthError";
  }
}

export async function fetchMetric(dashPass, query) {
  const res = await fetch(
    `/api/metrics?key=${encodeURIComponent(dashPass)}&q=${query}`,
  );

  if (res.status === 401) {
    throw new AuthError();
  }

  if (!res.ok) return null;
  return res.json();
}

export async function clearTestData(dashPass) {
  const res = await fetch(
    `/api/reset-data?key=${encodeURIComponent(dashPass)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE_TEST_DATA" }),
    },
  );

  return res.ok;
}
