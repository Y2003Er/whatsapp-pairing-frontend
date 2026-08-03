import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { THEMES, THEME_ORDER, registerTheme, getAvailableThemes } from "./registry";
import { readTheme, writeTheme } from "./storage";

// Default theme id (kept in sync with registry defaults)
const DEFAULT_THEME = "graphite";

export { THEMES, THEME_ORDER, registerTheme, getAvailableThemes };

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_THEME;
    const saved = readTheme();
    return saved && THEMES[saved] ? saved : DEFAULT_THEME;
  });

  // Apply theme to document and persist changes.
  useEffect(() => {
    try {
      if (typeof document !== "undefined" && themeId) {
        document.documentElement.setAttribute("data-theme", themeId);
      }
    } catch (e) {
      // ignore
    }

    // Persist selection (best-effort)
    try {
      writeTheme(themeId);
    } catch (e) {}
  }, [themeId]);

  const toggleTheme = () => {
    setThemeId((prev) => {
      const idx = THEME_ORDER.indexOf(prev);
      if (idx === -1) return DEFAULT_THEME;
      return THEME_ORDER[(idx + 1) % THEME_ORDER.length];
    });
  };

  const value = useMemo(
    () => ({ themeId, setThemeId, setTheme: setThemeId, toggleTheme, theme: THEMES[themeId], availableThemes: getAvailableThemes() }),
    [themeId]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside a ThemeProvider");
  return ctx;
}
