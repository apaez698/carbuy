import { useState, useEffect, useRef } from "react";

export default function Slider({ t, value, min, max, step, onChange }) {
  const ref  = useRef(null);
  const [drag, setDrag] = useState(false);
  const pct  = ((value - min) / (max - min)) * 100;

  function handleMove(clientX) {
    const r = ref.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const snapped = Math.round((min + p * (max - min)) / step) * step;
    onChange(snapped);
  }

  useEffect(() => {
    if (!drag) return;
    const mv = e => handleMove(e.touches ? e.touches[0].clientX : e.clientX);
    const up = () => setDrag(false);
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", mv, { passive: true });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", mv);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", mv);
      window.removeEventListener("touchend", up);
    };
  }, [drag]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={ref}
      onMouseDown={e => { setDrag(true); handleMove(e.clientX); }}
      onTouchStart={e => { setDrag(true); handleMove(e.touches[0].clientX); }}
      style={{ position: "relative", height: 20, cursor: "pointer", userSelect: "none" }}
    >
      <div style={{ position: "absolute", top: 8, left: 0, right: 0, height: 4, borderRadius: 2, background: t.surface }} />
      <div style={{ position: "absolute", top: 8, left: 0, width: `${pct}%`, height: 4, borderRadius: 2, background: t.accent }} />
      <div style={{
        position: "absolute", top: 1, left: `calc(${pct}% - 9px)`,
        width: 18, height: 18, borderRadius: 9,
        background: t.accent, border: `2px solid ${t.bg}`,
        boxShadow: drag ? `0 0 0 6px ${t.accentDim}` : "none",
        transition: "box-shadow 120ms",
      }} />
    </div>
  );
}
