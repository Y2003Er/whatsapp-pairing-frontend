import { useState, useEffect } from "react";
import {
  Menu, X, Home, Smartphone, Settings, Zap, Coins, ShieldCheck, Mail,
  User, Wifi, WifiOff,
} from "lucide-react";
import { BACKEND_URL } from "./config";

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
  const online = useOnlineStatus();

  const go = (key) => {
    setView(key);
    setOpen(false);
  };

  return (
    <>
      {/* ── TOP BAR ── */}
      <header className="topbar">
        <button className="topbar-icon-btn" onClick={() => setOpen(true)} type="button" aria-label="Fungua menu">
          <Menu size={20} />
        </button>

        <div className="topbar-brand" onClick={() => go("home")}>
          <div className="topbar-avatar">🤖</div>
          <div className="topbar-brand-text">
            <span className="topbar-name">26-TECH <span className="topbar-version">BOT</span></span>
          </div>
        </div>

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
        <div className="drawer-overlay" onClick={() => setOpen(false)}>
          <aside className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-avatar">🤖</div>
              <button className="drawer-close" onClick={() => setOpen(false)} type="button" aria-label="Funga menu">
                <X size={18} />
              </button>
            </div>
            <p className="drawer-studio">26-TECH SOLUTION</p>
            <h2 className="drawer-title">26-TECH BOT</h2>

            <nav className="drawer-nav">
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

      <style>{`
        .topbar {
          position: sticky; top: 0; z-index: 900;
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px;
          background: rgba(10,8,28,0.85);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .topbar-icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
          color: white; cursor: pointer; flex-shrink: 0;
        }
        .topbar-icon-btn:hover { background: rgba(255,255,255,0.12); }
        .topbar-brand { display: flex; align-items: center; gap: 8px; cursor: pointer; min-width: 0; }
        .topbar-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg,#ec4899,#8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
        .topbar-name { color: white; font-weight: 800; font-size: 0.92rem; font-family: 'Inter', sans-serif; white-space: nowrap; }
        .topbar-version { background: linear-gradient(135deg,#38bdf8,#8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .topbar-right { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .topbar-status {
          display: flex; align-items: center; gap: 5px;
          font-size: 0.66rem; font-weight: 700; letter-spacing: 0.04em;
          padding: 5px 9px; border-radius: 999px;
          font-family: 'IBM Plex Mono', monospace;
        }
        .topbar-status.is-online { color: #34d399; background: rgba(16,185,129,0.12); }
        .topbar-status.is-offline { color: #fb7185; background: rgba(244,63,94,0.12); }
        .topbar-status.is-checking { color: #fbbf24; background: rgba(245,158,11,0.12); }
        .topbar-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; box-shadow: 0 0 6px currentColor; }
        .topbar-signin {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 12px; border-radius: 10px; border: none; cursor: pointer;
          background: linear-gradient(135deg,#ec4899,#8b5cf6); color: white;
          font-size: 0.76rem; font-weight: 700;
        }

        .drawer-overlay {
          position: fixed; inset: 0; z-index: 950;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(2px);
          animation: overlayIn 0.2s ease;
        }
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        .drawer {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: min(280px, 82vw);
          background: linear-gradient(165deg, #140c33 0%, #0d1b3e 100%);
          border-right: 1px solid rgba(255,255,255,0.12);
          padding: 18px 16px;
          display: flex; flex-direction: column;
          animation: drawerIn 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes drawerIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .drawer-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .drawer-avatar { width: 46px; height: 46px; border-radius: 50%; background: linear-gradient(135deg,#ec4899,#8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 22px; }
        .drawer-close { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .drawer-studio { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.14em; color: rgba(255,255,255,0.4); margin-bottom: 2px; }
        .drawer-title { color: white; font-weight: 800; font-size: 1.15rem; margin-bottom: 20px; }
        .drawer-nav { display: flex; flex-direction: column; gap: 3px; flex: 1; }
        .drawer-item {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 12px; border-radius: 10px; border: none;
          background: transparent; color: rgba(255,255,255,0.75);
          font-size: 0.87rem; font-weight: 600; text-align: left; cursor: pointer;
          transition: 0.15s ease;
        }
        .drawer-item:hover { background: rgba(255,255,255,0.06); color: white; }
        .drawer-item.active { background: rgba(236,72,153,0.14); color: #f0abfc; }
        .drawer-footer { padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: 8px; }
        .drawer-footer p { font-size: 0.68rem; color: rgba(255,255,255,0.35); text-align: center; }
        .drawer-footer .topbar-status { align-self: center; }
      `}</style>
    </>
  );
}
