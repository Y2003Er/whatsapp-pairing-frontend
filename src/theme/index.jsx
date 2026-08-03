import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { THEMES, THEME_ORDER, registerTheme, getAvailableThemes } from "./registry";
import { readTheme, writeTheme } from "./storage";

// Default theme id (kept in sync with registry defaults)
const DEFAULT_THEME = "midnightBlack";

export { THEMES, THEME_ORDER, registerTheme, getAvailableThemes };

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_THEME;
    const saved = readTheme();
    return saved && THEMES[saved] ? saved : DEFAULT_THEME;
  });
  const [previewThemeId, setPreviewThemeId] = useState(null);

  // Apply theme to document and persist changes.
  useEffect(() => {
    try {
      const appliedThemeId = previewThemeId || themeId;
      if (typeof document !== "undefined" && appliedThemeId) {
        document.documentElement.setAttribute("data-theme", appliedThemeId);
      }
    } catch (e) {
      // ignore
    }

    // Persist selection (best-effort)
    if (!previewThemeId) writeTheme(themeId);
  }, [themeId, previewThemeId]);

  const toggleTheme = () => {
    setThemeId((prev) => {
      const idx = THEME_ORDER.indexOf(prev);
      if (idx === -1) return DEFAULT_THEME;
      return THEME_ORDER[(idx + 1) % THEME_ORDER.length];
    });
  };

  const value = useMemo(
    () => ({ themeId, setThemeId, setTheme: setThemeId, previewThemeId, setPreviewThemeId, toggleTheme, theme: THEMES[previewThemeId || themeId], availableThemes: getAvailableThemes() }),
    [themeId, previewThemeId]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside a ThemeProvider");
  return ctx;
}
