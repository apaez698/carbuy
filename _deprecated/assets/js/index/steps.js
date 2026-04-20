import { api, track, SESSION_ID } from "./tracking.js";
import { validateStep } from "./validation.js";

const TOTAL_STEPS = 3;
let _currentStep = 1;
let _stepStart = Date.now();

// ============================================================
// SCROLL INTELIGENTE (solo si es necesario)
// ============================================================
function scrollToFormIfNeeded() {
  const formSection = document.getElementById("formulario");
  if (!formSection) return;

  const rect = formSection.getBoundingClientRect();
  const isVisible = rect.top >= 0 && rect.top < window.innerHeight;

  if (!isVisible) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export function getStep() {
  return _currentStep;
}

export function getStepStart() {
  return _stepStart;
}

export function showStep(n) {
  document
    .querySelectorAll(".form-step")
    .forEach((s) => s.classList.remove("active"));

  const el = document.getElementById("step" + n);
  if (el) el.classList.add("active");

  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const dot = document.getElementById("dot" + i);
    const lbl = document.getElementById("lbl" + i);
    dot.classList.remove("active", "done");
    if (lbl) lbl.classList.remove("active");
    if (i < n) {
      dot.classList.add("done");
      dot.textContent = "✓";
    } else if (i === n) {
      dot.classList.add("active");
      dot.textContent = i;
      if (lbl) lbl.classList.add("active");
    } else {
      dot.textContent = i;
    }
  }

  for (let i = 1; i < TOTAL_STEPS; i++) {
    document.getElementById("line" + i)?.classList.toggle("done", i < n);
  }

  document.getElementById("stepCounter").textContent =
    "Paso " + n + " de " + TOTAL_STEPS;
  document.getElementById("btnBack").style.visibility =
    n > 1 ? "visible" : "hidden";

  const btnNext = document.getElementById("btnNext");
  if (n === TOTAL_STEPS) {
    btnNext.textContent = "✅ Enviar cotización";
    btnNext.className = "btn btn-submit";
  } else {
    btnNext.textContent = "Siguiente →";
    btnNext.className = "btn btn-next";
  }

  track("step_start", { step: n });
  _stepStart = Date.now();
  _currentStep = n;
}

export function goNext() {
  if (!validateStep(_currentStep)) return;
  const timeOnStep = Math.round((Date.now() - _stepStart) / 1000);
  track("step_complete", { step: _currentStep, time_on_step: timeOnStep });
  api("/api/session", { id: SESSION_ID, max_step: _currentStep }, "PATCH");
  showStep(_currentStep + 1);
  scrollToFormIfNeeded();
}

export function goBack() {
  if (_currentStep > 1) {
    track("step_abandon", {
      step: _currentStep,
      time_on_step: Math.round((Date.now() - _stepStart) / 1000),
    });
    showStep(_currentStep - 1);
    scrollToFormIfNeeded();
  }
}
