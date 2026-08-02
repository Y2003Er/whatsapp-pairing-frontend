import { useState, useEffect, useCallback } from "react";
import {
  Users, Activity, RefreshCw, LogOut, Trash2, ChevronDown, ChevronUp,
  Key, Wifi, WifiOff, Loader2, Smartphone, Shield, User, LogIn,
} from "lucide-react";
import { BACKEND_URL } from "./config";
import { toast } from "./Toast";

const ADMIN_KEY_STORAGE = "26tech_dashboard_api_key";
const OWNER_STORAGE = "26tech_owner_session"; // { token, botId, phoneNumber }
const MODE_STORAGE = "26tech_dashboard_mode"; // 'admin' | 'owner'

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

/* ── API helper — auth is either {kind:'admin', key} or {kind:'owner', token} ── */
async function apiCall(path, { method = "GET", auth, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth?.kind === "admin" && auth.key) headers["x-api-key"] = auth.key;
  if (auth?.kind === "owner" && auth.token) headers["Authorization"] = `Bearer ${auth.token}`;

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

/* ── MODE PICKER ── */
function ModePicker({ onPick }) {
  return (
    <div className="dash-modepicker fade-up">
      <button className="dash-mode-card" onClick={() => onPick("admin")} type="button">
        <Shield size={22} />
        <span className="dash-mode-title">Admin</span>
        <span className="dash-mode-sub">Ona na simamia bots zote</span>
      </button>
      <button className="dash-mode-card" onClick={() => onPick("owner")} type="button">
        <User size={22} />
        <span className="dash-mode-title">Bot yangu</span>
        <span className="dash-mode-sub">Namba + password — settings zako pekee</span>
      </button>
    </div>
  );
}

/* ── OWNER LOGIN (Bot Settings Authentication) ── */
function OwnerLogin({ onLoggedIn }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim() || !password.trim()) {
      toast("Weka namba ya simu na password");
      return;
    }
    setBusy(true);
    try {
      const data = await apiCall("/bots/login", {
        method: "POST",
        body: { phoneNumber: phoneNumber.trim(), password: password.trim() },
      });
      onLoggedIn({ token: data.token, botId: data.botId, phoneNumber: data.phoneNumber });
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="auth-card fade-up" onSubmit={submit}>
      <div className="auth-icon"><Key size={22} /></div>
      <h2 className="auth-title">Bot Settings Authentication</h2>
      <p className="auth-sub">
        Enter your connected WhatsApp number and 8-character BOT_PASSWORD sent to your WhatsApp inbox upon pairing.
      </p>

      <label className="auth-label">WhatsApp Number</label>
      <input
        className="auth-input"
        type="tel"
        placeholder="e.g. 94771234567"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />

      <label className="auth-label">Settings Password</label>
      <input
        className="auth-input"
        type="password"
        placeholder="8-character Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="auth-submit" disabled={busy} type="submit">
        {busy ? <Loader2 size={15} className="spin-icon" /> : <LogIn size={15} />}
        Access Control Panel
      </button>
    </form>
  );
}

/* ── API KEY BAR (admin) ── */
function ApiKeyBar({ apiKey, onSave, onLogout }) {
  const [value, setValue] = useState(apiKey);
  const [visible, setVisible] = useState(false);

  return (
    <div className="dash-apikey-bar">
      <Key size={14} style={{ color: "#f0abfc", flexShrink: 0 }} />
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Dashboard API key (DASHBOARD_API_KEY)"
        className="dash-apikey-input"
      />
      <button className="dash-mini-btn" onClick={() => setVisible((v) => !v)} type="button">
        {visible ? "Ficha" : "Onyesha"}
      </button>
      <button
        className="dash-mini-btn dash-mini-btn-accent"
        type="button"
        onClick={() => {
          onSave(value.trim());
          toast("API key imehifadhiwa", "success");
        }}
      >
        Hifadhi
      </button>
      <button className="dash-mini-btn" type="button" onClick={onLogout}>Toka</button>
    </div>
  );
}

/* ── SETTINGS TOGGLES ── */
function SettingsPanel({ bot, auth, onChanged }) {
  const [settings, setSettings] = useState(bot.settings || null);
  const [loading, setLoading] = useState(!bot.settings);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (bot.settings) return;
    let cancelled = false;
    setLoading(true);
    apiCall(`/bots/${encodeURIComponent(bot.id)}`, { auth })
      .then((data) => { if (!cancelled) setSettings(data.instance?.settings || {}); })
      .catch((err) => { if (!cancelled) toast(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [bot.id, bot.settings, auth]);

  const toggle = async (key) => {
    const next = !settings[key];
    setSaving(key);
    try {
      await apiCall(`/bots/${encodeURIComponent(bot.id)}/settings`, {
        method: "PATCH",
        auth,
        body: { [key]: next },
      });
      setSettings((s) => ({ ...s, [key]: next }));
      toast(`${key} imebadilishwa — bot inarestart ili ianze kutumika...`, "success");
      onChanged?.();
    } catch (err) {
      toast(err.message);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="dash-settings-loading"><Loader2 size={14} className="spin-icon" /> Inapakia settings...</div>;
  }
  if (!settings) return null;

  const flags = Object.entries(settings).filter(([, v]) => typeof v === "boolean");

  return (
    <div className="dash-settings-grid">
      {flags.map(([key, val]) => (
        <label key={key} className="dash-flag" style={{ opacity: saving === key ? 0.5 : 1 }}>
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
function BotCard({ bot, auth, onRefresh, canDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(null);
  const st = statusStyleFor(bot.status);

  const run = async (action, path, method, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(action);
    try {
      await apiCall(path, { method, auth });
      toast(`${bot.phoneNumber}: ${action} imefanikiwa`, "success");
      onRefresh();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="dash-bot-card">
      <div className="dash-bot-row">
        <div className="dash-bot-id">
          <Smartphone size={15} style={{ color: "#7dd3fc", flexShrink: 0 }} />
          <span className="font-mono">+{bot.phoneNumber}</span>
        </div>
        <span className="dash-status-pill" style={{ color: st.color, background: st.bg }}>
          {bot.status === "online" ? <Wifi size={11} /> : <WifiOff size={11} />}
          {st.label}
        </span>
      </div>

      <div className="dash-bot-meta">
        <span>Uptime: {formatUptime(bot.uptimeMs)}</span>
        {bot.stats?.messagesProcessed != null && <span>Messages: {bot.stats.messagesProcessed}</span>}
      </div>

      <div className="dash-bot-actions">
        <button className="dash-mini-btn" disabled={busy} onClick={() => run("restart", `/bots/${bot.id}/restart`, "POST")}>
          {busy === "restart" ? <Loader2 size={13} className="spin-icon" /> : <RefreshCw size={13} />} Restart
        </button>
        <button className="dash-mini-btn" disabled={busy} onClick={() => run("logout", `/bots/${bot.id}/logout`, "POST", `Toa ${bot.phoneNumber} kwenye WhatsApp? Itahitaji ku-pair upya.`)}>
          {busy === "logout" ? <Loader2 size={13} className="spin-icon" /> : <LogOut size={13} />} Logout
        </button>
        {canDelete && (
          <button className="dash-mini-btn dash-mini-btn-danger" disabled={busy} onClick={() => run("delete", `/bots/${bot.id}`, "DELETE", `Futa bot ya ${bot.phoneNumber} kabisa? Hii itafuta pia session yake ya WhatsApp — itahitaji ku-pair upya kutoka mwanzo.`)}>
            {busy === "delete" ? <Loader2 size={13} className="spin-icon" /> : <Trash2 size={13} />} Delete
          </button>
        )}
        <button className="dash-mini-btn" style={{ marginLeft: "auto" }} onClick={() => setExpanded((e) => !e)}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Settings
        </button>
      </div>

      {expanded && <SettingsPanel bot={bot} auth={auth} onChanged={onRefresh} />}
    </div>
  );
}

/* ── ADMIN VIEW ── */
function AdminView({ apiKey, onSaveKey, onLogout }) {
  const auth = apiKey ? { kind: "admin", key: apiKey } : null;
  const [stats, setStats] = useState(null);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!apiKey) { setLoading(false); return; }
    try {
      const data = await apiCall("/bots", { auth: { kind: "admin", key: apiKey } });
      setStats(data.stats);
      setBots(data.instances || []);
    } catch (err) {
      toast(err.message);
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
    <div className="dash-wrap fade-up">
      <ApiKeyBar apiKey={apiKey} onSave={onSaveKey} onLogout={onLogout} />

      {stats && (
        <div className="dash-stats-row">
          <div className="dash-stat-chip"><Users size={13} style={{ color: "#f472b6" }} /> Total: {stats.total}</div>
          <div className="dash-stat-chip"><Activity size={13} style={{ color: "#34d399" }} /> Online: {stats.online}</div>
          <div className="dash-stat-chip"><Activity size={13} style={{ color: "#fbbf24" }} /> Connecting: {stats.connecting}</div>
          <div className="dash-stat-chip"><Activity size={13} style={{ color: "#94a3b8" }} /> Offline: {stats.offline}</div>
          <div className="dash-stat-chip"><Activity size={13} style={{ color: "#fb7185" }} /> Logged out: {stats.loggedOut}</div>
        </div>
      )}

      {loading && <p className="dash-empty">Inapakia bots...</p>}
      {!loading && bots.length === 0 && <p className="dash-empty">Hakuna hosted bots bado — pair namba ya kwanza.</p>}

      <div className="dash-bot-list">
        {bots.map((bot) => (
          <BotCard key={bot.id} bot={bot} auth={auth} onRefresh={load} canDelete />
        ))}
      </div>
    </div>
  );
}

/* ── OWNER VIEW (single bot) ── */
function OwnerView({ session, onLogout }) {
  const auth = { kind: "owner", token: session.token };
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiCall(`/bots/${encodeURIComponent(session.botId)}`, { auth });
      setBot(data.instance);
    } catch (err) {
      toast(err.message);
      if (String(err.message).toLowerCase().includes("ruhusa")) onLogout();
    } finally {
      setLoading(false);
    }
  }, [session.botId, session.token]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="dash-wrap fade-up">
      <div className="dash-owner-bar">
        <User size={14} style={{ color: "#7dd3fc" }} />
        <span className="font-mono">+{session.phoneNumber}</span>
        <button className="dash-mini-btn" style={{ marginLeft: "auto" }} onClick={onLogout}>Toka</button>
      </div>

      {loading && <p className="dash-empty">Inapakia bot yako...</p>}
      {!loading && bot && (
        <div className="dash-bot-list">
          <BotCard bot={bot} auth={auth} onRefresh={load} canDelete={false} />
        </div>
      )}
    </div>
  );
}

/* ── MAIN DASHBOARD ── */
export default function Dashboard() {
  const [mode, setMode] = useState(() => localStorage.getItem(MODE_STORAGE) || null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(ADMIN_KEY_STORAGE) || "");
  const [ownerSession, setOwnerSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem(OWNER_STORAGE) || "null"); } catch { return null; }
  });

  const pickMode = (m) => {
    setMode(m);
    localStorage.setItem(MODE_STORAGE, m);
  };

  const backToPicker = () => {
    setMode(null);
    localStorage.removeItem(MODE_STORAGE);
  };

  const saveKey = (val) => {
    setApiKey(val);
    localStorage.setItem(ADMIN_KEY_STORAGE, val);
  };

  const ownerLogin = (session) => {
    setOwnerSession(session);
    localStorage.setItem(OWNER_STORAGE, JSON.stringify(session));
  };

  const ownerLogout = () => {
    setOwnerSession(null);
    localStorage.removeItem(OWNER_STORAGE);
    backToPicker();
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
      <div className="dash-header fade-up">
        <h1 className="dash-title">Bot &amp; Group Settings</h1>
        <p className="dash-sub">
          Manage your WhatsApp bot features, auto replies, scheduled triggers, and access control.
        </p>
      </div>

      {/*
        Admin mode (manage all hosted bots) is built and ready in AdminView/ModePicker
        below, but is intentionally not wired up yet — for now every visit to
        Settings goes straight to the single-bot owner login/panel shown in the
        screenshot. Re-enable the picker (swap this block back to `!mode && <ModePicker .../>`
        plus the mode === "admin" / mode === "owner" branches) once the admin flow
        for managing all bots is ready to ship.
      */}
      {ownerSession
        ? <OwnerView session={ownerSession} onLogout={ownerLogout} />
        : <OwnerLogin onLoggedIn={ownerLogin} />}

      <p className="mt-6 text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
        © 2026 26-TECH · Powered by AI Infrastructure
      </p>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .dash-header { width: 100%; max-width: 680px; margin: 0 auto 18px; text-align: center; }
        .dash-title { font-size: clamp(1.4rem, 5vw, 2rem); font-weight: 800; color: white; letter-spacing: -0.02em; margin-bottom: 6px; }
        .dash-sub { font-size: 0.82rem; color: rgba(255,255,255,0.55); }
        @keyframes fadeUp { 0% { opacity: 0; transform: translateY(-8px); } 100% { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .dash-wrap { width: 100%; max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

        .dash-modepicker { width: 100%; max-width: 480px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .dash-mode-card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px 14px; border-radius: 18px; background: rgba(15,10,40,0.55); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.14); color: white; cursor: pointer; transition: 0.2s ease; }
        .dash-mode-card:hover { border-color: rgba(236,72,153,0.5); background: rgba(255,255,255,0.08); }
        .dash-mode-title { font-weight: 700; font-size: 0.95rem; }
        .dash-mode-sub { font-size: 0.72rem; color: rgba(255,255,255,0.5); text-align: center; }

        .auth-card {
          width: 100%; max-width: 420px; margin: 0 auto;
          background: rgba(15,10,40,0.55); backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.14); border-radius: 22px;
          padding: 30px 26px; display: flex; flex-direction: column; align-items: center;
          box-shadow: 0 0 40px rgba(236,72,153,0.08);
        }
        .auth-icon {
          width: 48px; height: 48px; border-radius: 14px; margin-bottom: 14px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(236,72,153,0.14); border: 1px solid rgba(240,171,252,0.35);
          color: #f0abfc;
        }
        .auth-title { color: white; font-weight: 800; font-size: 1.15rem; text-align: center; margin-bottom: 8px; }
        .auth-sub { color: rgba(255,255,255,0.55); font-size: 0.8rem; text-align: center; line-height: 1.5; margin-bottom: 22px; }
        .auth-label { align-self: flex-start; color: rgba(255,255,255,0.55); font-size: 0.68rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; margin-bottom: 6px; }
        .auth-input {
          width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14);
          border-radius: 12px; padding: 12px 14px; color: white; font-size: 0.9rem;
          margin-bottom: 16px; outline: none; transition: border-color 0.15s ease;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.35); }
        .auth-input:focus { border-color: rgba(236,72,153,0.5); }
        .auth-submit {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(135deg,#ec4899,#8b5cf6); border: none;
          border-radius: 12px; padding: 13px; color: white; font-weight: 700; font-size: 0.92rem;
          cursor: pointer; margin-top: 6px; box-shadow: 0 0 24px rgba(139,92,246,0.35);
        }
        .auth-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .dash-owner-bar { display: flex; align-items: center; gap: 8px; background: rgba(15,10,40,0.55); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.14); border-radius: 16px; padding: 10px 14px; color: white; font-weight: 600; font-size: 0.85rem; }

        .dash-apikey-bar { display: flex; align-items: center; gap: 8px; background: rgba(15,10,40,0.55); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.14); border-radius: 16px; padding: 10px 14px; }
        .dash-apikey-input { flex: 1; background: transparent; border: none; outline: none; color: white; font-size: 0.82rem; font-family: 'IBM Plex Mono', monospace; min-width: 0; }
        .dash-apikey-input::placeholder { color: rgba(255,255,255,0.35); }
        .dash-mini-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 10px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.14); color: rgba(255,255,255,0.8); font-size: 0.76rem; font-weight: 600; cursor: pointer; transition: 0.2s ease; white-space: nowrap; }
        .dash-mini-btn:hover:not(:disabled) { background: rgba(255,255,255,0.13); border-color: rgba(255,255,255,0.28); }
        .dash-mini-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .dash-mini-btn-accent { background: linear-gradient(135deg,#ec4899,#8b5cf6); border-color: transparent; color: white; }
        .dash-mini-btn-danger { border-color: rgba(244,63,94,0.35); color: #fb7185; }
        .dash-mini-btn-danger:hover:not(:disabled) { background: rgba(244,63,94,0.15); }

        .dash-stats-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .dash-stat-chip { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.75); font-size: 0.76rem; font-weight: 500; }

        .dash-empty { text-align: center; color: rgba(255,255,255,0.5); font-size: 0.85rem; padding: 24px 0; }

        .dash-bot-list { display: flex; flex-direction: column; gap: 12px; }
        .dash-bot-card { background: rgba(15,10,40,0.55); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.14); border-radius: 18px; padding: 14px 16px; }
        .dash-bot-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .dash-bot-id { display: flex; align-items: center; gap: 8px; color: white; font-weight: 600; font-size: 0.88rem; }
        .dash-status-pill { display: flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.03em; }
        .dash-bot-meta { display: flex; gap: 14px; margin-top: 6px; color: rgba(255,255,255,0.45); font-size: 0.74rem; }
        .dash-bot-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .dash-settings-loading { margin-top: 10px; font-size: 0.76rem; color: rgba(255,255,255,0.5); display: flex; align-items: center; gap: 6px; }
        .dash-settings-grid { margin-top: 10px; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px 14px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); }
        .dash-flag { display: flex; align-items: center; gap: 7px; font-size: 0.76rem; color: rgba(255,255,255,0.7); cursor: pointer; }
        .dash-flag input { accent-color: #ec4899; }
        .spin-icon { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
