import { useState, useEffect, useCallback } from "react";
import {
  Users, Activity, RefreshCw, LogOut, Trash2, ChevronDown, ChevronUp,
  Key, Wifi, WifiOff, Loader2, Smartphone, ShieldCheck,
} from "lucide-react";
import { BACKEND_URL } from "./config";
import { toast, ToastContainer } from "./Toast";
import OwnerSettings from "./OwnerSettings";
import { DashboardSkeleton, EmptyState } from "./UIStates";

const ADMIN_KEY_STORAGE = "26tech_admin_api_key";

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

/* ── SETTINGS PANEL (admin) ──
 * FIX: hii ilikuwa inaonyesha raw boolean flags kwa majina ya ndani ya code
 * (mfano "autoReactStatus" na "autoReact" kando kando — inayochanganya na
 * kuonyesha wazi ile name-mismatch kati ya dashboard na bot). Badala yake,
 * admin sasa anapata UI ile ile yenye maelezo (labels) anayoiona hoster
 * kwenye OwnerSettings — tofauti ni kwamba admin anaingia kwa API key yake
 * (auth.kind = "admin") na anaweza kuhariri bot YOYOTE, si bot yake tu. */
function AdminSettingsPanel({ bot, apiKey, onChanged }) {
  const [fullBot, setFullBot] = useState(bot.settings ? bot : null);
  const [loading, setLoading] = useState(!bot.settings);

  useEffect(() => {
    if (bot.settings) { setFullBot(bot); return; }
    let cancelled = false;
    setLoading(true);
    apiCall(`/bots/${encodeURIComponent(bot.id)}`, { apiKey })
      .then((data) => { if (!cancelled) setFullBot({ ...bot, settings: data.instance?.settings || {} }); })
      .catch((err) => { if (!cancelled) toast(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [bot.id, bot.settings, apiKey]);

  if (loading || !fullBot) {
    return <div className="admin-settings-loading"><Loader2 size={14} className="spin-icon" /> Inapakia settings...</div>;
  }

  return (
    <div className="admin-settings-embed">
      <OwnerSettings bot={fullBot} auth={{ kind: "admin", key: apiKey }} onRefresh={onChanged} />
    </div>
  );
}

// ✅ FIX (host toggle #3): developer alitakiwa aone, moja kwa moja kwenye
// orodha ya bots zote, ni settings zipi user flani anazitumia — bila
// kulazimika kubofya "Settings" kwa kila bot. Hii inabadilisha jina la
// backend (mfano "autoStatusView") kuwa jina rahisi kusomeka
// ("Auto Status View"), kwa hiyo badges zinatumia majina yale yale ya
// backend, si majina mapya ya frontend.
function humanizeSettingKey(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

// ✅ FIX (badge inapotosha): "Anti Link Action: warn" na "Anti Bad Word
// Action: warn" zilikuwa zinaonekana HATA kama antiLinkEnabled/
// antiBadWordEnabled ni false — kwa sababu action field (warn/delete/kick)
// daima ina thamani ya default, tofauti na feature yenyewe kuwa ON. Sasa
// select-badge inaonekana TU kama feature husika iko ON kweli.
// Pia `welcome`, `antiLink`, na `antiDelete` (boolean) ni majina ya zamani
// (legacy alias) ya welcomeEnabled/antiLinkEnabled/antiDelete-string —
// tunayaacha ili yasitoe badge ya pili inayokinzana na ile sahihi.
const LEGACY_ALIAS_KEYS = new Set(['welcome', 'antiLink', 'antiDelete']);

function SettingsSummary({ settings }) {
  if (!settings) return null;

  const activeToggles = Object.entries(settings).filter(
    ([k, v]) => v === true && !LEGACY_ALIAS_KEYS.has(k)
  );

  const selectBadges = [];
  if (settings.botMode && settings.botMode !== 'off') {
    selectBadges.push(['botMode', settings.botMode]);
  }
  if (typeof settings.antiDelete === 'string' && settings.antiDelete !== 'off' && settings.antiDelete !== '') {
    selectBadges.push(['antiDelete', settings.antiDelete]);
  }
  if (settings.antiLinkEnabled && settings.antiLinkAction) {
    selectBadges.push(['antiLinkAction', settings.antiLinkAction]);
  }
  if (settings.antiBadWordEnabled && settings.antiBadWordAction) {
    selectBadges.push(['antiBadWordAction', settings.antiBadWordAction]);
  }

  if (activeToggles.length === 0 && selectBadges.length === 0) {
    return <p className="admin-settings-empty">Hakuna settings zilizowashwa.</p>;
  }

  return (
    <div className="admin-badge-row">
      {(settings.botName || settings.ownerName) && (
        <span className="admin-badge admin-badge-name">
          {settings.botName || 'Bot'}{settings.ownerName ? ` — ${settings.ownerName}` : ''}
        </span>
      )}
      {selectBadges.map(([k, v]) => (
        <span key={k} className="admin-badge admin-badge-select">{humanizeSettingKey(k)}: {v}</span>
      ))}
      {activeToggles.map(([k]) => (
        <span key={k} className="admin-badge admin-badge-on">{humanizeSettingKey(k)}</span>
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
          <Smartphone size={15} style={{ color: "var(--token-info)", flexShrink: 0 }} />
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

      <SettingsSummary settings={bot.settings} />

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

      {expanded && <AdminSettingsPanel bot={bot} apiKey={apiKey} onChanged={onRefresh} />}
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
          <div className="admin-stat-chip"><Users size={13} style={{ color: "var(--token-info)" }} /> Total: {stats.total}</div>
          <div className="admin-stat-chip"><Activity size={13} style={{ color: "var(--token-success)" }} /> Online: {stats.online}</div>
          <div className="admin-stat-chip"><Activity size={13} style={{ color: "var(--token-warning)" }} /> Connecting: {stats.connecting}</div>
          <div className="admin-stat-chip"><Activity size={13} style={{ color: "var(--token-muted)" }} /> Offline: {stats.offline}</div>
          <div className="admin-stat-chip"><Activity size={13} style={{ color: "var(--token-error)" }} /> Logged out: {stats.loggedOut}</div>
        </div>
      )}

      {loading && <DashboardSkeleton />}
      {!loading && bots.length === 0 && <EmptyState title="Hakuna hosted bots bado" description="Bot mpya zitaonekana hapa baada ya ku-pair." />}

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
        background: "transparent",
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

      <p className="mt-6 text-xs text-center" style={{ color: "var(--token-muted)" }}>
        © 2026 26-TECH · Powered by AI Infrastructure
      </p>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .admin-header { width: 100%; max-width: 680px; margin: 0 auto 18px; text-align: center; }
        .admin-title { font-size: clamp(1.4rem, 5vw, 2rem); font-weight: 800; color: var(--token-text); letter-spacing: -0.02em; margin-bottom: 6px; }
        .admin-sub { font-size: 0.82rem; color: var(--token-muted); }
        @keyframes fadeUp { 0% { opacity: 0; transform: translateY(-8px); } 100% { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .admin-wrap { width: 100%; max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

        .admin-auth-card {
          width: 100%; max-width: 420px; margin: 0 auto;
          background: var(--token-card); backdrop-filter: blur(20px);
          border: 1px solid var(--token-card-border); border-radius: 22px;
          padding: 30px 26px; display: flex; flex-direction: column; align-items: center;
          box-shadow: 0 0 40px var(--token-glow);
        }
        .admin-auth-icon {
          width: 48px; height: 48px; border-radius: 14px; margin-bottom: 14px;
          display: flex; align-items: center; justify-content: center;
          background: var(--token-info-bg); border: 1px solid var(--token-info-border);
          color: var(--token-info);
        }
        .admin-auth-title { color: var(--token-text); font-weight: 800; font-size: 1.15rem; text-align: center; margin-bottom: 8px; }
        .admin-auth-sub { color: var(--token-muted); font-size: 0.8rem; text-align: center; line-height: 1.5; margin-bottom: 22px; }
        .admin-auth-label { align-self: flex-start; color: var(--token-muted); font-size: 0.68rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; margin-bottom: 6px; }
        .admin-auth-input {
          width: 100%; background: var(--token-surface); border: 1px solid var(--token-card-border);
          border-radius: 12px; padding: 12px 14px; color: var(--token-text); font-size: 0.9rem;
          margin-bottom: 16px; outline: none; transition: border-color 0.15s ease;
          font-family: 'IBM Plex Mono', monospace;
        }
        .admin-auth-input::placeholder { color: var(--token-muted); }
        .admin-auth-input:focus { border-color: var(--token-focus); }
        .admin-auth-submit {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
          background: var(--token-accent-fill); border: none;
          border-radius: 12px; padding: 13px; color: var(--token-on-accent); font-weight: 700; font-size: 0.92rem;
          cursor: pointer; margin-top: 6px; box-shadow: 0 0 24px var(--token-glow-strong);
        }
        .admin-auth-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .admin-topbar { display: flex; align-items: center; gap: 8px; background: var(--token-card); backdrop-filter: blur(20px); border: 1px solid var(--token-card-border); border-radius: 16px; padding: 10px 14px; }
        .admin-topbar-badge { display: flex; align-items: center; gap: 6px; color: var(--token-info); font-weight: 700; font-size: 0.8rem; }

        .admin-mini-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 10px; background: var(--token-surface-strong); border: 1px solid var(--token-card-border); color: var(--token-text); font-size: 0.76rem; font-weight: 600; cursor: pointer; transition: 0.2s ease; white-space: nowrap; margin-left: auto; }
        .admin-mini-btn:hover:not(:disabled) { background: var(--token-hover); border-color: var(--token-border-strong); }
        .admin-mini-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .admin-mini-btn-danger { border-color: var(--token-error); color: var(--token-error); }
        .admin-mini-btn-danger:hover:not(:disabled) { background: var(--token-error-bg); }

        .admin-stats-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .admin-stat-chip { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 12px; background: var(--token-surface); border: 1px solid var(--token-card-border); color: var(--token-text); font-size: 0.76rem; font-weight: 500; }

        .admin-empty { text-align: center; color: var(--token-muted); font-size: 0.85rem; padding: 24px 0; }

        .admin-bot-list { display: flex; flex-direction: column; gap: 12px; }
        .admin-bot-card { background: var(--token-card); backdrop-filter: blur(24px); border: 1px solid var(--token-card-border); border-radius: 18px; padding: 14px 16px; }
        .admin-bot-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .admin-bot-id { display: flex; align-items: center; gap: 8px; color: var(--token-text); font-weight: 600; font-size: 0.88rem; }
        .admin-status-pill { display: flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.03em; }
        .admin-bot-meta { display: flex; gap: 14px; margin-top: 6px; color: var(--token-muted); font-size: 0.74rem; }
        .admin-bot-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .admin-settings-loading { margin-top: 10px; font-size: 0.76rem; color: var(--token-muted); display: flex; align-items: center; gap: 6px; }
        .admin-settings-embed { margin-top: 12px; padding-top: 14px; border-top: 1px solid var(--token-border); }
        .admin-settings-empty { margin-top: 8px; font-size: 0.72rem; color: var(--token-muted); }
        .admin-badge-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
        .admin-badge { padding: 3px 9px; border-radius: 999px; font-size: 0.68rem; font-weight: 600; white-space: nowrap; }
        .admin-badge-name { background: var(--token-surface-strong); border: 1px solid var(--token-card-border); color: var(--token-text); font-weight: 700; }
        .admin-badge-select { background: var(--token-info-bg); border: 1px solid var(--token-info-border); color: var(--token-info); }
        .admin-badge-on { background: var(--token-success-bg); border: 1px solid var(--token-success); color: var(--token-success); }
        .spin-icon { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
