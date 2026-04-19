export default function FieldLabel({ t, children }) {
  return (
    <div style={{
      fontFamily: "DM Sans, system-ui, sans-serif",
      fontWeight: 700, fontSize: 10, letterSpacing: 0.8,
      color: t.dim, textTransform: "uppercase", marginBottom: 10,
    }}>
      {children}
    </div>
  );
}
