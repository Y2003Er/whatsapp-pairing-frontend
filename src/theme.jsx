import { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Each theme is a full design language, not a recolor: it sets its own
 * background texture (grain / scanlines / dot-grid / blueprint-grid),
 * heading font, card treatment (flat vs. hard-shadow vs. dashed), and how
 * emphasis is shown (solid ink color vs. underline vs. accent color) —
 * so switching themes actually changes the *feel* of the page, not just
 * the hue.
 */
export const THEMES = {
  graphite: {
    id: "graphite",
    label: "Graphite",
    swatch: ["#1c1f26", "#9fb4c7", "#eef1f4"],
    isLight: false,
    texture: "grain",
    bg: "linear-gradient(155deg, #16181d 0%, #1c1f26 55%, #131519 100%)",
    text: "#eef1f4",
    textMuted: "rgba(238,241,244,0.55)",
    surface: "rgba(255,255,255,0.035)",
    surfaceStrong: "rgba(255,255,255,0.07)",
    border: "rgba(255,255,255,0.09)",
    borderStrong: "rgba(159,180,199,0.4)",
    borderWidth: "1px",
    borderStyle: "solid",
    radius: "10px",
    shadow: "none",
    accent: "#9fb4c7",
    onAccent: "#12151a",
    emphasisMode: "color",
    eyebrow: "#9fb4c7",
    badgeBg: "rgba(159,180,199,0.08)",
    badgeBorder: "rgba(159,180,199,0.24)",
    badgeText: "#c3d3e0",
    glow: "rgba(159,180,199,0.25)",
    glow2: "rgba(159,180,199,0.35)",
    headlineFont: "'Space Grotesk', sans-serif",
    headlineWeight: 600,
    headlineStyle: "normal",
    cornerMarks: false,
  },
  phosphor: {
    id: "phosphor",
    label: "Phosphor",
    swatch: ["#050806", "#4ade80", "#d9ffe4"],
    isLight: false,
    texture: "scanline",
    bg: "linear-gradient(180deg, #050806 0%, #071009 60%, #030503 100%)",
    text: "#d9ffe4",
    textMuted: "rgba(217,255,228,0.5)",
    surface: "rgba(74,222,128,0.045)",
    surfaceStrong: "rgba(74,222,128,0.09)",
    border: "rgba(74,222,128,0.2)",
    borderStrong: "rgba(74,222,128,0.5)",
    borderWidth: "1px",
    borderStyle: "solid",
    radius: "6px",
    shadow: "none",
    accent: "#4ade80",
    onAccent: "#04150a",
    emphasisMode: "color",
    eyebrow: "#4ade80",
    badgeBg: "rgba(74,222,128,0.06)",
    badgeBorder: "rgba(74,222,128,0.32)",
    badgeText: "#86efac",
    glow: "rgba(74,222,128,0.35)",
    glow2: "rgba(74,222,128,0.5)",
    headlineFont: "'IBM Plex Mono', monospace",
    headlineWeight: 600,
    headlineStyle: "normal",
    cornerMarks: false,
  },
  paper: {
    id: "paper",
    label: "Paper",
    swatch: ["#faf9f6", "#c0392b", "#14120f"],
    isLight: true,
    texture: "dots",
    bg: "linear-gradient(180deg, #faf9f6 0%, #f5f3ee 100%)",
    text: "#14120f",
    textMuted: "rgba(20,18,15,0.6)",
    surface: "#ffffff",
    surfaceStrong: "#ffffff",
    border: "rgba(20,18,15,0.16)",
    borderStrong: "rgba(192,57,43,0.45)",
    borderWidth: "1.5px",
    borderStyle: "solid",
    radius: "4px",
    shadow: "5px 5px 0 rgba(20,18,15,0.09)",
    accent: "#c0392b",
    onAccent: "#faf9f6",
    emphasisMode: "underline",
    eyebrow: "#c0392b",
    badgeBg: "#ffffff",
    badgeBorder: "rgba(20,18,15,0.16)",
    badgeText: "#14120f",
    glow: "rgba(192,57,43,0.16)",
    glow2: "rgba(192,57,43,0.22)",
    headlineFont: "'Fraunces', serif",
    headlineWeight: 600,
    headlineStyle: "normal",
    cornerMarks: false,
  },
  blueprint: {
    id: "blueprint",
    label: "Blueprint",
    swatch: ["#06111f", "#5fd4ff", "#eaf4ff"],
    isLight: false,
    texture: "grid",
    bg: "linear-gradient(160deg, #06111f 0%, #0a1b2e 55%, #050e1a 100%)",
    text: "#eaf4ff",
    textMuted: "rgba(234,244,255,0.55)",
    surface: "rgba(95,212,255,0.04)",
    surfaceStrong: "rgba(95,212,255,0.09)",
    border: "rgba(95,212,255,0.2)",
    borderStrong: "rgba(95,212,255,0.5)",
    borderWidth: "1px",
    borderStyle: "dashed",
    radius: "2px",
    shadow: "none",
    accent: "#5fd4ff",
    onAccent: "#03101c",
    emphasisMode: "color",
    eyebrow: "#5fd4ff",
    badgeBg: "rgba(95,212,255,0.06)",
    badgeBorder: "rgba(95,212,255,0.3)",
    badgeText: "#9fe3ff",
    glow: "rgba(95,212,255,0.3)",
    glow2: "rgba(95,212,255,0.42)",
    headlineFont: "'Space Grotesk', sans-serif",
    headlineWeight: 600,
    headlineStyle: "normal",
    cornerMarks: true,
  },
};

export const THEME_ORDER = ["graphite", "phosphor", "paper", "blueprint"];
const STORAGE_KEY = "26tech-theme";
const DEFAULT_THEME = "graphite";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_THEME;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved && THEMES[saved] ? saved : DEFAULT_THEME;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, themeId);
    } catch {
      // Private-browsing / storage-disabled — theme just won't persist across visits.
    }
  }, [themeId]);

  const value = useMemo(
    () => ({ themeId, setThemeId, theme: THEMES[themeId] }),
    [themeId]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside a ThemeProvider");
  return ctx;
}
