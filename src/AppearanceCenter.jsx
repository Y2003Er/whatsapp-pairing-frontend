import { useEffect, useRef } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { THEME_ORDER, THEMES, useTheme } from "./theme";

export default function AppearanceCenter({ onClose }) {
  const { themeId, setThemeId } = useTheme();
  const dialogRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const items = [...dialogRef.current.querySelectorAll("button:not([disabled])")];
      const first = items[0]; const last = items.at(-1);
      if (!first) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="appearance-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="appearance-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="appearance-title">
        <header className="appearance-header">
          <div><span className="appearance-kicker"><Sparkles size={13} /> Appearance</span><h2 id="appearance-title">Choose your workspace theme</h2><p>Two considered themes, built for focus.</p></div>
          <button className="appearance-close" type="button" onClick={onClose} aria-label="Close appearance center"><X size={18} /></button>
        </header>
        <div className="appearance-content">
          <div className="appearance-group">
            <h3>Workspace themes</h3>
            <div className="theme-preview-grid theme-preview-grid--two" role="list" aria-label="Available themes">
              {THEME_ORDER.map((id) => {
                const theme = THEMES[id]; const selected = id === themeId;
                return <div key={id} role="listitem" className={`theme-preview-card ${selected ? "is-selected" : ""}`}
                  style={{ "--preview-background": theme.background, "--preview-card": theme.card, "--preview-primary": theme.primary, "--preview-accent": theme.accent, "--preview-text": theme.text, "--preview-border": theme.border }}>
                  <button type="button" className="theme-preview-apply" onClick={() => setThemeId(id)} aria-pressed={selected} aria-label={`Apply ${theme.label} theme`}>
                    <span className="theme-preview-art" aria-hidden="true"><span className="theme-preview-bar" /><span className="theme-preview-pane"><i /><i /><i /></span></span>
                    <span className="theme-preview-meta"><span><strong>{theme.label}</strong><small>{theme.description}</small></span>{selected && <span className="theme-current"><Check size={12} /> Current</span>}</span>
                  </button>
                </div>;
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
