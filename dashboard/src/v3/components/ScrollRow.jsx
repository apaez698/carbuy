import { useRef, useEffect, useCallback } from "react";

/**
 * Carousel-style horizontal row with:
 * - GPU-accelerated translateX hint animation (sub-pixel smooth)
 * - Click-and-drag on desktop
 * - Touch swipe on mobile
 */
export default function ScrollRow({ children, gap = 8, rowGap, resetKey, reverse = false, rows = 1 }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const rafRef = useRef(null);
  const drag = useRef({ active: false, startX: 0, scrollStart: 0 });

  /* ---- helper: stop hint and settle into scrollLeft ---- */
  const stopHint = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    const inner = innerRef.current;
    const outer = outerRef.current;
    if (!inner || !outer) return;
    // read current translateX, convert to scrollLeft, remove transform
    const tx = parseFloat(inner.style.transform?.match(/-?[\d.]+/)?.[0] || "0");
    if (tx !== 0) {
      outer.scrollLeft = Math.round(-tx);
      inner.style.transform = "";
      inner.style.willChange = "";
    }
  }, []);

  /* ---- smooth translateX hint animation ---- */
  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    // reset
    outer.scrollLeft = 0;
    inner.style.transform = "";
    inner.style.willChange = "";

    const init = requestAnimationFrame(() => {
      const maxScroll = inner.scrollWidth - outer.clientWidth;
      if (maxScroll <= 0) return;

      const travel = Math.min(maxScroll, 200);
      // reverse: start showing end, slide toward start (positive translateX from negative)
      const fromTx = reverse ? -maxScroll : 0;
      const toTx = reverse ? -(maxScroll - travel) : -travel;
      if (reverse) outer.scrollLeft = 0; // keep scrollLeft at 0, translateX does the shift

      inner.style.willChange = "transform";
      const duration = 9000;
      let start = null;

      const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const tx = fromTx + (toTx - fromTx) * progress;
        inner.style.transform = `translateX(${tx}px)`;
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          // settle: convert final translateX to scrollLeft
          outer.scrollLeft = Math.round(-tx);
          inner.style.transform = "";
          inner.style.willChange = "";
        }
      };
      rafRef.current = requestAnimationFrame(step);
    });

    return () => {
      cancelAnimationFrame(init);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [resetKey, reverse]);

  /* ---- mouse drag for desktop ---- */
  const onMouseDown = useCallback((e) => {
    stopHint();
    const outer = outerRef.current;
    drag.current = { active: true, startX: e.clientX, scrollStart: outer.scrollLeft };
    outer.style.cursor = "grabbing";
    outer.style.userSelect = "none";
  }, [stopHint]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.startX;
      outerRef.current.scrollLeft = drag.current.scrollStart - dx;
    };
    const onMouseUp = () => {
      if (!drag.current.active) return;
      drag.current.active = false;
      const outer = outerRef.current;
      if (outer) { outer.style.cursor = "grab"; outer.style.userSelect = ""; }
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, []);

  return (
    <div
      ref={outerRef}
      onMouseDown={onMouseDown}
      onTouchStart={stopHint}
      onWheel={stopHint}
      style={{
        overflowX: "auto",
        paddingBottom: 4,
        cursor: "grab",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
        overflow: "hidden",
      }}
    >
      <div
        ref={innerRef}
        style={{
          display: "flex", gap, rowGap: rowGap ?? gap, width: "max-content",
          ...(rows > 1 ? { flexWrap: "wrap", flexDirection: "column", maxHeight: rows * 42 + (rows - 1) * (rowGap ?? gap) } : {}),
        }}
      >
        {children}
      </div>
    </div>
  );
}
