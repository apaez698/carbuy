export default function CarGlyph({ size = 28, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13l1.8-4.5A2.5 2.5 0 0 1 7.1 7h9.8a2.5 2.5 0 0 1 2.3 1.5L21 13" />
      <path d="M3 13h18v4a1 1 0 0 1-1 1h-1.5" />
      <path d="M5.5 18H4a1 1 0 0 1-1-1v-4" />
      <circle cx="7.5" cy="17.5" r="1.6" fill={color} />
      <circle cx="16.5" cy="17.5" r="1.6" fill={color} />
    </svg>
  );
}
