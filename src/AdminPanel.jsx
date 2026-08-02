import { useState, useEffect, useCallback } from "react";
import {
  Users, Activity, RefreshCw, LogOut, Trash2, ChevronDown, ChevronUp,
  Key, Wifi, WifiOff, Loader2, Smartphone, ShieldCheck,
} from "lucide-react";
import { BACKEND_URL } from "./config";
import { toast, ToastContainer } from "./Toast";

const ADMIN_KEY_STORAGE = "26tech_admin_api_key";

const STATUS_STYLE = {
  online:     { color: "#34d399", bg: "rgba(16,185,129,0.15)", label: "Online" },
  connecting: { color: "#fbbf24", bg: "rgba(245,158,11,0.15)", label: "Connecting" },
  offline:    { color: "#94a3b8", bg: "rgba(148,163,184,0.15)", label: "Offline" },
  logged_out: { color: "#fb7185", bg: "rgba(244,63,94,0.15)", label: "Logged out" },
};

function statusStyleFor(status) {
  return STATUS_STYLE[String(status || "").toLowerCase()] || STATUS_STYLE.offline;
}

function formatUptime(ms) {
  if (!ms || ms <= 0) return "—";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

async function apiCall(path, { method = "GET", apiKey, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;

  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

/* ── API KEY GATE ── */
function ApiKeyGate({ onUnlock }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!value.trim()) {
      toast("Weka DASHBOARD_API_KEY");
      return;
    }
    setBusy(true);
    try {
      // Just verify the key works by hitting /bots — throws if unauthorized
      await apiCall("/bots", { apiKey: value.trim() });
      localStorage.setItem(ADMIN_KEY_STORAGE, value.trim());
      onUnlock(value.trim());
    } catch (err) {
      toast(err.message || "API key si sahihi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="admin-auth-card fade-up" onSubmit={submit}>
      <div className="admin-auth-icon"><ShieldCheck size={22} /></div>
      <h2 className="admin-auth-title">Developer Admin Access</h2>
      <p className="admin-auth-sub">
        Weka DASHBOARD_API_KEY ili kusimamia bots zote zilizohostiwa.
      </p>
      <label className="admin-auth-label">API Key</label>
      <input
        className="admin-auth-input"
        type="password"
        placeholder="DASHBOARD_API_KEY"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
      />
      <button className="admin-auth-submit" disabled={busy} type="submit">
        {busy ? <Loader2 size={15} className="spin-icon" /> : <Key size={15} />}
        Fungua Admin Panel
      </button>
    </form>
  );
}

/* ── SETTINGS TOGGLES ── */
function SettingsPanel({ bot, apiKey, onChanged }) {
  const [settings, setSettings] = useState(bot.settings || null);
  const [loading, setLoading] = useState(!bot.settings);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (bot.settings) return;
    let cancelled = false;
    setLoading(true);
    apiCall(`/bots/${encodeURIComponent(bot.id)}`, { apiKey })
      .then((data) => { if (!cancelled) setSettings(data.instance?.settings || {}); })
      .catch((err) => { if (!cancelled) toast(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [bot.id, bot.settings, apiKey]);

  const toggle = async (key) => {
    const next = !settings[key];
    setSaving(key);
    try {
      await apiCall(`/bots/${encodeURIComponent(bot.id)}/settings`, {
        method: "PATCH",
        apiKey,
        body: { [key]: next },
      });
      setSettings((s) => ({ ...s, [key]: next }));
      toast(`${key} imebadilishwa`, "success");
      onChanged?.();
    } catch (err) {
      toast(err.message);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="admin-settings-loading"><Loader2 size={14} className="spin-icon" /> Inapakia settings...</div>;
  }
  if (!settings) return null;

  const flags = Object.entries(settings).filter(([, v]) => typeof v === "boolean");

  return (
    <div className="admin-settings-grid">
      {flags.map(([key, val]) => (
        <label key={key} className="admin-flag" style={{ opacity: saving === key ? 0.5 : 1 }}>
          <input
            type="checkbox"
            checked={!!val}
            disabled={saving === key}
            onChange={() => toggle(key)}
          />
          <span>{key}</span>
        </label>
      ))}
    </div>
  );
}

/* ── ONE BOT CARD ── */
function BotCard({ bot, apiKey, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(null);
  const st = statusStyleFor(bot.status);

  const run = async (action, path, method, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(action);
    try {
      await apiCall(path, { method, apiKey });
      toast(`${bot.phoneNumber}: ${action} imefanikiwa`, "success");
      onRefresh();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="admin-bot-card">
      <div className="admin-bot-row">
        <div className="admin-bot-id">
          <Smartphone size={15} style={{ color: "#f0abfc", flexShrink: 0 }} />
          <span className="font-mono">+{bot.phoneNumber}</span>
        </div>
        <span className="admin-status-pill" style={{ color: st.color, background: st.bg }}>
          {bot.status === "online" ? <Wifi size={11} /> : <WifiOff size={11} />}
          {st.label}
        </span>
      </div>

      <div className="admin-bot-meta">
        <span>Uptime: {formatUptime(bot.uptimeMs)}</span>
        {bot.stats?.messagesProcessed != null && <span>Messages: {bot.stats.messagesProcessed}</span>}
      </div>

      <div className="admin-bot-actions">
        <button className="admin-mini-btn" disabled={busy} onClick={() => run("restart", `/bots/${bot.id}/restart`, "POST")}>
          {busy === "restart" ? <Loader2 size={13} className="spin-icon" /> : <RefreshCw size={13} />} Restart
        </button>
        <button className="admin-mini-btn" disabled={busy} onClick={() => run("logout", `/bots/${bot.id}/logout`, "POST", `Toa ${bot.phoneNumber} kwenye WhatsApp? Itahitaji ku-pair upya.`)}>
          {busy === "logout" ? <Loader2 size={13} className="spin-icon" /> : <LogOut size={13} />} Logout
        </button>
        <button className="admin-mini-btn admin-mini-btn-danger" disabled={busy} onClick={() => run("delete", `/bots/${bot.id}`, "DELETE", `Futa bot ya ${bot.phoneNumber} kabisa? Hii itafuta pia session yake ya WhatsApp — itahitaji ku-pair upya kutoka mwanzo.`)}>
          {busy === "delete" ? <Loader2 size={13} className="spin-icon" /> : <Trash2 size={13} />} Delete
        </button>
        <button className="admin-mini-btn" style={{ marginLeft: "auto" }} onClick={() => setExpanded((e) => !e)}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Settings
        </button>
      </div>

      {expanded && <SettingsPanel bot={bot} apiKey={apiKey} onChanged={onRefresh} />}
    </div>
  );
}

/* ── ADMIN BODY (bots list + stats) ── */
function AdminBody({ apiKey, onLogout }) {
  const [stats, setStats] = useState(null);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiCall("/bots", { apiKey });
      setStats(data.stats);
      setBots(data.instances || []);
    } catch (err) {
      toast(err.message);
      if (String(err.message).toLowerCase().includes("ruhusa") || String(err.message).toLowerCase().includes("unauthor")) {
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="admin-wrap fade-up">
      <div className="admin-topbar">
        <span className="admin-topbar-badge"><ShieldCheck size={14} /> Developer Mode</span>
        <button className="admin-mini-btn" onClick={onLogout}>Toka</button>
      </div>

      {stats && (
        <div className="admin-stats-row">
          <div className="admin-stat-chip"><Users size={13} style={{ color: "#f472b6" }} /> Total: {stats.total}</div>
          <div className="admin-stat-chip"><Activity size={13} style={{ color: "#34d399" }} /> Online: {stats.online}</div>
          <div className="admin-stat-chip"><Activity size={13} style={{ color: "#fbbf24" }} /> Connecting: {stats.connecting}</div>
          <div className="admin-stat-chip"><Activity size={13} style={{ color: "#94a3b8" }} /> Offline: {stats.offline}</div>
          <div className="admin-stat-chip"><Activity size={13} style={{ color: "#fb7185" }} /> Logged out: {stats.loggedOut}</div>
        </div>
      )}

      {loading && <p className="admin-empty">Inapakia bots...</p>}
      {!loading && bots.length === 0 && <p className="admin-empty">Hakuna hosted bots bado.</p>}

      <div className="admin-bot-list">
        {bots.map((bot) => (
          <BotCard key={bot.id} bot={bot} apiKey={apiKey} onRefresh={load} />
        ))}
      </div>
    </div>
  );
}

/* ── ADMIN PANEL (top-level — only mounted for the /admin path) ── */
export default function AdminPanel() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(ADMIN_KEY_STORAGE) || "");

  const logout = () => {
    setApiKey("");
    localStorage.removeItem(ADMIN_KEY_STORAGE);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: `
          radial-gradient(ellipse at 20% 50%, rgba(236,72,153,0.35) 0%, transparent 55%),
          radial-gradient(ellipse at 80% 30%, rgba(99,102,241,0.35) 0%, transparent 55%),
          radial-gradient(ellipse at 50% 80%, rgba(6,182,212,0.25) 0%, transparent 50%),
          linear-gradient(135deg, #0f0c29 0%, #1a103d 40%, #0d1b3e 100%)
        `,
        fontFamily: "'Inter', sans-serif",
      }}
      className="flex flex-col items-center px-4 pt-10 pb-10"
    >
      <ToastContainer />

      <div className="admin-header fade-up">
        <h1 className="admin-title">Fleet Control</h1>
        <p className="admin-sub">Developer-only — simamia bots zote zilizohostiwa.</p>
      </div>

      {apiKey
        ? <AdminBody apiKey={apiKey} onLogout={logout} />
        : <ApiKeyGate onUnlock={setApiKey} />}

      <p className="mt-6 text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
        © 2026 26-TECH · Powered by AI Infrastructure
      </p>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .admin-header { width: 100%; max-width: 680px; margin: 0 auto 18px; text-align: center; }
        .admin-title { font-size: clamp(1.4rem, 5vw, 2rem); font-weight: 800; color: white; letter-spacing: -0.02em; margin-bottom: 6px; }
        .admin-sub { font-size: 0.82rem; color: rgba(255,255,255,0.55); }
        @keyframes fadeUp { 0% { opacity: 0; transform: translateY(-8px); } 100% { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .admin-wrap { width: 100%; max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

        .admin-auth-card {
          width: 100%; max-width: 420px; margin: 0 auto;
          background: rgba(15,10,40,0.55); backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.14); border-radius: 22px;
          padding: 30px 26px; display: flex; flex-direction: column; align-items: center;
          box-shadow: 0 0 40px rgba(236,72,153,0.08);
        }
        .admin-auth-icon {
          width: 48px; height: 48px; border-radius: 14px; margin-bottom: 14px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(236,72,153,0.14); border: 1px solid rgba(240,171,252,0.35);
          color: #f0abfc;
        }
        .admin-auth-title { color: white; font-weight: 800; font-size: 1.15rem; text-align: center; margin-bottom: 8px; }
        .admin-auth-sub { color: rgba(255,255,255,0.55); font-size: 0.8rem; text-align: center; line-height: 1.5; margin-bottom: 22px; }
        .admin-auth-label { align-self: flex-start; color: rgba(255,255,255,0.55); font-size: 0.68rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; margin-bottom: 6px; }
        .admin-auth-input {
          width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14);
          border-radius: 12px; padding: 12px 14px; color: white; font-size: 0.9rem;
          margin-bottom: 16px; outline: none; transition: border-color 0.15s ease;
          font-family: 'IBM Plex Mono', monospace;
        }
        .admin-auth-input::placeholder { color: rgba(255,255,255,0.35); }
        .admin-auth-input:focus { border-color: rgba(236,72,153,0.5); }
        .admin-auth-submit {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(135deg,#ec4899,#8b5cf6); border: none;
          border-radius: 12px; padding: 13px; color: white; font-weight: 700; font-size: 0.92rem;
          cursor: pointer; margin-top: 6px; box-shadow: 0 0 24px rgba(139,92,246,0.35);
        }
        .admin-auth-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .admin-topbar { display: flex; align-items: center; gap: 8px; background: rgba(15,10,40,0.55); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.14); border-radius: 16px; padding: 10px 14px; }
        .admin-topbar-badge { display: flex; align-items: center; gap: 6px; color: #f0abfc; font-weight: 700; font-size: 0.8rem; }

        .admin-mini-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 10px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.14); color: rgba(255,255,255,0.8); font-size: 0.76rem; font-weight: 600; cursor: pointer; transition: 0.2s ease; white-space: nowrap; margin-left: auto; }
        .admin-mini-btn:hover:not(:disabled) { background: rgba(255,255,255,0.13); border-color: rgba(255,255,255,0.28); }
        .admin-mini-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .admin-mini-btn-danger { border-color: rgba(244,63,94,0.35); color: #fb7185; }
        .admin-mini-btn-danger:hover:not(:disabled) { background: rgba(244,63,94,0.15); }

        .admin-stats-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .admin-stat-chip { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.75); font-size: 0.76rem; font-weight: 500; }

        .admin-empty { text-align: center; color: rgba(255,255,255,0.5); font-size: 0.85rem; padding: 24px 0; }

        .admin-bot-list { display: flex; flex-direction: column; gap: 12px; }
        .admin-bot-card { background: rgba(15,10,40,0.55); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.14); border-radius: 18px; padding: 14px 16px; }
        .admin-bot-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .admin-bot-id { display: flex; align-items: center; gap: 8px; color: white; font-weight: 600; font-size: 0.88rem; }
        .admin-status-pill { display: flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.03em; }
        .admin-bot-meta { display: flex; gap: 14px; margin-top: 6px; color: rgba(255,255,255,0.45); font-size: 0.74rem; }
        .admin-bot-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .admin-settings-loading { margin-top: 10px; font-size: 0.76rem; color: rgba(255,255,255,0.5); display: flex; align-items: center; gap: 6px; }
        .admin-settings-grid { margin-top: 10px; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px 14px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); }
        .admin-flag { display: flex; align-items: center; gap: 7px; font-size: 0.76rem; color: rgba(255,255,255,0.7); cursor: pointer; }
        .admin-flag input { accent-color: #ec4899; }
        .spin-icon { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
