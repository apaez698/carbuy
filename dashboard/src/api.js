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
  try {
    const res = await fetch(
      `/api/reset-data?key=${encodeURIComponent(dashPass)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE_TEST_DATA" }),
      },
    );

    let payload = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }

    return {
      ok: res.ok,
      status: res.status,
      error: payload?.error || null,
    };
  } catch {
    return { ok: false, status: 0, error: "network_error" };
  }
}

export async function fetchFlags() {
  try {
    const res = await fetch("/api/flags");
    if (!res.ok) return null;

    const payload = await res.json();
    return payload.flags || null;
  } catch {
    return null;
  }
}

export async function updateFlag(dashPass, name, value) {
  try {
    const res = await fetch(`/api/flags?key=${encodeURIComponent(dashPass)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, value }),
    });

    if (res.status === 401) {
      throw new AuthError();
    }

    if (!res.ok) return null;

    const payload = await res.json();
    return payload.flags || null;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    return null;
  }
}

export async function fetchCacheState(dashPass) {
  try {
    const res = await fetch(
      `/api/cache-admin?key=${encodeURIComponent(dashPass)}`,
    );

    if (res.status === 401) {
      throw new AuthError();
    }

    if (!res.ok) return null;

    const payload = await res.json();
    return payload || null;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    return null;
  }
}

export async function mutateCache(dashPass, action) {
  try {
    const res = await fetch(
      `/api/cache-admin?key=${encodeURIComponent(dashPass)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      },
    );

    if (res.status === 401) {
      throw new AuthError();
    }

    if (!res.ok) return null;

    const payload = await res.json();
    return payload || null;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    return null;
  }
}
