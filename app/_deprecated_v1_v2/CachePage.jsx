import { useEffect, useMemo, useState } from "react";
import { AuthError, fetchCacheState, mutateCache } from "../api.js";

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("es-EC");
}

function formatTtl(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "expirada";

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export default function CachePage({ password }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cacheData, setCacheData] = useState(null);

  const loadState = async () => {
    setLoading(true);
    setError("");

    try {
      const payload = await fetchCacheState(password);
      if (!payload) {
        setError("No se pudo cargar el estado del cache.");
        return;
      }

      setCacheData(payload);
    } catch (err) {
      if (err instanceof AuthError) {
        setError("No autorizado. Verifica la clave del dashboard.");
        return;
      }

      setError("No se pudo cargar el estado del cache.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  const predict = cacheData?.predict || {};
  const metadata = cacheData?.metadata || {};

  const predictEntries = useMemo(() => {
    const entries = predict.entries;
    return Array.isArray(entries) ? entries : [];
  }, [predict.entries]);

  const runAction = async (action, successLabel) => {
    const ok = window.confirm(`Confirmar accion: ${successLabel}?`);
    if (!ok) return;

    setSaving(true);
    setError("");

    try {
      const payload = await mutateCache(password, action);
      if (!payload) {
        setError("No se pudo ejecutar la accion de cache.");
        return;
      }

      setCacheData(payload);
      window.alert("Accion ejecutada correctamente.");
    } catch (err) {
      if (err instanceof AuthError) {
        setError("No autorizado. Verifica la clave del dashboard.");
      } else {
        setError("No se pudo ejecutar la accion de cache.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 920 }}>
      <div className="chart-card" id="section-cache">
        <div className="card-header">
          <h3>Cache Admin</h3>
          <span
            className="badge"
            style={{
              background: "rgba(88,111,156,0.2)",
              color: "var(--text-mid)",
              fontSize: 11,
            }}
          >
            instancia actual
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "16px 24px",
            borderBottom: "1px solid rgba(88, 111, 156, 0.15)",
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn-refresh"
            onClick={loadState}
            disabled={loading || saving}
          >
            Recargar estado
          </button>
          <button
            className="btn-danger"
            onClick={() =>
              runAction("clear_predict", "limpiar cache de pricing predict")
            }
            disabled={loading || saving}
          >
            Limpiar predict
          </button>
          <button
            className="btn-danger"
            onClick={() =>
              runAction("clear_metadata", "limpiar cache de pricing metadata")
            }
            disabled={loading || saving}
          >
            Limpiar metadata
          </button>
          <button
            className="btn-danger"
            onClick={() => runAction("clear_all", "limpiar todo el cache")}
            disabled={loading || saving}
          >
            Limpiar todo
          </button>
        </div>

        {error ? (
          <p
            style={{
              margin: 0,
              padding: "14px 24px",
              color: "#b91c1c",
              borderBottom: "1px solid rgba(88, 111, 156, 0.15)",
            }}
          >
            {error}
          </p>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              border: "1px solid rgba(88, 111, 156, 0.2)",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
              Pricing Predict
            </p>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 13,
                color: "var(--text-mid)",
              }}
            >
              Entradas: {Number.isFinite(predict.size) ? predict.size : 0}
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "var(--text-mid)",
              }}
            >
              TTL base:{" "}
              {Number.isFinite(predict.ttlMs)
                ? `${Math.floor(predict.ttlMs / 1000)}s`
                : "-"}
            </p>
          </div>

          <div
            style={{
              border: "1px solid rgba(88, 111, 156, 0.2)",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
              Pricing Metadata
            </p>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 13,
                color: "var(--text-mid)",
              }}
            >
              En cache: {metadata.hasValue ? "si" : "no"}
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "var(--text-mid)",
              }}
            >
              Expira: {formatDateTime(metadata.expiresAtIso)}
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "var(--text-mid)",
              }}
            >
              TTL restante: {formatTtl(metadata.ttlRemainingSec)}
            </p>
          </div>
        </div>

        <div style={{ padding: "0 24px 20px" }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 13 }}>
            Claves activas de predict
          </p>
          <div
            style={{
              border: "1px solid rgba(88, 111, 156, 0.2)",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {loading ? (
              <p
                style={{
                  margin: 0,
                  padding: 12,
                  fontSize: 12,
                  color: "var(--text-mid)",
                }}
              >
                Cargando...
              </p>
            ) : predictEntries.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  padding: 12,
                  fontSize: 12,
                  color: "var(--text-mid)",
                }}
              >
                Sin entradas en cache.
              </p>
            ) : (
              predictEntries.map((entry) => (
                <div
                  key={entry.key}
                  style={{
                    padding: "10px 12px",
                    borderTop: "1px solid rgba(88, 111, 156, 0.1)",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: "var(--text)",
                    }}
                  >
                    {entry.key}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 11,
                      color: "var(--text-mid)",
                    }}
                  >
                    Expira: {formatDateTime(entry.expiresAtIso)} · TTL:{" "}
                    {formatTtl(entry.ttlRemainingSec)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
