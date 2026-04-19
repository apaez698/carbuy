// V3 persistence layer
// Writes to BOTH localStorage (backward-compat with V1/V2 admin panel)
// and Supabase via /api/lead (real persistence).

// localStorage keys match V1/V2 admin panel expectations
const LS_CLIENTS  = "autocash.clients";
const LS_AUTOS    = "autocash.AUTOS";
const LS_STATE    = "autocash.v3.state";
const LS_FEEDBACK = "autocash.feedback";

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota exceeded — ignore */ }
}

// Persist client data to localStorage in V1/V2-compatible format
export function lsSaveClient(client) {
  const clients = lsGet(LS_CLIENTS, []);
  const id = uid("c");
  clients.push({ id, ...client, created_at: new Date().toISOString() });
  lsSet(LS_CLIENTS, clients);
  return id;
}

// Persist vehicle + estimate to localStorage
export function lsSaveAuto(clientId, vehicle, estimate) {
  const autos = lsGet(LS_AUTOS, []);
  const id = uid("a");
  autos.push({
    id,
    client_id:   clientId,
    brand:       vehicle.brand,
    model:       vehicle.model,
    year:        vehicle.year,
    km:          vehicle.km,
    estado:      vehicle.estado,
    estimate:    estimate?.estimate    ?? null,
    range_low:   estimate?.range_low  ?? null,
    range_high:  estimate?.range_high ?? null,
    created_at:  new Date().toISOString(),
  });
  lsSet(LS_AUTOS, autos);
  return id;
}

export function lsSaveFeedback(payload) {
  const arr = lsGet(LS_FEEDBACK, []);
  arr.push({ ...payload, created_at: new Date().toISOString() });
  lsSet(LS_FEEDBACK, arr);
}

// Persisted UI state so refreshing mid-flow restores where the user was
export function loadUIState() {
  return lsGet(LS_STATE, {});
}

export function saveUIState(state) {
  lsSet(LS_STATE, state);
}

export function clearUIState() {
  try { localStorage.removeItem(LS_STATE); } catch { /* ignore */ }
}
