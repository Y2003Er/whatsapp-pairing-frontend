import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users, Activity, RefreshCw, LogOut, Trash2, ChevronDown, ChevronUp,
  Key, Wifi, WifiOff, Loader2, Smartphone, Shield, User, LogIn, Copy, SlidersHorizontal, List, CheckCircle2,
} from "lucide-react";
import { BACKEND_URL } from "./config";
import { toast } from "./Toast";
import OwnerSettings from "./OwnerSettings";
import { DashboardSkeleton, EmptyState } from "./UIStates";
import { useAuth } from "./auth";

const ADMIN_KEY_STORAGE = "26tech_dashboard_api_key";
const MODE_STORAGE = "26tech_dashboard_mode"; // 'admin' | 'owner'

const STATUS_STYLE = {
  online:     { color: "var(--token-success)", bg: "var(--token-success-bg)", label: "Online" },
  connecting: { color: "var(--token-warning)", bg: "var(--token-warning-bg)", label: "Connecting" },
  offline:    { color: "var(--token-muted)", bg: "var(--token-card-strong)", label: "Offline" },
  logged_out: { color: "var(--token-error)", bg: "var(--token-error-bg)", label: "Logged out" },
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
        <span className="dash-mode-sub">View and manage all bots</span>
      </button>
      <button className="dash-mode-card" onClick={() => onPick("owner")} type="button">
        <User size={22} />
        <span className="dash-mode-title">Bot yangu</span>
        <span className="dash-mode-sub">Phone number and password — your settings only</span>
      </button>
    </div>
  );
}

/* ── OWNER LOGIN (Bot Settings Authentication) ── */
function OwnerLogin({ onLoggedIn, onSignUp }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim() || !password.trim()) {
      toast("Enter your phone number and password");
      return;
    }
    setBusy(true);
    try {
      await onLoggedIn(phoneNumber, password);
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
      <button className="dash-mini-btn" style={{ marginTop: 12 }} type="button" onClick={onSignUp}>New here? Connect your bot</button>
    </form>
  );
}

/* ── API KEY BAR (admin) ── */
function ApiKeyBar({ apiKey, onSave, onLogout }) {
  const [value, setValue] = useState(apiKey);
  const [visible, setVisible] = useState(false);

  return (
    <div className="dash-apikey-bar">
      <Key size={14} style={{ color: "var(--token-info)", flexShrink: 0 }} />
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
          toast("API key saved", "success");
        }}
      >
        Save
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
      toast(`${key} changed — restarting the bot to apply it...`, "success");
      onChanged?.();
    } catch (err) {
      toast(err.message);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="dash-settings-loading"><Loader2 size={14} className="spin-icon" /> Loading settings...</div>;
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
      toast(`${bot.phoneNumber}: ${action} completed successfully`, "success");
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
          <Smartphone size={15} style={{ color: "var(--token-info)", flexShrink: 0 }} />
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
        <button className="dash-mini-btn" disabled={busy} onClick={() => run("logout", `/bots/${bot.id}/logout`, "POST", `Disconnect ${bot.phoneNumber} from WhatsApp? It will need to be paired again.`)}>
          {busy === "logout" ? <Loader2 size={13} className="spin-icon" /> : <LogOut size={13} />} Logout
        </button>
        {canDelete && (
          <button className="dash-mini-btn dash-mini-btn-danger" disabled={busy} onClick={() => run("delete", `/bots/${bot.id}`, "DELETE", `Permanently delete ${bot.phoneNumber}? Its WhatsApp session will also be removed and it will need to be paired again.`)}>
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
          <div className="dash-stat-chip"><Users size={13} style={{ color: "var(--token-info)" }} /> Total: {stats.total}</div>
          <div className="dash-stat-chip"><Activity size={13} style={{ color: "var(--token-success)" }} /> Online: {stats.online}</div>
          <div className="dash-stat-chip"><Activity size={13} style={{ color: "var(--token-warning)" }} /> Connecting: {stats.connecting}</div>
          <div className="dash-stat-chip"><Activity size={13} style={{ color: "var(--token-muted)" }} /> Offline: {stats.offline}</div>
          <div className="dash-stat-chip"><Activity size={13} style={{ color: "var(--token-error)" }} /> Logged out: {stats.loggedOut}</div>
        </div>
      )}

      {loading && <DashboardSkeleton />}
      {!loading && bots.length === 0 && <EmptyState title="No bots yet" description="Pair your first number to see it here." />}

      <div className="dash-bot-list">
        {bots.map((bot) => (
          <BotCard key={bot.id} bot={bot} auth={auth} onRefresh={load} canDelete />
        ))}
      </div>
    </div>
  );
}

/* ── OWNER VIEW (single bot) ── */
function OwnerOverview({ bot, session, onRefresh, onNavigate }) {
  const status = statusStyleFor(bot.status);
  const activeSettings = useMemo(() => Object.values(bot.settings || {}).filter((value) => value === true).length, [bot.settings]);
  const copyNumber = async () => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(`+${session.phoneNumber}`);
      toast("Device number copied", "success");
    } catch { toast("Unable to copy device number", "warning"); }
  };
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const activity = [
    { icon: status.label === "Online" ? Wifi : WifiOff, title: `Device is ${status.label.toLowerCase()}`, detail: "Current connection status", time: "Now", tone: status.label === "Online" ? "success" : "info" },
    { icon: Activity, title: "Session monitored", detail: `Uptime ${formatUptime(bot.uptimeMs)}`, time: "Current session", tone: "info" },
    ...(bot.stats?.messagesProcessed != null ? [{ icon: List, title: "Messages processed", detail: String(bot.stats.messagesProcessed), time: "Session total", tone: "info" }] : []),
    { icon: SlidersHorizontal, title: "Settings available", detail: `${activeSettings} automation controls enabled`, time: "Ready", tone: "success" },
  ];
  return <section className="enterprise-overview" aria-label="Bot overview">
    <div className="enterprise-welcome">
      <div><span className="enterprise-kicker"><CheckCircle2 size={14} /> Workspace overview</span><h2>Welcome back</h2><p>Manage your device, monitor its status, and keep your automations in control.</p></div>
      <div className="enterprise-profile"><span className="enterprise-avatar"><User size={20} /></span><span><strong>Bot owner</strong><small>+{session.phoneNumber}</small></span><span className="dash-status-pill" style={{ color: status.color, background: status.bg }}>{status.label}</span></div>
    </div>
    <div className="enterprise-metrics">
      <div className="enterprise-metric"><span>Connection</span><strong>{status.label}</strong><small>Live device status</small></div>
      <div className="enterprise-metric"><span>Session uptime</span><strong>{formatUptime(bot.uptimeMs)}</strong><small>Current connection</small></div>
      <div className="enterprise-metric"><span>Messages</span><strong>{bot.stats?.messagesProcessed ?? "—"}</strong><small>Processed this session</small></div>
      <div className="enterprise-metric"><span>Automations</span><strong>{activeSettings}</strong><small>Enabled controls</small></div>
    </div>
    <div className="enterprise-grid">
      <section className="enterprise-panel"><div className="enterprise-panel-heading"><div><span>Quick actions</span><h3>Keep moving</h3></div></div><div className="quick-actions">
        <button type="button" onClick={() => onNavigate?.("pair")}><Smartphone size={18} /><span><strong>Pair device</strong><small>Connect another number</small></span></button>
        <button type="button" onClick={onRefresh}><RefreshCw size={18} /><span><strong>Refresh</strong><small>Update device status</small></span></button>
        <button type="button" onClick={copyNumber}><Copy size={18} /><span><strong>Copy device</strong><small>Copy linked number</small></span></button>
        <button type="button" onClick={() => scrollTo("owner-settings")}><SlidersHorizontal size={18} /><span><strong>Open settings</strong><small>Manage automations</small></span></button>
      </div></section>
      <section className="enterprise-panel" id="activity"><div className="enterprise-panel-heading"><div><span>Recent activity</span><h3>Session pulse</h3></div><button type="button" className="enterprise-text-action" onClick={() => scrollTo("owner-settings")}>View settings</button></div><ol className="activity-timeline">{activity.map(({ icon: Icon, title, detail, time, tone }) => <li key={title}><span className={`activity-icon ${tone}`}><Icon size={14} /></span><span><strong>{title}</strong><small>{detail}</small></span><time>{time}</time></li>)}</ol></section>
    </div>
  </section>;
}

function OwnerView({ session, onLogout, onNavigate }) {
  const auth = { kind: "owner", token: session.token };
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiCall(`/bots/${encodeURIComponent(session.botId)}`, { auth });
      setBot(data.instance);
      return data.instance;
    } catch (err) {
      toast(err.message);
      if (String(err.message).toLowerCase().includes("ruhusa")) onLogout();
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session.botId, session.token]);

  useEffect(() => {
    void load().catch(() => {});
    const interval = setInterval(() => { void load().catch(() => {}); }, 15000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="dash-wrap fade-up">
      <div className="dash-owner-bar">
        <User size={14} style={{ color: "var(--token-info)" }} />
        <span className="font-mono">+{session.phoneNumber}</span>
        {bot && (
          <span className="dash-status-pill" style={{ color: statusStyleFor(bot.status).color, background: statusStyleFor(bot.status).bg, marginLeft: 8 }}>
            {bot.status === "online" ? <Wifi size={11} /> : <WifiOff size={11} />}
            {statusStyleFor(bot.status).label}
          </span>
        )}
        <button className="dash-mini-btn" style={{ marginLeft: "auto" }} onClick={onLogout}>Toka</button>
      </div>

      {loading && <DashboardSkeleton cards={2} />}
      {!loading && bot && (
        <><OwnerOverview bot={bot} session={session} onRefresh={load} onNavigate={onNavigate} /><div id="owner-settings"><OwnerSettings bot={bot} auth={auth} onRefresh={load} /></div></>
      )}
    </div>
  );
}

/* ── MAIN DASHBOARD ── */
export default function Dashboard({ onNavigate }) {
  const { session: ownerSession, login, logout } = useAuth();
  const [mode, setMode] = useState(() => localStorage.getItem(MODE_STORAGE) || null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(ADMIN_KEY_STORAGE) || "");

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

  const ownerLogin = async (phoneNumber, password) => login(phoneNumber, password);
  const ownerLogout = () => { logout(); backToPicker(); };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "transparent",
      }}
      className="flex flex-col items-center px-4 pt-10 pb-10"
    >
      <div className="dash-header fade-up">
        <span className="dash-badge">⚙ Dashboard Control</span>
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
        ? <OwnerView session={ownerSession} onLogout={ownerLogout} onNavigate={onNavigate} />
        : <OwnerLogin onLoggedIn={ownerLogin} onSignUp={() => { sessionStorage.setItem("26tech-signup-intent", "true"); onNavigate?.("pair"); }} />}

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .dash-header { width: 100%; max-width: 760px; margin: 0 auto 18px; text-align: center; }
        .dash-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; background: var(--token-info-bg); border: 1px solid var(--token-info-border); color: var(--token-info); font-size: 0.68rem; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 10px; }
        .dash-title { font-size: clamp(1.4rem, 5vw, 2rem); font-weight: 800; color: var(--token-text); letter-spacing: -0.02em; margin-bottom: 6px; }
        .dash-sub { font-size: 0.82rem; color: var(--token-muted); }
        @keyframes fadeUp { 0% { opacity: 0; transform: translateY(-8px); } 100% { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .dash-wrap { width: 100%; max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

        .dash-modepicker { width: 100%; max-width: 480px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .dash-mode-card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px 14px; border-radius: 18px; background: var(--token-card); backdrop-filter: blur(20px); border: 1px solid var(--token-card-border); color: var(--token-text); cursor: pointer; transition: 0.2s ease; }
        .dash-mode-card:hover { border-color: var(--token-border-strong); background: var(--token-hover); }
        .dash-mode-title { font-weight: 700; font-size: 0.95rem; }
        .dash-mode-sub { font-size: 0.72rem; color: var(--token-muted); text-align: center; }

        .auth-card {
          width: 100%; max-width: 420px; margin: 0 auto;
          background: var(--token-card); backdrop-filter: blur(20px);
          border: 1px solid var(--token-card-border); border-radius: 22px;
          padding: 30px 26px; display: flex; flex-direction: column; align-items: center;
          box-shadow: 0 0 40px var(--token-glow);
        }
        .auth-icon {
          width: 48px; height: 48px; border-radius: 14px; margin-bottom: 14px;
          display: flex; align-items: center; justify-content: center;
          background: var(--token-info-bg); border: 1px solid var(--token-info-border);
          color: var(--token-info);
        }
        .auth-title { color: var(--token-text); font-weight: 800; font-size: 1.15rem; text-align: center; margin-bottom: 8px; }
        .auth-sub { color: var(--token-muted); font-size: 0.8rem; text-align: center; line-height: 1.5; margin-bottom: 22px; }
        .auth-label { align-self: flex-start; color: var(--token-muted); font-size: 0.68rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; margin-bottom: 6px; }
        .auth-input {
          width: 100%; background: var(--token-surface); border: 1px solid var(--token-card-border);
          border-radius: 12px; padding: 12px 14px; color: var(--token-text); font-size: 0.9rem;
          margin-bottom: 16px; outline: none; transition: border-color 0.15s ease;
        }
        .auth-input::placeholder { color: var(--token-muted); }
        .auth-input:focus { border-color: var(--token-focus); }
        .auth-submit {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
          background: var(--token-accent-fill); border: none;
          border-radius: 12px; padding: 13px; color: var(--token-on-accent); font-weight: 700; font-size: 0.92rem;
          cursor: pointer; margin-top: 6px; box-shadow: 0 0 24px var(--token-glow-strong);
        }
        .auth-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .dash-owner-bar { display: flex; align-items: center; gap: 8px; background: var(--token-card); backdrop-filter: blur(20px); border: 1px solid var(--token-card-border); border-radius: 16px; padding: 10px 14px; color: var(--token-text); font-weight: 600; font-size: 0.85rem; }

        .dash-apikey-bar { display: flex; align-items: center; gap: 8px; background: var(--token-card); backdrop-filter: blur(20px); border: 1px solid var(--token-card-border); border-radius: 16px; padding: 10px 14px; }
        .dash-apikey-input { flex: 1; background: transparent; border: none; outline: none; color: var(--token-text); font-size: 0.82rem; font-family: var(--font-mono); min-width: 0; }
        .dash-apikey-input::placeholder { color: var(--token-muted); }
        .dash-mini-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 10px; background: var(--token-surface-strong); border: 1px solid var(--token-card-border); color: var(--token-text); font-size: 0.76rem; font-weight: 600; cursor: pointer; transition: 0.2s ease; white-space: nowrap; }
        .dash-mini-btn:hover:not(:disabled) { background: var(--token-hover); border-color: var(--token-border-strong); }
        .dash-mini-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .dash-mini-btn-accent { background: var(--token-accent-fill); border-color: transparent; color: var(--token-on-accent); }
        .dash-mini-btn-danger { border-color: var(--token-error); color: var(--token-error); }
        .dash-mini-btn-danger:hover:not(:disabled) { background: var(--token-error-bg); }

        .dash-stats-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .dash-stat-chip { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 12px; background: var(--token-surface); border: 1px solid var(--token-card-border); color: var(--token-text); font-size: 0.76rem; font-weight: 500; }

        .dash-empty { text-align: center; color: var(--token-muted); font-size: 0.85rem; padding: 24px 0; }

        .dash-bot-list { display: flex; flex-direction: column; gap: 12px; }
        .dash-bot-card { background: var(--token-card); backdrop-filter: blur(24px); border: 1px solid var(--token-card-border); border-radius: 18px; padding: 14px 16px; }
        .dash-bot-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .dash-bot-id { display: flex; align-items: center; gap: 8px; color: var(--token-text); font-weight: 600; font-size: 0.88rem; }
        .dash-status-pill { display: flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.03em; }
        .dash-bot-meta { display: flex; gap: 14px; margin-top: 6px; color: var(--token-muted); font-size: 0.74rem; }
        .dash-bot-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .dash-settings-loading { margin-top: 10px; font-size: 0.76rem; color: var(--token-muted); display: flex; align-items: center; gap: 6px; }
        .dash-settings-grid { margin-top: 10px; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px 14px; padding-top: 10px; border-top: 1px solid var(--token-border); }
        .dash-flag { display: flex; align-items: center; gap: 7px; font-size: 0.76rem; color: var(--token-text); cursor: pointer; }
        .dash-flag input { accent-color: var(--token-accent); }
        .spin-icon { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
