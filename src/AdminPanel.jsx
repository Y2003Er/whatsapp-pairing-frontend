import { useState, useEffect, useCallback } from "react";
import {
  Users, RefreshCw, LogOut, Trash2, ChevronDown, ChevronUp,
  Key, Wifi, WifiOff, Loader2, Smartphone, ShieldCheck, Search, X, Clock,
} from "lucide-react";
import { BACKEND_URL } from "./config";
import { toast, ToastContainer } from "./Toast";
import OwnerSettings from "./OwnerSettings";
import { DashboardSkeleton, EmptyState } from "./UIStates";

const ADMIN_TAB_STORAGE = "26tech-admin-panel-tab";

const ADMIN_TABS = [
  { key: "fleet", label: "Fleet", icon: Users },
  { key: "profile", label: "Profile", icon: ShieldCheck },
];

function maskApiKey(key) {
  if (!key) return "";
  if (key.length <= 8) return "•".repeat(key.length);
  return `${key.slice(0, 4)}${"•".repeat(key.length - 8)}${key.slice(-4)}`;
}

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

function formatRelativeTime(date) {
  if (!date) return "—";
  const s = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return `${m}m ago`;
}

const SORT_OPTIONS = [
  { key: "status", label: "Status" },
  { key: "uptime", label: "Uptime" },
  { key: "phone", label: "Phone number" },
];

const STATUS_RANK = { online: 0, connecting: 1, offline: 2, logged_out: 3 };

async function apiCall(path, { method = "GET", apiKey, body } = {}) {
  const headers = { "Content-Type": "application/json" };

  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
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
      toast("Enter DASHBOARD_API_KEY");
      return;
    }
    setBusy(true);
    try {
      // The raw key is used once to receive an HttpOnly server session. It is
      // deliberately never stored in localStorage, sessionStorage, or state.
      await apiCall("/admin/login", { method: "POST", body: { apiKey: value.trim() } });
      setValue("");
      onUnlock();
    } catch (err) {
      toast(err.message || "Invalid API key");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="admin-auth-card fade-up" onSubmit={submit}>
      <div className="admin-auth-icon"><ShieldCheck size={22} /></div>
      <h2 className="admin-auth-title">Developer Admin Access</h2>
      <p className="admin-auth-sub">
        Enter DASHBOARD_API_KEY to manage all hosted bots.
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
        Open Admin Panel
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

  const refreshSettings = async () => {
    const data = await apiCall(`/bots/${encodeURIComponent(bot.id)}`, { apiKey });
    const refreshedBot = { ...bot, ...data.instance, settings: data.instance?.settings || {} };
    setFullBot(refreshedBot);
    await onChanged?.();
    return refreshedBot;
  };

  if (loading || !fullBot) {
    return <div className="admin-settings-loading"><Loader2 size={14} className="spin-icon" /> Loading settings...</div>;
  }

  return (
    <div className="admin-settings-embed">
      <OwnerSettings bot={fullBot} auth={{ kind: "admin", key: apiKey }} onRefresh={refreshSettings} />
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
    return <p className="admin-settings-empty">No settings are enabled.</p>;
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
      toast(`${bot.phoneNumber}: ${action} completed successfully`, "success");
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
        <button className="admin-mini-btn" disabled={busy} onClick={() => run("logout", `/bots/${bot.id}/logout`, "POST", `Disconnect ${bot.phoneNumber} from WhatsApp? It will need to be paired again.`)}>
          {busy === "logout" ? <Loader2 size={13} className="spin-icon" /> : <LogOut size={13} />} Logout
        </button>
        <button className="admin-mini-btn admin-mini-btn-danger" disabled={busy} onClick={() => run("delete", `/bots/${bot.id}`, "DELETE", `Permanently delete ${bot.phoneNumber}? Its WhatsApp session will also be removed and it will need to be paired again.`)}>
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

/* ── ADMIN PROFILE (own account — where the developer session logout lives,
 * same idea as OwnerSettings.jsx does for a bot owner's own account) ── */
function AdminProfile({ onLogout }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="admin-card fade-up">
      <h3 className="admin-card-title"><ShieldCheck size={15} /> Admin Profile</h3>

      <div className="admin-profile-row">
        <span className="admin-profile-avatar"><ShieldCheck size={22} /></span>
        <div className="admin-profile-info">
          <strong>Developer Admin</strong>
          <small className="font-mono">Secure server session</small>
        </div>
      </div>

      <p className="admin-profile-note">
        You're signed in with a secure server session — full access to every hosted bot
        on this instance. The DASHBOARD_API_KEY is not stored in this browser.
      </p>

      <div className="admin-profile-actions">
        {!confirming ? (
          <button type="button" className="admin-danger-btn" onClick={() => setConfirming(true)}>
            <LogOut size={15} /> Sign out of admin panel
          </button>
        ) : (
          <div className="admin-confirm-row">
            <span>Sign out of this browser session? Hosted bots keep running.</span>
            <button type="button" className="admin-mini-btn" onClick={() => setConfirming(false)}>Cancel</button>
            <button type="button" className="admin-mini-btn admin-mini-btn-danger" onClick={onLogout}>
              <LogOut size={13} /> Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PlatformOwnerPairing({ apiKey, onCreated }) {
  const [number, setNumber] = useState("");
  const [method, setMethod] = useState("code");
  const [pairing, setPairing] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pairing?.pairingId || pairing.status === "paired") return undefined;
    const timer = window.setInterval(async () => {
      try {
        const data = await apiCall(`/pair/status/${encodeURIComponent(pairing.pairingId)}`, { apiKey });
        setPairing((current) => current ? { ...current, status: data.status, ownerSettingsPassword: data.ownerSettingsPassword || current.ownerSettingsPassword } : current);
        if (data.status === "paired") { toast("Platform-owner session connected.", "success"); onCreated?.(); }
      } catch (err) { toast(err.message, "error"); }
    }, 4000);
    return () => window.clearInterval(timer);
  }, [apiKey, onCreated, pairing?.pairingId, pairing?.status]);

  const start = async () => {
    const normalized = number.replace(/\D/g, "");
    if (!/^\d{10,15}$/.test(normalized)) return toast("Enter a valid WhatsApp number.", "error");
    setBusy(true);
    try {
      const data = await apiCall("/pair", { method: "POST", apiKey, body: { number: normalized, method } });
      setPairing({ ...data, status: "waiting" });
      toast("Platform-owner pairing started.", "success");
    } catch (err) { toast(err.message, "error"); }
    finally { setBusy(false); }
  };

  return <section className="admin-card fade-up"><h3 className="admin-card-title"><ShieldCheck size={15} /> Platform-owner pairing</h3><p className="admin-profile-note">Creates an admin-managed WhatsApp session. This control is available only after API-key authentication.</p><div className="admin-pair-row"><input className="admin-auth-input" value={number} onChange={(event) => setNumber(event.target.value.replace(/\D/g, ""))} placeholder="WhatsApp number" inputMode="numeric" /><select className="admin-auth-input" value={method} onChange={(event) => setMethod(event.target.value)}><option value="code">Pairing code</option><option value="qr">QR code</option></select><button type="button" className="admin-mini-btn dash-mini-btn-accent" disabled={busy} onClick={start}>{busy ? <Loader2 size={13} className="spin-icon" /> : <Smartphone size={13} />} Start pairing</button></div>{pairing && <div className="admin-pair-state"><strong>Status: {pairing.status}</strong>{pairing.code && <code>{pairing.code}</code>}{pairing.qr && <img src={pairing.qr} alt="Platform-owner pairing QR" />}{pairing.ownerSettingsPassword && <><span>Owner Settings password — copy and store it now:</span><code>{pairing.ownerSettingsPassword}</code></>}</div>}</section>;
}

/* ── FLEET HEALTH OVERVIEW ── */
function FleetHealth({ stats }) {
  if (!stats) return null;
  const segments = [
    { key: "online", value: stats.online, color: "var(--token-success)", label: "Online" },
    { key: "connecting", value: stats.connecting, color: "var(--token-warning)", label: "Connecting" },
    { key: "offline", value: stats.offline, color: "var(--token-muted)", label: "Offline" },
    { key: "loggedOut", value: stats.loggedOut, color: "var(--token-error)", label: "Logged out" },
  ];
  const total = Math.max(stats.total || 0, 1);

  return (
    <div className="fleet-health fade-up">
      <div className="fleet-health-top">
        <div className="fleet-health-count">
          <span className="fleet-health-number">{stats.total}</span>
          <span className="fleet-health-label">hosted bots</span>
        </div>
        <div className="fleet-health-legend">
          {segments.map((seg) => (
            <span className="fleet-health-legend-item" key={seg.key}>
              <i style={{ background: seg.color }} />
              {seg.label} <strong>{seg.value}</strong>
            </span>
          ))}
        </div>
      </div>
      <div className="fleet-health-bar" role="img" aria-label={`${stats.online} online, ${stats.connecting} connecting, ${stats.offline} offline, ${stats.loggedOut} logged out`}>
        {segments.map((seg) => seg.value > 0 && (
          <span
            key={seg.key}
            className="fleet-health-seg"
            style={{ width: `${(seg.value / total) * 100}%`, background: seg.color }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── FLEET TOOLBAR (search / filter / sort / manual refresh) ── */
function FleetToolbar({ query, onQuery, statusFilter, onStatusFilter, sortKey, onSortKey, onRefresh, refreshing, updatedAt }) {
  const statusOptions = [
    { key: "all", label: "All statuses" },
    { key: "online", label: "Online" },
    { key: "connecting", label: "Connecting" },
    { key: "offline", label: "Offline" },
    { key: "logged_out", label: "Logged out" },
  ];

  return (
    <div className="fleet-toolbar fade-up">
      <div className="fleet-search">
        <Search size={14} />
        <input
          type="text"
          placeholder="Search by phone number…"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
        {query && (
          <button type="button" className="fleet-search-clear" onClick={() => onQuery("")} aria-label="Clear search">
            <X size={13} />
          </button>
        )}
      </div>

      <select className="fleet-select" value={statusFilter} onChange={(e) => onStatusFilter(e.target.value)}>
        {statusOptions.map((opt) => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
      </select>

      <select className="fleet-select" value={sortKey} onChange={(e) => onSortKey(e.target.value)}>
        {SORT_OPTIONS.map((opt) => <option key={opt.key} value={opt.key}>Sort: {opt.label}</option>)}
      </select>

      <div className="fleet-toolbar-right">
        <span className="fleet-updated"><Clock size={12} /> Updated {formatRelativeTime(updatedAt)}</span>
        <button type="button" className="admin-mini-btn" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? <Loader2 size={13} className="spin-icon" /> : <RefreshCw size={13} />} Refresh
        </button>
      </div>
    </div>
  );
}

/* ── ADMIN BODY (bots list + stats) ── */
function AdminBody({ apiKey, onLogout }) {
  const [tab, setTab] = useState(() => {
    try {
      const saved = sessionStorage.getItem(ADMIN_TAB_STORAGE);
      return ADMIN_TABS.some((item) => item.key === saved) ? saved : "fleet";
    } catch { return "fleet"; }
  });
  const [stats, setStats] = useState(null);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("status");

  useEffect(() => {
    try { sessionStorage.setItem(ADMIN_TAB_STORAGE, tab); } catch { /* ignore */ }
  }, [tab]);

  const load = useCallback(async ({ manual = false } = {}) => {
    if (manual) setRefreshing(true);
    try {
      const data = await apiCall("/bots", { apiKey });
      setStats(data.stats);
      setBots(data.instances || []);
      setUpdatedAt(new Date());
    } catch (err) {
      toast(err.message);
      if (String(err.message).toLowerCase().includes("ruhusa") || String(err.message).toLowerCase().includes("unauthor")) {
        onLogout();
      }
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  }, [apiKey]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const visibleBots = bots
    .filter((bot) => {
      if (statusFilter !== "all" && String(bot.status || "").toLowerCase() !== statusFilter) return false;
      if (query.trim() && !String(bot.phoneNumber || "").includes(query.trim().replace(/\D/g, ""))) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortKey === "uptime") return (b.uptimeMs || 0) - (a.uptimeMs || 0);
      if (sortKey === "phone") return String(a.phoneNumber || "").localeCompare(String(b.phoneNumber || ""));
      const rankA = STATUS_RANK[String(a.status || "").toLowerCase()] ?? 9;
      const rankB = STATUS_RANK[String(b.status || "").toLowerCase()] ?? 9;
      return rankA - rankB;
    });

  return (
    <div className="admin-wrap fade-up">
      <div className="admin-topbar">
        <span className="admin-topbar-badge"><ShieldCheck size={14} /> Developer Mode</span>
      </div>

      <div className="admin-tabs">
        {ADMIN_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`admin-tab ${tab === key ? "active" : ""}`}
            onClick={() => setTab(key)}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === "fleet" && (
        <>
          <PlatformOwnerPairing apiKey={apiKey} onCreated={load} />

          <FleetHealth stats={stats} />

          {!loading && bots.length > 0 && (
            <FleetToolbar
              query={query} onQuery={setQuery}
              statusFilter={statusFilter} onStatusFilter={setStatusFilter}
              sortKey={sortKey} onSortKey={setSortKey}
              onRefresh={() => load({ manual: true })} refreshing={refreshing}
              updatedAt={updatedAt}
            />
          )}

          {loading && <DashboardSkeleton />}
          {!loading && bots.length === 0 && <EmptyState title="No hosted bots yet" description="New bots will appear here after pairing." />}
          {!loading && bots.length > 0 && visibleBots.length === 0 && (
            <EmptyState title="No bots match your filters" description="Try a different search term or status filter." />
          )}

          <div className="admin-bot-list">
            {visibleBots.map((bot) => (
              <BotCard key={bot.id} bot={bot} apiKey={apiKey} onRefresh={load} />
            ))}
          </div>
        </>
      )}

      {tab === "profile" && <AdminProfile apiKey={apiKey} onLogout={onLogout} />}
    </div>
  );
}

/* ── ADMIN PANEL (top-level — only mounted for the /admin path) ── */
export default function AdminPanel() {
  const [adminSession, setAdminSession] = useState(false);

  useEffect(() => {
    let active = true;
    apiCall("/admin/session").then(() => { if (active) setAdminSession(true); }).catch(() => {});
    return () => { active = false; };
  }, []);

  const logout = async () => {
    try { await apiCall("/admin/logout", { method: "POST" }); }
    finally { setAdminSession(false); }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "transparent",
      }}
      className="flex flex-col items-center px-4 pt-10 pb-10"
    >
      <ToastContainer />

      <div className="admin-header fade-up">
        <h1 className="admin-title">Fleet Control</h1>
        <p className="admin-sub">Developer-only — manage all hosted bots.</p>
      </div>

      {adminSession
        ? <AdminBody apiKey={true} onLogout={logout} />
        : <ApiKeyGate onUnlock={() => setAdminSession(true)} />}

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
          font-family: var(--font-mono);
        }
        .admin-pair-row { display: grid; grid-template-columns: 1fr 130px auto; gap: 8px; align-items: center; }.admin-pair-row .admin-auth-input { margin: 0; min-width: 0; }.admin-pair-state { display: grid; gap: 8px; margin-top: 12px; color: var(--token-text); font-size: .78rem; }.admin-pair-state code { color: var(--token-info); font-family: var(--font-mono); }.admin-pair-state img { width: min(220px, 100%); border-radius: 12px; border: 1px solid var(--token-card-border); } @media (max-width: 560px) { .admin-pair-row { grid-template-columns: 1fr; } }
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

        .admin-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
        .admin-tab {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 14px; border-radius: 12px; font-size: 0.78rem; font-weight: 700;
          background: var(--token-card); border: 1px solid var(--token-card-border);
          color: var(--token-muted); cursor: pointer; transition: 0.15s ease;
        }
        .admin-tab:hover { background: var(--token-hover); color: var(--token-text); }
        .admin-tab.active { background: var(--token-accent-fill); border-color: transparent; color: var(--token-on-accent); }

        .admin-card {
          background: var(--token-card); backdrop-filter: blur(20px);
          border: 1px solid var(--token-card-border); border-radius: 20px; padding: 22px;
        }
        .admin-card-title { display: flex; align-items: center; gap: 8px; color: var(--token-text); font-weight: 800; font-size: 1rem; margin-bottom: 18px; }

        .admin-profile-row { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .admin-profile-avatar {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--token-info-bg); border: 1px solid var(--token-info-border); color: var(--token-info);
        }
        .admin-profile-info { display: flex; flex-direction: column; gap: 3px; }
        .admin-profile-info strong { color: var(--token-text); font-size: 0.92rem; }
        .admin-profile-info small { color: var(--token-muted); font-size: 0.76rem; }
        .admin-profile-note { color: var(--token-muted); font-size: 0.78rem; line-height: 1.5; margin-bottom: 18px; }
        .admin-profile-actions { display: flex; }

        .admin-danger-btn {
          display: flex; align-items: center; gap: 8px; padding: 11px 16px; border-radius: 12px;
          background: var(--token-error-bg); border: 1px solid var(--token-error); color: var(--token-error);
          font-weight: 700; font-size: 0.82rem; cursor: pointer; transition: 0.15s ease;
        }
        .admin-danger-btn:hover { background: var(--token-error); color: var(--token-on-accent); }

        .admin-confirm-row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; color: var(--token-text); font-size: 0.8rem; font-weight: 600; }

        .admin-mini-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 10px; background: var(--token-surface-strong); border: 1px solid var(--token-card-border); color: var(--token-text); font-size: 0.76rem; font-weight: 600; cursor: pointer; transition: 0.2s ease; white-space: nowrap; margin-left: auto; }
        .admin-mini-btn:hover:not(:disabled) { background: var(--token-hover); border-color: var(--token-border-strong); }
        .admin-mini-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .admin-mini-btn-danger { border-color: var(--token-error); color: var(--token-error); }
        .admin-mini-btn-danger:hover:not(:disabled) { background: var(--token-error-bg); }

        .admin-stats-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .admin-stat-chip { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 12px; background: var(--token-surface); border: 1px solid var(--token-card-border); color: var(--token-text); font-size: 0.76rem; font-weight: 500; }

        .admin-empty { text-align: center; color: var(--token-muted); font-size: 0.85rem; padding: 24px 0; }

        .fleet-health {
          background: var(--token-card); backdrop-filter: blur(20px);
          border: 1px solid var(--token-card-border); border-radius: 18px; padding: 18px 20px;
        }
        .fleet-health-top { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
        .fleet-health-count { display: flex; align-items: baseline; gap: 8px; }
        .fleet-health-number { font-size: 1.7rem; font-weight: 800; color: var(--token-text); line-height: 1; }
        .fleet-health-label { color: var(--token-muted); font-size: 0.78rem; }
        .fleet-health-legend { display: flex; flex-wrap: wrap; gap: 12px; }
        .fleet-health-legend-item { display: flex; align-items: center; gap: 6px; color: var(--token-muted); font-size: 0.74rem; font-weight: 600; }
        .fleet-health-legend-item strong { color: var(--token-text); font-weight: 800; }
        .fleet-health-legend-item i { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .fleet-health-bar { display: flex; width: 100%; height: 8px; border-radius: 999px; overflow: hidden; background: var(--token-surface); }
        .fleet-health-seg { height: 100%; transition: width 0.4s ease; }

        .fleet-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .fleet-search {
          display: flex; align-items: center; gap: 8px; flex: 1 1 200px; min-width: 160px;
          background: var(--token-card); border: 1px solid var(--token-card-border); border-radius: 12px;
          padding: 9px 12px; color: var(--token-muted);
        }
        .fleet-search input {
          flex: 1; background: transparent; border: none; outline: none; color: var(--token-text); font-size: 0.82rem;
          min-width: 0;
        }
        .fleet-search input::placeholder { color: var(--token-muted); }
        .fleet-search-clear { display: flex; background: none; border: none; color: var(--token-muted); cursor: pointer; padding: 2px; }
        .fleet-select {
          background: var(--token-card); border: 1px solid var(--token-card-border); border-radius: 12px;
          padding: 9px 12px; color: var(--token-text); font-size: 0.78rem; font-weight: 600; cursor: pointer; outline: none;
        }
        .fleet-toolbar-right { display: flex; align-items: center; gap: 10px; margin-left: auto; }
        .fleet-updated { display: flex; align-items: center; gap: 5px; color: var(--token-muted); font-size: 0.72rem; white-space: nowrap; }

        .admin-bot-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; align-items: start; }
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
