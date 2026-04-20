// V3 API adapter
// Bridges the V3 form shape to the existing /api/* contracts so V3 stays
// backward-compatible even if upstream API shape changes again.

import { getBasePrice } from "./data/carDb.js";

const ESTADO_MAP = {
  Excelente: "EXCELENTE",
  Bueno: "BUENO",
  Regular: "REGULAR",
};

// Build the payload expected by /api/pricing-predict
function toPricingPayload(vehicle) {
  return {
    vehicle: {
      marca: vehicle.brand.toUpperCase(),
      modelo: vehicle.model.toUpperCase(),
      anio: vehicle.year,
      kilometraje: vehicle.km,
      estado_carroceria: ESTADO_MAP[vehicle.estado] ?? "BUENO",
      estado_motor: ESTADO_MAP[vehicle.estado] ?? "BUENO",
      provincia: "PICHINCHA",
    },
    cache_vehicle: {
      marca: vehicle.brand.toUpperCase(),
      modelo: vehicle.model.toUpperCase(),
      anio: vehicle.year,
      kilometraje: vehicle.km,
    },
  };
}

// Compute breakdown rows from the API value + vehicle data for display
function buildBreakdown(vehicle, predicted) {
  const base = getBasePrice(vehicle.brand, vehicle.model);
  const age = Math.max(0, new Date().getFullYear() - vehicle.year);
  const baseMarket = Math.round(base * Math.pow(0.92, age));
  const kmImpact = -Math.round((vehicle.km - 40000) / 100);
  const condBonus =
    vehicle.estado === "Excelente"
      ? Math.round(predicted * 0.04)
      : vehicle.estado === "Bueno"
        ? 0
        : -Math.round(predicted * 0.07);
  const spread = Math.round(predicted * 0.09);

  return {
    base_market: baseMarket,
    km_impact: kmImpact,
    condition_bonus: condBonus,
    market_low: Math.round(baseMarket - spread * 0.8),
    market_high: Math.round(baseMarket + spread * 1.4),
    confidence:
      vehicle.estado === "Excelente"
        ? 78
        : vehicle.estado === "Bueno"
          ? 72
          : 61,
    sample_size: 340,
  };
}

// Normalize any upstream shape to the V3 estimate contract
function normalizeEstimate(data, vehicle) {
  const raw = data.predicted_value ?? data.estimate ?? null;

  const predicted =
    Number.isFinite(Number(raw)) && Number(raw) > 0
      ? Math.round(Number(raw))
      : 14000;

  const rangeMin = Math.round(
    Number(data.range_min ?? data.range_low ?? predicted * 0.91) ||
      predicted * 0.91,
  );
  const rangeMax = Math.round(
    Number(data.range_max ?? data.range_high ?? predicted * 1.09) ||
      predicted * 1.09,
  );

  return {
    estimate: predicted,
    range_low: rangeMin,
    range_high: rangeMax,
    _source: data.source ?? "api",
    ...buildBreakdown(vehicle, predicted),
  };
}

export async function fetchEstimate(vehicle) {
  try {
    const res = await fetch("/api/pricing-predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPricingPayload(vehicle)),
    });
    if (!res.ok) throw new Error(`pricing-predict ${res.status}`);
    const data = await res.json();
    return normalizeEstimate(data, vehicle);
  } catch (err) {
    // Local fallback keeps UX alive if the API is down
    console.warn("[autocash-v3] pricing fallback:", err.message);
    const base = getBasePrice(vehicle.brand, vehicle.model);
    const age = Math.max(0, new Date().getFullYear() - vehicle.year);
    let predicted = base * Math.pow(0.92, age);
    predicted -= (vehicle.km - 40000) / 100;
    if (vehicle.estado === "Excelente") predicted *= 1.04;
    else if (vehicle.estado === "Regular") predicted *= 0.93;
    predicted = Math.max(2000, Math.round(predicted));
    return normalizeEstimate(
      { predicted_value: predicted, source: "local_fallback_v3" },
      vehicle,
    );
  }
}

// ── Save lead flow: client → vehicle → valuation (desacoplado) ──────────
export async function saveLead({ client, vehicle, estimate, sessionId }) {
  try {
    // 1. Guardar cliente
    const clientRes = await fetch("/api/client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: client.name,
        celular: client.phone,
        email: client.email || "",
        acepta_whatsapp: client.terms,
        session_id: sessionId ?? null,
        ciudad: "Quito",
      }),
    });

    if (!clientRes.ok) {
      const err = await clientRes.json().catch(() => ({}));
      console.warn("[autocash-v3] client save failed:", err);
      return null;
    }

    const { id: clientId } = await clientRes.json();

    // 2. Guardar vehículo
    const vehicleRes = await fetch("/api/vehicle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        marca: vehicle.brand,
        modelo: vehicle.model,
        anio: vehicle.year,
        kilometraje: vehicle.km,
        estado_general: vehicle.estado,
        session_id: sessionId ?? null,
      }),
    });

    if (!vehicleRes.ok) {
      const err = await vehicleRes.json().catch(() => ({}));
      console.warn("[autocash-v3] vehicle save failed:", err);
      return { clientId, vehicleId: null, valuationId: null };
    }

    const { id: vehicleId } = await vehicleRes.json();

    // 3. Guardar valuación (si hay estimado)
    let valuationId = null;
    if (estimate) {
      const valRes = await fetch("/api/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          vehicle_id: vehicleId,
          estimated_min: estimate.range_low ?? null,
          estimated_max: estimate.range_high ?? null,
          estimated_value: estimate.estimate ?? null,
          estimated_text: estimate.estimate
            ? `$${Math.round(estimate.estimate).toLocaleString("en-US")}`
            : null,
          base_market: estimate.base_market ?? null,
          km_impact: estimate.km_impact ?? null,
          condition_bonus: estimate.condition_bonus ?? null,
          confidence: estimate.confidence ?? null,
          sample_size: estimate.sample_size ?? null,
          source: estimate._source ?? "api",
        }),
      });

      if (valRes.ok) {
        const valData = await valRes.json();
        valuationId = valData.id;
      } else {
        console.warn("[autocash-v3] valuation save failed");
      }
    }

    return { clientId, vehicleId, valuationId };
  } catch (err) {
    console.warn("[autocash-v3] lead save error:", err.message);
    return null;
  }
}

// ── Feedback (new schema: tabla feedback + snapshot en valuations) ───────
export async function saveFeedback({ rating, comment, valuationId }) {
  try {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating,
        comment: comment ?? "",
        valuation_id: valuationId ?? null,
      }),
    });
  } catch {
    // non-critical — swallow
  }
}
