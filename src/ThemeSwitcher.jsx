import { THEME_ORDER, THEMES, useTheme } from "./theme";

/**
 * A row of little three-color "chips" — one per theme — with a sliding
 * pill behind whichever is active. Each chip previews its own gradient,
 * so picking a theme is a one-glance, one-tap decision instead of a
 * dropdown full of names.
 */
export default function ThemeSwitcher({ compact = false }) {
  const { themeId, setThemeId, theme } = useTheme();
  const activeIndex = THEME_ORDER.indexOf(themeId);

  return (
    <div className={`ts-wrap ${compact ? "ts-compact" : ""}`}>
      {!compact && <span className="ts-label">Mtindo</span>}
      <div className="ts-dial" role="radiogroup" aria-label="Chagua mtindo wa ukurasa">
        <span
          className="ts-active-pill"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />
        {THEME_ORDER.map((id) => {
          const t = THEMES[id];
          const isActive = id === themeId;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={t.label}
              title={t.label}
              className={`ts-chip ${isActive ? "ts-chip-active" : ""}`}
              onClick={() => setThemeId(id)}
            >
              <span
                className="ts-swatch"
                style={{
                  background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]}, ${t.swatch[2]})`,
                }}
              />
              {!compact && <span className="ts-chip-label">{t.label}</span>}
            </button>
          );
        })}
      </div>

      <style>{`
        .ts-wrap { display: inline-flex; align-items: center; gap: 10px; }
        .ts-label { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: ${theme.textMuted}; }

        .ts-dial { position: relative; display: inline-flex; padding: 4px; border-radius: 999px; background: ${theme.surface}; border: 1px solid ${theme.border}; }
        .ts-active-pill { position: absolute; top: 4px; left: 4px; bottom: 4px; width: ${compact ? "30px" : "84px"}; border-radius: 999px; background: ${theme.surfaceStrong}; border: 1px solid ${theme.borderStrong}; transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1); }

        .ts-chip { position: relative; z-index: 1; display: flex; align-items: center; gap: 6px; padding: 5px ${compact ? "5px" : "10px"}; border-radius: 999px; background: transparent; border: none; cursor: pointer; }
        .ts-swatch { width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25); }
        .ts-chip-label { font-size: 11px; font-weight: 600; color: ${theme.textMuted}; white-space: nowrap; }
        .ts-chip-active .ts-chip-label { color: ${theme.text}; }
        .ts-chip:focus-visible { outline: 2px solid ${theme.accent}; outline-offset: 2px; border-radius: 999px; }

        @media (prefers-reduced-motion: reduce) { .ts-active-pill { transition: none; } }
      `}</style>
    </div>
  );
}
