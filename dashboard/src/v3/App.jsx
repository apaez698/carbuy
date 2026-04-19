import { useState, useEffect, useCallback } from "react";
import { BRAND, TONE_COPY, DEFAULT_TWEAKS, THEME_OPTIONS, WHA_NUMBER } from "./tokens.js";
import { fetchEstimate, saveLead, saveFeedback } from "./api.js";
import { lsSaveClient, lsSaveAuto, lsSaveFeedback, loadUIState, saveUIState, clearUIState } from "./store.js";
import ScreenHero    from "./screens/ScreenHero.jsx";
import ScreenLead    from "./screens/ScreenLead.jsx";
import ScreenVehicle from "./screens/ScreenVehicle.jsx";
import ScreenResult  from "./screens/ScreenResult.jsx";
import FeedbackModal from "./modals/FeedbackModal.jsx";

// ─── Flow steps ──────────────────────────────────────────────────────────────
// leadTiming "antes": HERO(0) → LEAD(1) → VEHICLE(2) → RESULT(3)
// leadTiming "despues": HERO(0) → VEHICLE(1) → RESULT(2) → LEAD_MODAL(99)
const STEPS = { HERO: 0, LEAD: 1, VEHICLE: 2, RESULT: 3, LEAD_MODAL: 99 };

const BLANK_CLIENT  = { name: "", phone: "", email: "", terms: false };
const BLANK_VEHICLE = { brand: "Toyota", model: "Corolla", year: 2020, km: 48000, estado: "Excelente" };

// ─── Tweaks panel (dev/admin — enabled via ?tweaks=1) ────────────────────────
function TweakChip({ active, onClick, children }) {
  const F = "DM Sans, system-ui, sans-serif";
  return (
    <button onClick={onClick} style={{
      padding: "7px 11px", borderRadius: 8,
      background: active ? "rgba(129,140,248,0.18)" : "rgb(22,30,46)",
      border: `1.5px solid ${active ? "rgb(129,140,248)" : "rgb(71,85,105)"}`,
      color: active ? "rgb(165,180,252)" : "rgb(226,232,240)",
      fontFamily: F, fontSize: 11, fontWeight: active ? 600 : 500, cursor: "pointer",
    }}>{children}</button>
  );
}

function ThemeSwatch({ active, swatch, label, onClick }) {
  const F = "DM Sans, system-ui, sans-serif";
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "7px 11px 7px 8px", borderRadius: 8,
      background: active ? "rgba(129,140,248,0.18)" : "rgb(22,30,46)",
      border: `1.5px solid ${active ? "rgb(129,140,248)" : "rgb(71,85,105)"}`,
      color: "rgb(226,232,240)",
      fontFamily: F, fontSize: 11, fontWeight: active ? 600 : 500, cursor: "pointer",
    }}>
      <span style={{ width: 14, height: 14, borderRadius: 4, background: swatch, border: "1px solid rgba(255,255,255,0.15)" }} />
      {label}
    </button>
  );
}

function TweakGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: "rgb(100,116,139)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{children}</div>
    </div>
  );
}

function TweaksPanel({ tweaks, setTweak, onClose }) {
  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, width: 320,
      background: "rgb(17,24,39)", border: "1px solid rgb(51,60,82)",
      borderRadius: 14, padding: 16, color: "rgb(248,250,252)",
      boxShadow: "0 20px 50px rgba(0,0,0,0.5)", zIndex: 100,
      fontFamily: "DM Sans, system-ui, sans-serif", maxHeight: "90vh", overflowY: "auto",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}>TWEAKS</div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgb(148,163,184)", cursor: "pointer", fontSize: 16 }}>✕</button>
      </div>

      <TweakGroup label="Tema de marca">
        {THEME_OPTIONS.map(opt => (
          <ThemeSwatch key={opt.k} active={tweaks.theme === opt.k} swatch={opt.swatch} label={opt.label} onClick={() => setTweak("theme", opt.k)} />
        ))}
      </TweakGroup>

      <TweakGroup label="Estilo resultado">
        {["hero", "card"].map(k => (
          <TweakChip key={k} active={tweaks.resultStyle === k} onClick={() => setTweak("resultStyle", k)}>
            {k === "hero" ? "Hero grande" : "Card sobria"}
          </TweakChip>
        ))}
      </TweakGroup>

      <TweakGroup label="Copy">
        {["cercano", "formal"].map(k => (
          <TweakChip key={k} active={tweaks.tone === k} onClick={() => setTweak("tone", k)}>
            {k === "cercano" ? "Cercano EC" : "Formal"}
          </TweakChip>
        ))}
      </TweakGroup>

      <TweakGroup label="Densidad">
        {["cómoda", "compacta"].map(k => (
          <TweakChip key={k} active={tweaks.density === k} onClick={() => setTweak("density", k)}>{k}</TweakChip>
        ))}
      </TweakGroup>

      <TweakGroup label="¿Cuándo pedir el lead?">
        {["antes", "despues"].map(k => (
          <TweakChip key={k} active={tweaks.leadTiming === k} onClick={() => setTweak("leadTiming", k)}>
            {k === "antes" ? "Antes de estimación" : "Después (al contactar)"}
          </TweakChip>
        ))}
      </TweakGroup>

      <a href="/dashboard" target="_blank" style={{ display: "block", marginTop: 10, fontSize: 11, color: "rgb(129,140,248)", textAlign: "center", textDecoration: "none" }}>
        Ver leads en dashboard ↗
      </a>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const showTweaks = new URLSearchParams(window.location.search).has("tweaks");

  // Restore persisted state so a page refresh doesn't lose mid-flow progress
  const saved = loadUIState();

  // If a previous session saved RESULT step but estimate is missing, fall back to VEHICLE
  const savedStep = (() => {
    const s = saved.step ?? STEPS.HERO;
    if (s === STEPS.RESULT && !saved.estimate) return STEPS.VEHICLE;
    return s;
  })();

  const [tweaks,    setTweaks]    = useState(() => ({ ...DEFAULT_TWEAKS, ...saved.tweaks }));
  const [step,      setStep]      = useState(savedStep);
  const [client,    setClient]    = useState(saved.client  ?? BLANK_CLIENT);
  const [vehicle,   setVehicle]   = useState(saved.vehicle ?? BLANK_VEHICLE);
  const [estimate,  setEstimate]  = useState(saved.estimate ?? null);
  const [loading,   setLoading]   = useState(false);

  // Lead IDs after remote save
  const [remoteLeadId, setRemoteLeadId] = useState(null);
  const [localIds,     setLocalIds]     = useState(null); // { clientId, autoId }

  // Feedback flow state
  const [feedbackOpen,      setFeedbackOpen]      = useState(false);
  const [feedbackPreset,    setFeedbackPreset]    = useState(null);
  const [feedbackRequired,  setFeedbackRequired]  = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackShown,     setFeedbackShown]     = useState(false);

  // Active theme + copy
  const t    = BRAND[tweaks.theme] ?? BRAND.navy;
  const copy = TONE_COPY[tweaks.tone] ?? TONE_COPY.cercano;
  const dens = tweaks.density === "compacta" ? 0.88 : 1;
  const pageBg = ["light", "cream"].includes(tweaks.theme) ? "rgb(228,232,239)" : "rgb(6,7,10)";

  // Persist UI state on every meaningful change
  useEffect(() => {
    saveUIState({ step, client, vehicle, estimate, tweaks });
  }, [step, client, vehicle, estimate, tweaks]);

  function setTweak(key, value) {
    setTweaks(prev => ({ ...prev, [key]: value }));
  }

  // ── Lead save (both localStorage and Supabase) ──────────────────────────
  const persistLead = useCallback(async (clientData, vehicleData, estimateData) => {
    const cId = lsSaveClient(clientData);
    const aId = lsSaveAuto(cId, vehicleData, estimateData);
    setLocalIds({ clientId: cId, autoId: aId });

    const remoteId = await saveLead({
      client:    clientData,
      vehicle:   vehicleData,
      estimate:  estimateData,
      sessionId: null,
    });
    setRemoteLeadId(remoteId);
    return { clientId: cId, autoId: aId, remoteId };
  }, []);

  // ── Estimate flow ────────────────────────────────────────────────────────
  async function goEstimate() {
    const resultStep = tweaks.leadTiming === "antes" ? STEPS.RESULT : STEPS.RESULT;
    setLoading(true);
    setStep(resultStep);

    const est = await fetchEstimate(vehicle);
    setEstimate(est);
    setLoading(false);

    if (client.name && client.phone) {
      await persistLead(client, vehicle, est);
    }

    if (!feedbackShown) {
      setTimeout(() => { setFeedbackOpen(true); setFeedbackShown(true); }, 4500);
    }
  }

  // ── WhatsApp CTA ─────────────────────────────────────────────────────────
  async function openWhatsApp() {
    if (!client.name || !client.phone) {
      setStep(STEPS.LEAD_MODAL);
      return;
    }
    if (!localIds) {
      await persistLead(client, vehicle, estimate);
    }

    const fmtV = n => "$" + Math.round(n).toLocaleString("en-US");
    const fmtK = n => n.toLocaleString("en-US") + " km";
    const msg = encodeURIComponent(
      `Hola AutoCash, soy ${client.name}. Me interesa vender mi ${vehicle.brand} ${vehicle.model} ${vehicle.year} ` +
      `(${fmtK(vehicle.km)}, ${vehicle.estado}). La estimación que vi fue ${fmtV(estimate.estimate)}.`
    );
    window.open(`https://wa.me/${WHA_NUMBER}?text=${msg}`, "_blank");
  }

  // ── Reset (with feedback gate) ───────────────────────────────────────────
  function resetAll() {
    if (estimate && !feedbackSubmitted) {
      setFeedbackRequired(true);
      setFeedbackOpen(true);
      return;
    }
    performReset();
  }

  function performReset() {
    clearUIState();
    setStep(STEPS.HERO);
    setClient(BLANK_CLIENT);
    setVehicle(BLANK_VEHICLE);
    setEstimate(null);
    setLocalIds(null);
    setRemoteLeadId(null);
    setFeedbackShown(false);
    setFeedbackSubmitted(false);
    setFeedbackRequired(false);
    setFeedbackOpen(false);
  }

  // ── Feedback submission ──────────────────────────────────────────────────
  async function submitFeedback({ rating, comment }) {
    lsSaveFeedback({ rating, comment, clientId: localIds?.clientId, autoId: localIds?.autoId, estimate: estimate?.estimate });
    await saveFeedback({ rating, comment, clientId: localIds?.clientId, vehicleId: localIds?.autoId, estimate: estimate?.estimate });

    setFeedbackSubmitted(true);
    const wasRequired = feedbackRequired;
    setFeedbackRequired(false);
    setFeedbackOpen(false);
    setFeedbackPreset(null);

    if (wasRequired) {
      setTimeout(performReset, 0);
    }
  }

  function openFeedback(preset = null) {
    setFeedbackPreset(preset);
    setFeedbackOpen(true);
    setFeedbackShown(true);
  }

  // ── Step routing ─────────────────────────────────────────────────────────
  const isAntes = tweaks.leadTiming === "antes";

  function renderScreen() {
    switch (step) {
      case STEPS.HERO:
        return <ScreenHero t={t} copy={copy} onStart={() => setStep(isAntes ? STEPS.LEAD : STEPS.VEHICLE)} />;

      case STEPS.LEAD:
        return (
          <ScreenLead t={t} copy={copy} value={client} onChange={setClient}
            onBack={() => setStep(STEPS.HERO)}
            onNext={() => setStep(STEPS.VEHICLE)}
            step={1} totalSteps={3} />
        );

      case STEPS.VEHICLE:
        return (
          <ScreenVehicle t={t} copy={copy} value={vehicle} onChange={setVehicle}
            onBack={() => setStep(isAntes ? STEPS.LEAD : STEPS.HERO)}
            onNext={goEstimate}
            step={isAntes ? 2 : 1} totalSteps={isAntes ? 3 : 2} />
        );

      case STEPS.RESULT:
        return (
          <ScreenResult t={t} copy={copy} resultStyle={tweaks.resultStyle}
            vehicle={vehicle} estimate={estimate} loading={loading}
            onBack={() => setStep(STEPS.VEHICLE)}
            onWhatsApp={openWhatsApp}
            onAnother={resetAll}
            onFeedback={openFeedback} />
        );

      case STEPS.LEAD_MODAL:
        return (
          <ScreenLead t={t} copy={copy} value={client} onChange={setClient}
            onBack={() => setStep(STEPS.RESULT)}
            onNext={async () => {
              setStep(STEPS.RESULT);
              setTimeout(openWhatsApp, 50);
            }}
            step={3} totalSteps={3} />
        );

      default:
        return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: pageBg, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 12px" }}>
      {/* Phone shell */}
      <div style={{
        width: 390, minHeight: 820, maxWidth: "100%",
        borderRadius: 36, overflow: "hidden",
        background: t.bg, border: `1px solid ${t.border}`,
        color: t.text, fontSize: `${dens * 100}%`,
        position: "relative",
        boxShadow: "0 40px 80px -20px rgba(0,0,0,0.6)",
      }}>
        {renderScreen()}

        {/* Feedback modal (bottom-sheet) */}
        {feedbackOpen && estimate && !loading && (
          <FeedbackModal
            t={t}
            preset={feedbackPreset}
            required={feedbackRequired}
            onClose={() => { if (!feedbackRequired) { setFeedbackOpen(false); setFeedbackPreset(null); } }}
            onSubmit={submitFeedback}
          />
        )}

        {/* Thank-you overlay after feedback sent */}
        {feedbackSubmitted && !feedbackOpen && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)",
            display: "grid", placeItems: "center", padding: 24, zIndex: 50,
            animation: "fadeIn 180ms ease",
          }}>
            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: "28px 24px", textAlign: "center", maxWidth: 300 }}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: t.accentDim, display: "grid", placeItems: "center", margin: "0 auto 12px", fontSize: 22 }}>
                ✓
              </div>
              <div style={{ fontFamily: "DM Sans, system-ui, sans-serif", fontWeight: 700, fontSize: 16, color: t.text }}>¡Gracias por tu feedback!</div>
              <div style={{ fontFamily: "DM Sans, system-ui, sans-serif", fontSize: 12, color: t.muted, marginTop: 6, lineHeight: 1.5 }}>Tu opinión nos ayuda a afinar el modelo.</div>
            </div>
          </div>
        )}
      </div>

      {/* Tweaks panel — only when ?tweaks=1 */}
      {showTweaks && (
        <TweaksPanel tweaks={tweaks} setTweak={setTweak} onClose={() => window.history.replaceState({}, "", window.location.pathname)} />
      )}

      <style>{`
        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 0 rgba(56,144,255,0.45); }
          70%  { box-shadow: 0 0 0 22px rgba(56,144,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(56,144,255,0); }
        }
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        div::-webkit-scrollbar { display: none; }
        @media (max-width: 430px) {
          .phone-shell { border-radius: 0 !important; border: none !important; min-height: 100vh !important; }
        }
      `}</style>
    </div>
  );
}
