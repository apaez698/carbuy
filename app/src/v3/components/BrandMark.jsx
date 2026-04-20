import CarGlyph from "./CarGlyph.jsx";

export default function BrandMark({ t }) {
  const isLight = parseInt(t.bg.match(/\d+/)?.[0] ?? "0", 10) > 200;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 7,
        background: t.accentDim, border: `1px solid ${t.accentBorder}`,
        display: "grid", placeItems: "center",
      }}>
        <CarGlyph size={16} color={t.accent} />
      </div>
      <span style={{
        fontFamily: "DM Sans, system-ui, sans-serif",
        fontWeight: 700, fontSize: 13, letterSpacing: 0.78,
        color: isLight ? "rgb(13,17,23)" : "rgb(226,232,240)",
      }}>
        AutoCash
      </span>
    </div>
  );
}
