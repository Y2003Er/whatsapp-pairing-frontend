const createTheme = ({
  id,
  label,
  swatch,
  isLight = false,
  texture = "none",
  primary,
  secondary,
  accent = primary,
  background,
  surface,
  card = surface,
  border,
  hover,
  active,
  text,
  muted,
  success,
  warning,
  error,
  shadow,
  radius,
  onAccent,
  borderStrong = border,
  borderWidth = "1px",
  borderStyle = "solid",
  headlineFont = "'Inter', sans-serif",
  headlineWeight = 650,
  headlineStyle = "normal",
  cornerMarks = false,
}) => ({
  // Semantic color and geometry tokens
  id, label, swatch, isLight, texture, primary, secondary, accent, background,
  surface, card, border, hover, active, text, muted, success, warning, error,
  shadow, radius,

  // Legacy aliases retained for the current provider and component styles.
  bg: background,
  textMuted: muted,
  surfaceStrong: hover,
  borderStrong,
  borderWidth,
  borderStyle,
  onAccent,
  emphasisMode: "color",
  eyebrow: secondary,
  badgeBg: active,
  badgeBorder: borderStrong,
  badgeText: text,
  glow: `color-mix(in srgb, ${accent} 28%, transparent)`,
  glow2: `color-mix(in srgb, ${accent} 42%, transparent)`,
  headlineFont,
  headlineWeight,
  headlineStyle,
  cornerMarks,
});

export const THEMES = {
  midnightBlack: createTheme({
    id: "midnightBlack", label: "Midnight Black", swatch: ["#050505", "#ffffff", "#a1a1aa"],
    primary: "#ffffff", secondary: "#a1a1aa", background: "linear-gradient(145deg, #050505 0%, #0b0b0c 52%, #050505 100%)",
    surface: "#111113", card: "#171719", border: "#27272a", hover: "#202023", active: "#2a2a2e",
    text: "#fafafa", muted: "#a1a1aa", success: "#34d399", warning: "#fbbf24", error: "#fb7185",
    shadow: "0 18px 50px rgba(0,0,0,0.38)", radius: "12px", onAccent: "#09090b", borderStrong: "#52525b",
  }),
  amoledBlack: createTheme({
    id: "amoledBlack", label: "AMOLED Black", swatch: ["#000000", "#d4ff00", "#e4e4e7"],
    primary: "#d4ff00", secondary: "#a1a1aa", background: "#000000",
    surface: "#080808", card: "#0d0d0d", border: "#242424", hover: "#161616", active: "#202020",
    text: "#f5f5f5", muted: "#a3a3a3", success: "#4ade80", warning: "#facc15", error: "#f87171",
    shadow: "0 16px 40px rgba(0,0,0,0.72)", radius: "10px", onAccent: "#080808", borderStrong: "#4d4d4d",
  }),
  oceanBlue: createTheme({
    id: "oceanBlue", label: "Ocean Blue", swatch: ["#071525", "#38bdf8", "#dbeafe"],
    primary: "#38bdf8", secondary: "#7dd3fc", background: "linear-gradient(145deg, #061323 0%, #0a2340 52%, #071525 100%)",
    surface: "#0b1e34", card: "#102841", border: "#1d4266", hover: "#153454", active: "#1c456d",
    text: "#e0f2fe", muted: "#94b8d4", success: "#2dd4bf", warning: "#fbbf24", error: "#fb7185",
    shadow: "0 18px 45px rgba(2, 24, 52, 0.46)", radius: "14px", onAccent: "#042f49", borderStrong: "#2a6d9d",
  }),
  emeraldGreen: createTheme({
    id: "emeraldGreen", label: "Emerald Green", swatch: ["#061b16", "#34d399", "#d1fae5"],
    primary: "#34d399", secondary: "#6ee7b7", background: "linear-gradient(145deg, #061b16 0%, #0b2a22 52%, #071813 100%)",
    surface: "#0b251e", card: "#103127", border: "#1b5745", hover: "#164333", active: "#1c5943",
    text: "#d1fae5", muted: "#8fc9b0", success: "#4ade80", warning: "#fbbf24", error: "#fb7185",
    shadow: "0 18px 45px rgba(2, 38, 27, 0.48)", radius: "14px", onAccent: "#052e24", borderStrong: "#278561",
  }),
  royalPurple: createTheme({
    id: "royalPurple", label: "Royal Purple", swatch: ["#160a2d", "#a78bfa", "#ede9fe"],
    primary: "#a78bfa", secondary: "#c4b5fd", background: "linear-gradient(145deg, #160a2d 0%, #2a1251 52%, #160a2d 100%)",
    surface: "#251044", card: "#311657", border: "#5b3b8a", hover: "#41206e", active: "#54308b",
    text: "#f3e8ff", muted: "#c4b5e0", success: "#4ade80", warning: "#fbbf24", error: "#fb7185",
    shadow: "0 18px 48px rgba(25, 6, 56, 0.52)", radius: "14px", onAccent: "#241047", borderStrong: "#815bc4",
  }),
  crimsonRed: createTheme({
    id: "crimsonRed", label: "Crimson Red", swatch: ["#26080d", "#fb7185", "#ffe4e6"],
    primary: "#fb7185", secondary: "#fda4af", background: "linear-gradient(145deg, #26080d 0%, #42101a 52%, #25070c 100%)",
    surface: "#351017", card: "#47131d", border: "#79303b", hover: "#5b1a26", active: "#752130",
    text: "#fff1f2", muted: "#e7a3aa", success: "#4ade80", warning: "#fbbf24", error: "#fda4af",
    shadow: "0 18px 48px rgba(55, 4, 12, 0.5)", radius: "12px", onAccent: "#4c0519", borderStrong: "#a33a4a",
  }),
  sunsetOrange: createTheme({
    id: "sunsetOrange", label: "Sunset Orange", swatch: ["#2a1005", "#fb923c", "#fff7ed"],
    primary: "#fb923c", secondary: "#fdba74", background: "linear-gradient(145deg, #2a1005 0%, #4a1b08 52%, #211006 100%)",
    surface: "#351707", card: "#48200c", border: "#7c3e16", hover: "#5b2a0f", active: "#743819",
    text: "#fff7ed", muted: "#e9b08a", success: "#4ade80", warning: "#facc15", error: "#fb7185",
    shadow: "0 18px 48px rgba(58, 19, 2, 0.5)", radius: "14px", onAccent: "#431407", borderStrong: "#b85b21",
  }),
  arcticWhite: createTheme({
    id: "arcticWhite", label: "Arctic White", swatch: ["#f8fafc", "#2563eb", "#0f172a"], isLight: true,
    primary: "#2563eb", secondary: "#475569", background: "linear-gradient(145deg, #f8fafc 0%, #eaf0f8 52%, #ffffff 100%)",
    surface: "#ffffff", card: "#ffffff", border: "#dbe3ee", hover: "#edf3fb", active: "#dce9f8",
    text: "#0f172a", muted: "#64748b", success: "#059669", warning: "#d97706", error: "#dc2626",
    shadow: "0 18px 45px rgba(15, 23, 42, 0.1)", radius: "12px", onAccent: "#ffffff", borderStrong: "#93b4de",
  }),
  cyberNeon: createTheme({
    id: "cyberNeon", label: "Cyber Neon", swatch: ["#070914", "#22d3ee", "#f0abfc"],
    primary: "#22d3ee", secondary: "#f0abfc", accent: "#a78bfa", background: "linear-gradient(145deg, #070914 0%, #101233 52%, #0a0718 100%)",
    surface: "#11142a", card: "#161a35", border: "#354073", hover: "#202650", active: "#2d356b",
    text: "#f1f5f9", muted: "#a6b0d4", success: "#5eead4", warning: "#facc15", error: "#fb7185",
    shadow: "0 18px 50px rgba(9, 11, 40, 0.64)", radius: "10px", onAccent: "#100c2c", borderStrong: "#6476c6",
  }),
  glassmorphism: createTheme({
    id: "glassmorphism", label: "Glassmorphism", swatch: ["#172554", "#c4b5fd", "#f8fafc"],
    primary: "#c4b5fd", secondary: "#93c5fd", accent: "#e9d5ff", background: "linear-gradient(135deg, #172554 0%, #312e81 45%, #581c87 100%)",
    surface: "rgba(255,255,255,0.10)", card: "rgba(255,255,255,0.14)", border: "rgba(255,255,255,0.20)", hover: "rgba(255,255,255,0.18)", active: "rgba(255,255,255,0.25)",
    text: "#f8fafc", muted: "#cbd5e1", success: "#6ee7b7", warning: "#fde68a", error: "#fda4af",
    shadow: "0 22px 60px rgba(15, 23, 42, 0.32)", radius: "18px", onAccent: "#2e1065", borderStrong: "rgba(255,255,255,0.36)",
  }),
};

export const THEME_ORDER = [
  "midnightBlack", "amoledBlack", "oceanBlue", "emeraldGreen", "royalPurple",
  "crimsonRed", "sunsetOrange", "arcticWhite", "cyberNeon", "glassmorphism",
];

/** Register a new theme at runtime while retaining the configured ordering. */
export function registerTheme(theme) {
  if (!theme || !theme.id) return;
  THEMES[theme.id] = theme;
  if (!THEME_ORDER.includes(theme.id)) THEME_ORDER.push(theme.id);
}

export function getAvailableThemes() {
  return THEME_ORDER.map((id) => THEMES[id]);
}
