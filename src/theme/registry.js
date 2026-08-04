const createTheme = (theme) => ({
  ...theme,
  bg: theme.background,
  textMuted: theme.muted,
  surfaceStrong: theme.hover,
  borderStrong: theme.borderStrong ?? theme.border,
  borderWidth: "1px",
  borderStyle: "solid",
  emphasisMode: "color",
  eyebrow: theme.secondary,
  badgeBg: theme.active,
  badgeBorder: theme.borderStrong ?? theme.border,
  badgeText: theme.text,
  glow: theme.glow,
  glow2: theme.glow2,
  headlineStyle: "normal",
  cornerMarks: false,
});

export const THEMES = Object.freeze({
  slateIndigo: createTheme({
    id: "slateIndigo", label: "Slate Indigo", description: "Focused, precise, developer-tool dark mode",
    swatch: ["#0a0a0e", "#6366f1", "#f2f2f7"], canvas: "network",
    primary: "#6366f1", secondary: "#a5a8ff", accent: "#6366f1", detail: "#6366f1",
    background: "radial-gradient(circle at 0% 0%, #202044 0%, #11111c 34%, #0a0a0e 72%)",
    surface: "rgba(20, 20, 28, 0.78)", card: "rgba(20, 20, 28, 0.72)",
    border: "rgba(255,255,255,0.08)", borderStrong: "rgba(165,168,255,0.42)",
    hover: "rgba(42, 42, 60, 0.82)", active: "rgba(99,102,241,0.18)",
    text: "#f2f2f7", muted: "#888888", success: "#4ade80", warning: "#fbbf24", error: "#fb7185",
    shadow: "0 18px 52px rgba(0, 0, 0, 0.36)", radius: "14px", onAccent: "#ffffff",
    glow: "rgba(99,102,241,0.26)", glow2: "rgba(165,168,255,0.42)",
  }),
  warmStone: createTheme({
    id: "warmStone", label: "Warm Stone", description: "Calm, elegant, warm workspace",
    swatch: ["#413d36", "#f4ede1", "#fdf8f0"], canvas: "starfall",
    primary: "#f4ede1", secondary: "#eee3d3", accent: "#f4ede1", detail: "#6366f1",
    background: "linear-gradient(160deg, #413d36 0%, #6b6255 55%, #8a7c68 100%)",
    surface: "rgba(65, 61, 54, 0.56)", card: "rgba(84, 78, 69, 0.52)",
    border: "rgba(255,255,255,0.15)", borderStrong: "rgba(255,248,240,0.42)",
    hover: "rgba(255,248,240,0.13)", active: "rgba(244,237,225,0.17)",
    text: "#fdf8f0", muted: "#eee3d3", success: "#9cd9ad", warning: "#f4cf78", error: "#f0a0a0",
    shadow: "0 18px 52px rgba(43, 37, 30, 0.28)", radius: "16px", onAccent: "#413d36",
    glow: "rgba(244,237,225,0.16)", glow2: "rgba(244,237,225,0.28)",
  }),
});

export const THEME_ORDER = Object.freeze(["slateIndigo", "warmStone"]);
export const getAvailableThemes = () => THEME_ORDER.map((id) => THEMES[id]);
