import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Menu, X, Home, Smartphone, Settings, Zap, Coins, ShieldCheck, Mail,
  User, Wifi, WifiOff, Palette, Moon, Rows3, Gauge, Circle,
} from "lucide-react";
import { BACKEND_URL } from "./config";

const AppearanceCenter = lazy(() => import("./AppearanceCenter"));

/* ── ONLINE badge — polls the same /health every 30s ── */
function useOnlineStatus() {
  const [online, setOnline] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(6000) });
        if (!cancelled) setOnline(res.ok);
      } catch {
        if (!cancelled) setOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return online;
}

const MENU_ITEMS = [
  { key: "home", label: "Home", icon: Home },
  { key: "pair", label: "Connect Bot", icon: Smartphone },
  { key: "dashboard", label: "Settings", icon: Settings },
  { key: "autoreaction", label: "Auto Reaction", icon: Zap },
  { key: "coinshop", label: "Coin Shop", icon: Coins },
  { key: "admin", label: "Admin Team", icon: ShieldCheck },
  { key: "contact", label: "Contact Us", icon: Mail },
];

export default function AppNav({ view, setView }) {
  const [open, setOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const wasOpen = useRef(false);
  const [preferences, setPreferences] = useState(() => {
    try { return JSON.parse(localStorage.getItem("26tech-appearance-preferences")) || { dark: false, density: "comfortable", motion: "full", radius: "default" }; }
    catch { return { dark: false, density: "comfortable", motion: "full", radius: "default" }; }
  });
  const online = useOnlineStatus();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.uiDensity = preferences.density;
    root.dataset.motion = preferences.motion;
    root.dataset.darkMode = String(preferences.dark);
    root.style.setProperty("--appearance-radius", preferences.radius === "compact" ? "8px" : preferences.radius === "soft" ? "20px" : "var(--theme-radius)");
    try { localStorage.setItem("26tech-appearance-preferences", JSON.stringify(preferences)); } catch { /* best effort */ }
  }, [preferences]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    const openAppearance = () => { setOpen(false); setAppearanceOpen(true); };
    window.addEventListener("26tech:open-appearance", openAppearance);
    return () => window.removeEventListener("26tech:open-appearance", openAppearance);
  }, []);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      window.requestAnimationFrame(() => drawerRef.current?.querySelector("button, input, select")?.focus());
      return () => { document.body.style.overflow = previousOverflow; };
    }

    if (wasOpen.current) {
      menuButtonRef.current?.focus();
      wasOpen.current = false;
    }
    return undefined;
  }, [open]);

  const updatePreference = (key, value) => setPreferences((current) => ({ ...current, [key]: value }));

  const go = (key) => {
    setView(key);
    setOpen(false);
  };

  return (
    <>
      {/* ── TOP BAR ── */}
      <header className="topbar">
        <button ref={menuButtonRef} className="topbar-icon-btn" onClick={() => setOpen((current) => !current)} type="button" aria-label="Open menu" aria-expanded={open} aria-controls="primary-navigation-drawer">
          <Menu size={20} />
        </button>

        <button className="topbar-brand" onClick={() => go("home")} type="button" aria-label="Go to home">
          <div className="topbar-avatar">🤖</div>
          <div className="topbar-brand-text">
            <span className="topbar-name">26-TECH <span className="topbar-version">BOT</span></span>
          </div>
        </button>

        <div className="topbar-right">
          <span className={`topbar-status ${online ? "is-online" : online === false ? "is-offline" : "is-checking"}`}>
            <span className="topbar-status-dot" />
            {online ? "ONLINE" : online === false ? "OFFLINE" : "..."}
          </span>
          <button className="topbar-signin" onClick={() => go("dashboard")} type="button">
            <User size={13} /> Sign In
          </button>
        </div>
      </header>

      {/* ── DRAWER ── */}
      {open && (
        <div className="drawer-overlay" onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }} role="presentation">
          <aside id="primary-navigation-drawer" ref={drawerRef} className="drawer" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <div className="drawer-header">
              <div className="drawer-avatar">🤖</div>
              <button className="drawer-close" onClick={() => setOpen(false)} type="button" aria-label="Funga menu">
                <X size={18} />
              </button>
            </div>
            <p className="drawer-studio">26-TECH SOLUTION</p>
            <h2 className="drawer-title">26-TECH BOT</h2>

            <nav className="drawer-nav" aria-label="Primary navigation">
              {MENU_ITEMS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className={`drawer-item ${view === key ? "active" : ""}`}
                  onClick={() => go(key)}
                  type="button"
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <section className="appearance-menu" aria-labelledby="appearance-menu-title">
              <p id="appearance-menu-title" className="appearance-menu-label"><Palette size={13} /> Appearance</p>
              <button className="appearance-menu-item" type="button" onClick={() => { setOpen(false); setAppearanceOpen(true); }}><Palette size={15} /><span>Themes</span><span className="appearance-menu-value">Browse</span></button>
              <label className="appearance-menu-item appearance-toggle"><span><Moon size={15} /> Dark Mode</span><input type="checkbox" checked={preferences.dark} onChange={(event) => updatePreference("dark", event.target.checked)} aria-label="Dark mode" /><i /></label>
              <div className="appearance-menu-item appearance-select"><span><Rows3 size={15} /> UI Density</span><select value={preferences.density} onChange={(event) => updatePreference("density", event.target.value)} aria-label="UI density"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></div>
              <label className="appearance-menu-item appearance-toggle"><span><Gauge size={15} /> Motion</span><input type="checkbox" checked={preferences.motion === "full"} onChange={(event) => updatePreference("motion", event.target.checked ? "full" : "reduced")} aria-label="Enable interface motion" /><i /></label>
              <div className="appearance-menu-item appearance-select"><span><Circle size={15} /> Border Radius</span><select value={preferences.radius} onChange={(event) => updatePreference("radius", event.target.value)} aria-label="Border radius"><option value="compact">Compact</option><option value="default">Default</option><option value="soft">Soft</option></select></div>
            </section>

            <div className="drawer-footer">
              <span className="topbar-status">
                {online ? <Wifi size={12} /> : <WifiOff size={12} />}
                {online ? "Server Online" : "Server Offline"}
              </span>
              <p>Powered by 26-TECH · dev by 26 Tech Solution</p>
            </div>
          </aside>
        </div>
      )}
      {appearanceOpen && <Suspense fallback={null}><AppearanceCenter onClose={() => setAppearanceOpen(false)} /></Suspense>}

      <style>{`
        .topbar {
          position: sticky; top: 0; z-index: 900;
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px;
          background: var(--token-surface);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--token-border);
          color: var(--token-text);
          /* Fixes a WebKit/Safari bug where position:sticky + backdrop-filter
             stops receiving click/tap events after the page is scrolled —
             hover styles still fire, but onClick doesn't. Forcing a GPU
             compositing layer keeps the sticky element interactive. */
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          will-change: transform;
        }
        .topbar-icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--token-surface);
          border: 1px solid var(--token-border-strong);
          color: var(--token-text);
          cursor: pointer; flex-shrink: 0; position: relative; z-index: 1; pointer-events: auto;
        }
        .topbar-icon-btn:hover { background: var(--token-hover); }
        .topbar-brand { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 0; border: 0; background: transparent; color: inherit; text-align: left; }
        .topbar-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--token-avatar-gradient); display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
        .topbar-name { color: var(--token-text); font-weight: 700; font-size: 0.92rem; font-family: var(--font-display); white-space: nowrap; }
        .topbar-version { background: var(--token-version-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .topbar-right { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .topbar-status {
          display: flex; align-items: center; gap: 5px;
          font-size: 0.66rem; font-weight: 700; letter-spacing: 0.04em;
          padding: 5px 9px; border-radius: 999px;
          font-family: var(--font-mono);
        }
        .topbar-status.is-online { color: var(--token-success); background: var(--token-success-bg); }
        .topbar-status.is-offline { color: var(--token-error); background: var(--token-error-bg); }
        .topbar-status.is-checking { color: var(--token-warning); background: var(--token-warning-bg); }
        .topbar-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; box-shadow: 0 0 6px currentColor; }
        .topbar-signin {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 12px; border-radius: 10px; border: none; cursor: pointer;
          background: var(--token-signin-gradient); color: var(--token-on-accent);
          font-size: 0.76rem; font-weight: 700;
        }

        .drawer-overlay {
          position: fixed; inset: 0; z-index: 1100;
          background: var(--token-backdrop);
          backdrop-filter: blur(2px);
          animation: overlayIn 0.2s ease;
          pointer-events: auto;
        }
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        .drawer {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: min(280px, 82vw);
          background: var(--token-drawer-bg);
          border-right: 1px solid var(--token-border-strong);
          padding: 18px 16px;
          display: flex; flex-direction: column;
          animation: drawerIn 0.25s cubic-bezier(0.16,1,0.3,1);
          overflow-y: auto; overscroll-behavior: contain;
        }
        @keyframes drawerIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .drawer-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .drawer-avatar { width: 46px; height: 46px; border-radius: 50%; background: var(--token-avatar-gradient); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .drawer-close { width: 32px; height: 32px; border-radius: 8px; background: var(--token-surface); border: 1px solid var(--token-border-strong); color: var(--token-text); display: flex; align-items: center; justify-content: center; }
        .drawer-studio { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.14em; color: var(--token-muted); margin-bottom: 2px; }
        .drawer-title { color: var(--token-text); font-weight: 800; font-size: 1.15rem; margin-bottom: 20px; }
        .drawer-nav { display: flex; flex-direction: column; gap: 3px; flex: 1; }
        .drawer-item {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 12px; border-radius: 10px; border: none;
          background: transparent; color: var(--token-text-muted);
          font-size: 0.87rem; font-weight: 600; text-align: left; cursor: pointer;
          transition: 0.15s ease;
        }
        .drawer-item:hover { background: var(--token-hover); color: var(--token-text); }
        .drawer-item.active { background: var(--token-active); color: var(--token-accent); }
        .drawer-footer { padding-top: 14px; border-top: 1px solid var(--token-border); display: flex; flex-direction: column; gap: 8px; }
        .drawer-footer p { font-size: 0.68rem; color: var(--token-muted); text-align: center; }
        .appearance-menu { padding: 14px 0; border-top: 1px solid var(--token-border); display: flex; flex-direction: column; gap: 4px; }
        .appearance-menu-label { display: flex; align-items: center; gap: 7px; padding: 0 10px 6px; color: var(--token-muted); font-size: .67rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .appearance-menu-item { min-height: 38px; width: 100%; display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 0; border-radius: 9px; background: transparent; color: var(--token-text); font-size: .77rem; font-weight: 650; text-align: left; cursor: pointer; }
        .appearance-menu-item:hover { background: var(--token-hover); }
        .appearance-menu-value { margin-left: auto; color: var(--token-muted); font-size: .68rem; font-weight: 600; }
        .appearance-toggle { justify-content: space-between; }
        .appearance-toggle > span, .appearance-select > span { display: flex; align-items: center; gap: 10px; }
        .appearance-toggle input { position: absolute; opacity: 0; }
        .appearance-toggle i { width: 30px; height: 18px; border-radius: 999px; background: var(--token-surface-strong); border: 1px solid var(--token-border); position: relative; }
        .appearance-toggle i::after { content: ''; position: absolute; top: 3px; left: 3px; width: 10px; height: 10px; border-radius: 50%; background: var(--token-muted); transition: transform .2s ease; }
        .appearance-toggle input:checked + i { background: var(--token-switch); border-color: var(--token-switch); }
        .appearance-toggle input:checked + i::after { transform: translateX(12px); background: var(--token-on-accent); }
        .appearance-select { justify-content: space-between; }
        .appearance-select select { max-width: 104px; padding: 4px 20px 4px 7px; font-size: .68rem; color: var(--token-muted); background: var(--token-surface); }
      `}</style>
    </>
  );
}
