// Design tokens — all theme variants
// Each theme maps to a palette; components consume `t` (the active theme object).

export const BRAND = {
  dark: {
    bg: "rgb(10,12,16)", surface: "rgb(13,17,23)", card: "rgb(17,24,39)", border: "rgb(51,60,82)",
    text: "rgb(248,250,252)", muted: "rgb(148,163,184)", dim: "rgb(100,116,139)",
    chipBg: "rgb(22,30,46)", chipText: "rgb(226,232,240)", chipBorder: "rgb(71,85,105)",
    accent: "rgb(34,197,94)", accentDim: "rgba(34,197,94,0.14)", accentBorder: "rgba(34,197,94,0.35)", onAccent: "rgb(10,12,16)",
  },
  light: {
    bg: "rgb(244,246,250)", surface: "rgb(255,255,255)", card: "rgb(255,255,255)", border: "rgb(203,213,225)",
    text: "rgb(13,17,23)", muted: "rgb(71,85,105)", dim: "rgb(100,116,139)",
    chipBg: "rgb(248,250,252)", chipText: "rgb(30,41,59)", chipBorder: "rgb(148,163,184)",
    accent: "rgb(22,163,74)", accentDim: "rgba(22,163,74,0.10)", accentBorder: "rgba(22,163,74,0.40)", onAccent: "rgb(255,255,255)",
  },
  indigo: {
    bg: "rgb(10,12,16)", surface: "rgb(13,17,23)", card: "rgb(17,24,39)", border: "rgb(51,60,82)",
    text: "rgb(248,250,252)", muted: "rgb(148,163,184)", dim: "rgb(100,116,139)",
    chipBg: "rgb(22,30,46)", chipText: "rgb(226,232,240)", chipBorder: "rgb(71,85,105)",
    accent: "rgb(129,140,248)", accentDim: "rgba(129,140,248,0.14)", accentBorder: "rgba(129,140,248,0.35)", onAccent: "rgb(10,12,16)",
  },
  navy: {
    bg: "rgb(8,15,31)", surface: "rgb(13,22,41)", card: "rgb(20,32,57)", border: "rgb(51,72,108)",
    text: "rgb(241,245,253)", muted: "rgb(160,176,208)", dim: "rgb(110,130,168)",
    chipBg: "rgb(26,40,70)", chipText: "rgb(226,232,240)", chipBorder: "rgb(82,104,145)",
    accent: "rgb(56,144,255)", accentDim: "rgba(56,144,255,0.14)", accentBorder: "rgba(56,144,255,0.40)", onAccent: "rgb(255,255,255)",
  },
  teal: {
    bg: "rgb(6,18,22)", surface: "rgb(10,25,31)", card: "rgb(15,36,44)", border: "rgb(42,74,84)",
    text: "rgb(236,253,250)", muted: "rgb(153,184,186)", dim: "rgb(107,138,143)",
    chipBg: "rgb(19,44,52)", chipText: "rgb(226,240,238)", chipBorder: "rgb(70,107,117)",
    accent: "rgb(20,184,166)", accentDim: "rgba(20,184,166,0.14)", accentBorder: "rgba(20,184,166,0.40)", onAccent: "rgb(10,12,16)",
  },
  cream: {
    bg: "rgb(250,247,241)", surface: "rgb(255,253,249)", card: "rgb(255,255,255)", border: "rgb(215,205,185)",
    text: "rgb(30,30,34)", muted: "rgb(90,90,100)", dim: "rgb(135,130,120)",
    chipBg: "rgb(245,240,230)", chipText: "rgb(40,40,44)", chipBorder: "rgb(180,170,150)",
    accent: "rgb(204,85,45)", accentDim: "rgba(204,85,45,0.10)", accentBorder: "rgba(204,85,45,0.40)", onAccent: "rgb(255,255,255)",
  },
};

export const THEME_OPTIONS = [
  { k: "navy",   label: "Navy pro",     swatch: "rgb(56,144,255)"  },
  { k: "dark",   label: "Verde dark",   swatch: "rgb(34,197,94)"   },
  { k: "teal",   label: "Teal fintech", swatch: "rgb(20,184,166)"  },
  { k: "indigo", label: "Indigo",       swatch: "rgb(129,140,248)" },
  { k: "light",  label: "Verde light",  swatch: "rgb(22,163,74)"   },
  { k: "cream",  label: "Cream premium",swatch: "rgb(204,85,45)"   },
];

export const TONE_COPY = {
  cercano: {
    heroTitle: ["Tu auto vale", "dinero hoy"],
    heroSub: "Cotización referencial con IA en segundos.\nDespués un asesor te acompaña por\nWhatsApp hasta cerrar la venta.",
    cta: "Evaluar mi auto →",
    leadTitle: "Primero, ¿cómo te contactamos?",
    leadSub: "Te enviamos la estimación y un asesor te escribe por WhatsApp.",
    vehTitle: "¿Cómo es tu auto?",
    vehSub: "Cuéntanos los detalles del vehículo",
    resultSub: "Estimación referencial IA",
    whatsApp: "📱 Hablar con asesor",
    footer: "Esta estimación es referencial. La oferta final se define con el asesor\nsegún el estado real del vehículo.",
  },
  formal: {
    heroTitle: ["Valoración profesional", "de su vehículo"],
    heroSub: "Obtenga una cotización referencial basada en datos de mercado.\nUn asesor certificado le contactará para formalizar la oferta.",
    cta: "Solicitar valoración →",
    leadTitle: "Datos de contacto",
    leadSub: "Enviaremos la valoración y un asesor se comunicará con usted.",
    vehTitle: "Detalles del vehículo",
    vehSub: "Indique las especificaciones de su auto",
    resultSub: "Valoración referencial",
    whatsApp: "📱 Contactar a un asesor",
    footer: "La presente valoración es referencial. La oferta definitiva se establecerá\ntras la inspección presencial del vehículo.",
  },
};

export const DEFAULT_TWEAKS = {
  theme: "navy",
  resultStyle: "hero",
  tone: "cercano",
  density: "cómoda",
  leadTiming: "antes",
};

export const WHA_NUMBER = "593987444724";
