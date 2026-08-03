import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Heart, Search, Sparkles, X } from "lucide-react";
import { THEME_ORDER, THEMES, useTheme } from "./theme";
import { addRecentTheme, readRecentThemes, readThemeFavorites, writeThemeFavorites } from "./theme/storage";

const CATEGORY = {
  midnightBlack: "Dark", amoledBlack: "Dark", oceanBlue: "Dark", emeraldGreen: "Dark",
  royalPurple: "Dark", crimsonRed: "Dark", sunsetOrange: "Dark", arcticWhite: "Light",
  cyberNeon: "Special", glassmorphism: "Special",
};

export default function AppearanceCenter({ onClose }) {
  const { themeId, setThemeId, setPreviewThemeId } = useTheme();
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState(readThemeFavorites);
  const [recents, setRecents] = useState(readRecentThemes);
  const dialogRef = useRef(null);
  const cardRefs = useRef([]);

  const themes = useMemo(() => THEME_ORDER.map((id) => THEMES[id]).filter((theme) => theme.label.toLowerCase().includes(query.trim().toLowerCase())), [query]);
  const groups = useMemo(() => ["Recent", "Favorites", "Dark", "Light", "Special"].map((name) => ({
    name,
    themes: name === "Recent" ? recents.map((id) => THEMES[id]).filter(Boolean).filter((theme) => themes.includes(theme)) : name === "Favorites" ? favorites.map((id) => THEMES[id]).filter(Boolean).filter((theme) => themes.includes(theme)) : themes.filter((theme) => CATEGORY[theme.id] === name),
  })).filter((group) => group.themes.length), [themes, favorites, recents]);

  useEffect(() => {
    const trapFocus = (event) => {
      if (event.key === "Escape") { setPreviewThemeId(null); onClose(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll('button:not([disabled]), input:not([disabled])')];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", trapFocus);
    return () => { window.removeEventListener("keydown", trapFocus); setPreviewThemeId(null); };
  }, [onClose, setPreviewThemeId]);

  const applyTheme = (id) => {
    setPreviewThemeId(null);
    setThemeId(id);
    addRecentTheme(id);
    setRecents(readRecentThemes());
  };
  const toggleFavorite = (id) => {
    const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
    setFavorites(next); writeThemeFavorites(next);
  };
  const navigateCard = (event, theme) => {
    const index = themes.findIndex((item) => item.id === theme.id);
    const target = event.key === "ArrowRight" || event.key === "ArrowDown" ? index + 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? index - 1 : null;
    if (target === null) return;
    event.preventDefault();
    cardRefs.current[(target + themes.length) % themes.length]?.focus();
  };

  return (
    <div className="appearance-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="appearance-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="appearance-title">
        <header className="appearance-header">
          <div><span className="appearance-kicker"><Sparkles size={13} /> Appearance</span><h2 id="appearance-title">Choose your workspace theme</h2><p>Preview a theme before applying it to your workspace.</p></div>
          <button className="appearance-close" type="button" onClick={onClose} aria-label="Close appearance center"><X size={18} /></button>
        </header>
        <label className="appearance-search"><Search size={16} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search themes" aria-label="Search themes" /></label>
        <div className="appearance-content">
          {groups.map((group) => <div className="appearance-group" key={group.name}>
            <h3>{group.name}</h3>
            <div className="theme-preview-grid" role="list" aria-label={`${group.name} themes`}>
              {group.themes.map((theme) => {
                const selected = theme.id === themeId;
                const favorite = favorites.includes(theme.id);
                const index = themes.findIndex((item) => item.id === theme.id);
                return <div
                  key={`${group.name}-${theme.id}`} role="listitem"
                  className={`theme-preview-card ${selected ? "is-selected" : ""}`}
                  style={{ "--preview-background": theme.background, "--preview-card": theme.card, "--preview-primary": theme.primary, "--preview-accent": theme.accent, "--preview-text": theme.text, "--preview-border": theme.border }}
                >
                  <button ref={(node) => { cardRefs.current[index] = node; }} type="button" className="theme-preview-apply"
                    onMouseEnter={() => setPreviewThemeId(theme.id)} onMouseLeave={() => setPreviewThemeId(null)}
                    onFocus={() => setPreviewThemeId(theme.id)} onBlur={() => setPreviewThemeId(null)}
                    onKeyDown={(event) => navigateCard(event, theme)} onClick={() => applyTheme(theme.id)} aria-pressed={selected} aria-label={`Apply ${theme.label} theme`}>
                  <span className="theme-preview-art" aria-hidden="true"><span className="theme-preview-bar" /><span className="theme-preview-pane"><i /><i /><i /></span></span>
                  <span className="theme-preview-meta"><span><strong>{theme.label}</strong><small>{CATEGORY[theme.id]}</small></span>{selected && <span className="theme-current"><Check size={12} /> Current</span>}</span>
                  </button>
                  <button type="button" className={`theme-favorite ${favorite ? "is-favorite" : ""}`} aria-label={`${favorite ? "Remove" : "Add"} ${theme.label} ${favorite ? "from" : "to"} favorites`} onClick={() => toggleFavorite(theme.id)}><Heart size={14} fill={favorite ? "currentColor" : "none"} /></button>
                </div>;
              })}
            </div>
          </div>)}
          {!groups.length && <div className="appearance-empty">No themes match “{query}”.</div>}
        </div>
      </section>
    </div>
  );
}
