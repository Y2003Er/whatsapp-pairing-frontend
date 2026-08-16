import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, Bot, ChevronDown, ChevronUp, KeyRound, LayoutDashboard,
  Loader2, LogOut, Menu, MoreHorizontal, Plus, RefreshCw, Search, Settings,
  CreditCard, ReceiptText, Server, ShieldCheck, Smartphone, Trash2, Wallet, Wifi, WifiOff, X,
} from "lucide-react";
import { BACKEND_URL } from "./config";
import { toast, ToastContainer } from "./Toast";
import OwnerSettings from "./OwnerSettings";
import "./admin.css";

const navigation = [
  { key: "overview", path: "/admin", label: "Overview", icon: LayoutDashboard },
  { key: "bots", path: "/admin/bots", label: "Bots", icon: Bot },
  { key: "pair", path: "/admin/pair", label: "Add bot", icon: Plus },
  { key: "subscriptions", path: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { key: "plans", path: "/admin/plans", label: "Plans", icon: CreditCard },
  { key: "payments", path: "/admin/payments", label: "Payments", icon: ReceiptText },
  { key: "wallets", path: "/admin/wallets", label: "Wallets", icon: Wallet },
  { key: "transactions", path: "/admin/transactions", label: "Transactions", icon: Activity },
  { key: "system", path: "/admin/system", label: "System status", icon: Server },
];

const STATUS = {
  online: { label: "Online", tone: "success" },
  connecting: { label: "Connecting", tone: "warning" },
  offline: { label: "Offline", tone: "neutral" },
  logged_out: { label: "Logged out", tone: "danger" },
};

async function api(path, options = {}) {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: options.method || "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

function relativeTime(date) {
  if (!date) return "Not updated yet";
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 10) return "Updated just now";
  if (seconds < 60) return `Updated ${seconds}s ago`;
  return `Updated ${Math.floor(seconds / 60)}m ago`;
}

function uptime(ms) {
  if (!ms) return "—";
  const totalMinutes = Math.floor(ms / 60000);
  return totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes}m`;
}

function statusFor(status) { return STATUS[String(status || "").toLowerCase()] || STATUS.offline; }

function StatusBadge({ status }) {
  const item = statusFor(status);
  return <span className={`cc-status cc-status-${item.tone}`}><i />{item.label}</span>;
}

function ApiKeyGate({ onUnlock }) {
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (!key.trim()) return toast("Enter your dashboard API key.");
    setBusy(true);
    try { await api("/admin/login", { method: "POST", body: { apiKey: key.trim() } }); setKey(""); onUnlock(); }
    catch (error) { toast(error.message || "Unable to sign in."); }
    finally { setBusy(false); }
  };
  return <main className="cc-auth-shell"><form className="cc-auth-card" onSubmit={submit}>
    <span className="cc-auth-mark"><ShieldCheck size={25} /></span>
    <p className="cc-eyebrow">26-TECH PLATFORM</p><h1>Admin Control Center</h1>
    <p>Use your dashboard API key to start a secure, browser-only admin session.</p>
    <label htmlFor="admin-key">Dashboard API key</label>
    <input id="admin-key" value={key} type="password" autoFocus autoComplete="current-password" onChange={(event) => setKey(event.target.value)} placeholder="Enter API key" />
    <button className="cc-primary" disabled={busy}>{busy ? <Loader2 className="cc-spin" size={17} /> : <KeyRound size={17} />} Continue securely</button>
    <small>Your key is exchanged for an HttpOnly session and is not stored in this browser.</small>
  </form></main>;
}

function Sidebar({ active, onNavigate, open, onClose, onLogout }) {
  return <aside className={`cc-sidebar ${open ? "is-open" : ""}`}>
    <div className="cc-brand"><span>26</span><div><strong>26-TECH</strong><small>CONTROL CENTER</small></div><button className="cc-mobile-close" onClick={onClose} aria-label="Close menu"><X size={19} /></button></div>
    <nav aria-label="Admin navigation"><p>WORKSPACE</p>{navigation.map(({ key, path, label, icon: Icon }) => <button key={key} className={active === key ? "active" : ""} onClick={() => { onNavigate(path); onClose(); }}><Icon size={18} />{label}</button>)}</nav>
    <nav aria-label="Account navigation"><p>ACCOUNT</p><button className={active === "settings" ? "active" : ""} onClick={() => { onNavigate("/admin/settings"); onClose(); }}><Settings size={18} />Profile & security</button></nav>
    <div className="cc-sidebar-bottom"><div className="cc-admin-avatar"><ShieldCheck size={17} /><div><strong>Developer Admin</strong><small><i /> Secure session</small></div></div><button className="cc-signout" onClick={onLogout}><LogOut size={17} />Sign out</button></div>
  </aside>;
}

function StatCard({ label, value, note, icon: Icon, tone = "blue" }) { return <article className="cc-stat-card"><span className={`cc-stat-icon ${tone}`}><Icon size={19} /></span><p>{label}</p><strong>{value ?? "—"}</strong><small>{note}</small></article>; }

function FleetHealth({ stats }) {
  const segments = [{ key: "online", label: "Online", color: "var(--token-success)" }, { key: "connecting", label: "Connecting", color: "var(--token-warning)" }, { key: "offline", label: "Offline", color: "var(--token-muted)" }, { key: "loggedOut", label: "Logged out", color: "var(--token-error)" }];
  const total = Math.max(stats?.total || 0, 1);
  return <section className="cc-panel cc-health"><div className="cc-panel-heading"><div><p className="cc-eyebrow">FLEET HEALTH</p><h2>Connection status</h2></div><Activity size={19} /></div><div className="cc-health-bar">{segments.map((item) => stats?.[item.key] > 0 && <span key={item.key} style={{ width: `${stats[item.key] / total * 100}%`, background: item.color }} />)}</div><div className="cc-health-legend">{segments.map((item) => <span key={item.key}><i style={{ background: item.color }} />{item.label}<strong>{stats?.[item.key] ?? "—"}</strong></span>)}</div></section>;
}

function LegacyBotCard({ bot, onRefresh }) {
  const [busy, setBusy] = useState(""); const [expanded, setExpanded] = useState(false);
  const perform = async (action, method, confirmation) => {
    if (confirmation && !window.confirm(confirmation)) return;
    setBusy(action);
    try { await api(`/bots/${encodeURIComponent(bot.id)}${action === "delete" ? "" : `/${action}`}`, { method }); toast(`${bot.phoneNumber}: ${action} complete`, "success"); onRefresh(); }
    catch (error) { toast(error.message); } finally { setBusy(""); }
  };
  return <article className="cc-bot-card"><div className="cc-bot-main"><span className="cc-bot-phone"><Smartphone size={17} />+{bot.phoneNumber}</span><StatusBadge status={bot.status} /></div><div className="cc-bot-metrics"><span>Uptime <strong>{uptime(bot.uptimeMs)}</strong></span><span>Messages <strong>{bot.stats?.messagesProcessed ?? "—"}</strong></span></div>{settingsSummary(bot.settings).length > 0 && <div className="cc-setting-summary">{settingsSummary(bot.settings).map(([key, enabled]) => <span key={key}>{key.replace(/([a-z])([A-Z])/g, "$1 $2")} <strong>{enabled ? "ON" : "OFF"}</strong></span>)}</div>}<div className="cc-bot-actions"><button onClick={() => perform("restart", "POST")} disabled={!!busy}>{busy === "restart" ? <Loader2 className="cc-spin" size={15} /> : <RefreshCw size={15} />} Restart</button><button onClick={() => setExpanded(!expanded)}><Settings size={15} /> Settings {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button><details className="cc-danger-menu"><summary aria-label="More bot actions"><MoreHorizontal size={18} /></summary><div><button onClick={() => perform("logout", "POST", `Disconnect +${bot.phoneNumber}? It will need to be paired again.`)}><WifiOff size={14} />Disconnect</button><button className="danger" onClick={() => perform("delete", "DELETE", `Permanently delete +${bot.phoneNumber}? Its WhatsApp session will be removed.`)}><Trash2 size={14} />Delete bot</button></div></details></div>{expanded && <div className="cc-settings"><OwnerSettings bot={bot} auth={{ kind: "admin", key: true }} onRefresh={onRefresh} /></div>}</article>;
}

function LegacyBotsView({ bots, loading, onRefresh }) {
  const [search, setSearch] = useState(""); const [filter, setFilter] = useState("all");
  const visible = useMemo(() => bots.filter((bot) => (filter === "all" || bot.status === filter) && String(bot.phoneNumber || "").includes(search.replace(/\D/g, ""))), [bots, filter, search]);
  return <><div className="cc-page-heading"><div><p className="cc-eyebrow">MANAGEMENT</p><h1>Bot fleet</h1><p>Monitor and manage every hosted WhatsApp bot.</p></div><button className="cc-secondary" onClick={onRefresh}><RefreshCw size={16} />Refresh</button></div><section className="cc-toolbar"><label><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search phone number" /></label><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All statuses</option><option value="online">Online</option><option value="connecting">Connecting</option><option value="offline">Offline</option><option value="logged_out">Logged out</option></select><span>{visible.length} of {bots.length} bots</span></section>{loading ? <div className="cc-loading"><Loader2 className="cc-spin" /> Loading fleet…</div> : visible.length ? <section className="cc-bot-grid">{visible.map((bot) => <BotCard key={bot.id} bot={bot} onRefresh={onRefresh} />)}</section> : <section className="cc-empty"><Bot size={24} /><h2>No bots found</h2><p>Try changing the search or status filter.</p></section>}</>;
}

function BotCard({ bot, onRefresh, onOpenSettings }) {
  const [busy, setBusy] = useState("");
  const plan = bot.subscription?.plan || bot.membershipTier || "No active plan";
  const perform = async (action, method, confirmation) => {
    if (confirmation && !window.confirm(confirmation)) return;
    setBusy(action);
    try {
      await api(`/bots/${encodeURIComponent(bot.id)}${action === "delete" ? "" : `/${action}`}`, { method });
      toast(`${bot.phoneNumber}: ${action} complete`, "success");
      await onRefresh();
    } catch (error) { toast(error.message); } finally { setBusy(""); }
  };
  return <article className="cc-bot-card">
    <div className="cc-bot-main"><span className="cc-bot-phone"><Smartphone size={17} />+{bot.phoneNumber}</span><StatusBadge status={bot.status} /></div>
    <div className="cc-bot-metrics"><span>Uptime <strong>{uptime(bot.uptimeMs)}</strong></span><span>Messages <strong>{bot.stats?.messagesProcessed ?? "-"}</strong></span><span>Plan <strong className="cc-plan-value">{plan}</strong></span></div>
    {settingsSummary(bot.settings).length > 0 && <div className="cc-setting-summary">{settingsSummary(bot.settings).map(([key, enabled]) => <span key={key}>{key.replace(/([a-z])([A-Z])/g, "$1 $2")} <strong>{enabled ? "ON" : "OFF"}</strong></span>)}</div>}
    <div className="cc-bot-actions"><button onClick={() => perform("restart", "POST")} disabled={!!busy}>{busy === "restart" ? <Loader2 className="cc-spin" size={15} /> : <RefreshCw size={15} />} Restart</button><button onClick={() => onOpenSettings(bot)}><Settings size={15} /> Settings</button><details className="cc-danger-menu"><summary aria-label="More bot actions"><MoreHorizontal size={18} /></summary><div><button onClick={() => perform("logout", "POST", `Disconnect +${bot.phoneNumber}? It will need to be paired again.`)}><WifiOff size={14} />Disconnect</button><button className="danger" onClick={() => perform("delete", "DELETE", `Permanently delete +${bot.phoneNumber}? Its WhatsApp session will be removed.`)}><Trash2 size={14} />Delete bot</button></div></details></div>
  </article>;
}

function BotSettingsInspector({ bot, onClose, onRefresh }) {
  return <div className="cc-inspector-layer" role="presentation" onMouseDown={onClose}><section className="cc-inspector" role="dialog" aria-modal="true" aria-label={`Settings for ${bot.phoneNumber}`} onMouseDown={(event) => event.stopPropagation()}><header><div><p className="cc-eyebrow">BOT CONTROL SURFACE</p><h2><Smartphone size={18} /> +{bot.phoneNumber}</h2><p><StatusBadge status={bot.status} /> <span>Plan: <strong>{bot.subscription?.plan || bot.membershipTier || "No active plan"}</strong></span></p></div><button className="cc-inspector-close" onClick={onClose} aria-label="Close bot settings"><X size={19} /></button></header><OwnerSettings key={bot.id} bot={bot} auth={{ kind: "admin", key: true }} onRefresh={onRefresh} /></section></div>;
}

function BotsView({ bots, loading, onRefresh, onRefreshBot }) {
  const [search, setSearch] = useState(""); const [filter, setFilter] = useState("all"); const [selectedBot, setSelectedBot] = useState(null);
  const visible = useMemo(() => bots.filter((bot) => (filter === "all" || bot.status === filter) && String(bot.phoneNumber || "").includes(search.replace(/\D/g, ""))), [bots, filter, search]);
  const refreshSelected = async () => {
    const data = onRefreshBot ? await onRefreshBot(selectedBot.id) : await api(`/bots/${encodeURIComponent(selectedBot.id)}`);
    const bot = data.instance ? { ...data.instance, ...data.profile, subscription: data.profile?.subscription } : data;
    setSelectedBot(bot);
    return bot;
  };
  return <><div className="cc-page-heading"><div><p className="cc-eyebrow">MANAGEMENT</p><h1>Bot fleet</h1><p>Monitor and manage every hosted WhatsApp bot.</p></div><button className="cc-secondary" onClick={onRefresh}><RefreshCw size={16} />Refresh</button></div><section className="cc-toolbar"><label><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search phone number" /></label><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All statuses</option><option value="online">Online</option><option value="connecting">Connecting</option><option value="offline">Offline</option><option value="logged_out">Logged out</option></select><span>{visible.length} of {bots.length} bots</span></section>{loading ? <div className="cc-loading"><Loader2 className="cc-spin" /> Loading fleet...</div> : visible.length ? <section className="cc-bot-grid">{visible.map((bot) => <BotCard key={bot.id} bot={bot} onRefresh={onRefresh} onOpenSettings={setSelectedBot} />)}</section> : <section className="cc-empty"><Bot size={24} /><h2>No bots found</h2><p>Try changing the search or status filter.</p></section>}{selectedBot && <BotSettingsInspector bot={selectedBot} onClose={() => setSelectedBot(null)} onRefresh={refreshSelected} />}</>;
}

// Kept as compatibility references while the focused inspector supersedes card expansion.
BotsView.legacyComponents = { BotCard: LegacyBotCard, BotsView: LegacyBotsView };

function settingsSummary(settings) {
  return Object.entries(settings || {}).filter(([, value]) => typeof value === "boolean").slice(0, 6);
}

function BusinessTable({ title, description, endpoint, rowsKey, columns }) {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const data = await api(endpoint); setRows(data[rowsKey] || []); } catch (err) { setError(err.message); } finally { setLoading(false); } }, [endpoint, rowsKey]);
  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);
  return <><div className="cc-page-heading"><div><p className="cc-eyebrow">BUSINESS OPERATIONS</p><h1>{title}</h1><p>{description}</p></div><button className="cc-secondary" onClick={load}><RefreshCw size={16} />Refresh</button></div><section className="cc-panel cc-data-panel">{loading ? <div className="cc-loading"><Loader2 className="cc-spin" /> Loading records…</div> : error ? <div className="cc-empty"><h2>Could not load data</h2><p>{error}</p><button className="cc-secondary" onClick={load}>Retry</button></div> : rows.length ? <div className="cc-data-table"><div className="cc-data-head">{columns.map((column) => <span key={column.label}>{column.label}</span>)}</div>{rows.map((row, index) => <div className="cc-data-row" key={row.transactionId || row.paymentReference || row.ownerId || index}>{columns.map((column) => <span key={column.label}>{column.render ? column.render(row) : row[column.key] ?? "—"}</span>)}</div>)}</div> : <div className="cc-empty"><h2>No records yet</h2><p>This section displays real platform data when it becomes available.</p></div>}</section></>;
}

function SystemView({ control }) {
  return <><div className="cc-page-heading"><div><p className="cc-eyebrow">SYSTEM</p><h1>System status</h1><p>Live status from the existing platform services.</p></div></div><section className="cc-stat-grid"><StatCard label="API" value={control?.system?.api || "Unknown"} note="Backend health endpoint" icon={Server} tone="green" /><StatCard label="Uptime" value={control?.system?.uptimeSeconds != null ? uptime(control.system.uptimeSeconds * 1000) : "—"} note="Current process runtime" icon={Activity} /><StatCard label="Active sessions" value={control?.fleet?.activeSockets} note="Open bot sockets" icon={Wifi} tone="green" /><StatCard label="Pending reconnects" value={control?.fleet?.pendingReconnects} note="Managed automatically" icon={RefreshCw} tone="orange" /></section></>;
}

function PairView({ onCreated }) {
  const [number, setNumber] = useState(""); const [method, setMethod] = useState("code"); const [result, setResult] = useState(null); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!result?.pairingId || result.status === "paired") return undefined; const timer = window.setInterval(async () => { try { const next = await api(`/pair/status/${encodeURIComponent(result.pairingId)}`); setResult((current) => ({ ...current, ...next })); if (next.status === "paired") { toast("Bot connected.", "success"); onCreated(); } } catch (error) { toast(error.message); } }, 4000); return () => window.clearInterval(timer); }, [result?.pairingId, result?.status, onCreated]);
  const submit = async (event) => { event.preventDefault(); const normalized = number.replace(/\D/g, ""); if (!/^\d{10,15}$/.test(normalized)) return toast("Enter a valid WhatsApp number."); setBusy(true); try { const data = await api("/pair", { method: "POST", body: { number: normalized, method } }); setResult({ ...data, status: "waiting" }); toast("Pairing started.", "success"); } catch (error) { toast(error.message); } finally { setBusy(false); } };
  return <><div className="cc-page-heading"><div><p className="cc-eyebrow">FLEET MANAGEMENT</p><h1>Add a bot</h1><p>Create an admin-managed WhatsApp connection.</p></div></div><form className="cc-pair-card" onSubmit={submit}><label>WhatsApp number<input value={number} onChange={(event) => setNumber(event.target.value.replace(/\D/g, ""))} placeholder="e.g. 2547…" inputMode="numeric" /></label><label>Verification method<select value={method} onChange={(event) => setMethod(event.target.value)}><option value="code">Pairing code</option><option value="qr">QR code</option></select></label><button className="cc-primary" disabled={busy}>{busy ? <Loader2 className="cc-spin" size={16} /> : <Plus size={16} />}Start pairing</button></form>{result && <section className="cc-pair-result"><StatusBadge status={result.status === "paired" ? "online" : "connecting"} />{result.code && <><p>Enter this pairing code on WhatsApp:</p><code>{result.code}</code></>}{result.qr && <img src={result.qr} alt="WhatsApp pairing QR code" />}{result.ownerSettingsPassword && <p>Owner settings password: <code>{result.ownerSettingsPassword}</code></p>}</section>}</>;
}

function Overview({ stats, bots, loading, onNavigate, onRefresh, updatedAt }) { const online = stats?.online ?? 0; return <><div className="cc-page-heading"><div><p className="cc-eyebrow">CONTROL CENTER</p><h1>Good to see you, Admin.</h1><p>Here’s the live operational view of your hosted bot fleet.</p></div><button className="cc-secondary" onClick={onRefresh}><RefreshCw size={16} />{relativeTime(updatedAt)}</button></div><section className="cc-stat-grid"><StatCard label="Hosted bots" value={stats?.total} note="All registered bot instances" icon={Bot} /><StatCard label="Online now" value={online} note={`${stats?.connecting ?? 0} currently connecting`} icon={Wifi} tone="green" /><StatCard label="Active sockets" value={stats?.activeSockets} note="Live WhatsApp connections" icon={Activity} tone="violet" /><StatCard label="Reconnects" value={stats?.reconnects} note={`${stats?.pendingReconnects ?? 0} reconnects pending`} icon={RefreshCw} tone="orange" /></section><div className="cc-overview-grid"><FleetHealth stats={stats} /><section className="cc-panel cc-quick"><div className="cc-panel-heading"><div><p className="cc-eyebrow">QUICK ACTIONS</p><h2>Manage fleet</h2></div></div><button onClick={() => onNavigate("/admin/pair")}><Plus size={17} />Add a new bot</button><button onClick={() => onNavigate("/admin/bots")}><Bot size={17} />Open bot management</button></section></div><section className="cc-panel cc-recent"><div className="cc-panel-heading"><div><p className="cc-eyebrow">LIVE FLEET</p><h2>Recent bot status</h2></div><button className="cc-text-button" onClick={() => onNavigate("/admin/bots")}>View all</button></div>{loading ? <div className="cc-loading"><Loader2 className="cc-spin" />Refreshing fleet…</div> : bots.length ? <div className="cc-table">{bots.slice(0, 5).map((bot) => <div key={bot.id}><span className="cc-bot-phone"><Smartphone size={16} />+{bot.phoneNumber}</span><span>{bot.stats?.messagesProcessed ?? 0} messages</span><span>{uptime(bot.uptimeMs)}</span><StatusBadge status={bot.status} /></div>)}</div> : <div className="cc-empty small"><WifiOff size={22} /><p>No hosted bots yet. Add one to begin.</p></div>}</section></>;
}

function SettingsView({ onLogout }) { return <><div className="cc-page-heading"><div><p className="cc-eyebrow">ACCOUNT</p><h1>Profile & security</h1><p>Your admin authentication is managed securely by the server.</p></div></div><section className="cc-panel cc-profile"><span className="cc-auth-mark"><ShieldCheck size={24} /></span><div><h2>Developer Admin</h2><p><i /> Active secure server session</p><small>The dashboard API key is exchanged for an HttpOnly session cookie. It is not persisted in local or session storage.</small></div><button className="cc-danger-button" onClick={onLogout}><LogOut size={16} />Sign out</button></section></>;
}

function AdminWorkspace({ onLogout }) {
  const currentPath = () => window.location.pathname.replace(/\/+$/, "") || "/admin";
  const pageForPath = (path) => navigation.find((item) => item.path === path)?.key || (path === "/admin/settings" ? "settings" : "overview");
  const [path, setPath] = useState(currentPath); const [menuOpen, setMenuOpen] = useState(false); const [stats, setStats] = useState(null); const [control, setControl] = useState(null); const [bots, setBots] = useState([]); const [loading, setLoading] = useState(true); const [updatedAt, setUpdatedAt] = useState(null);
  const navigate = useCallback((next) => { window.history.pushState({}, "", next); setPath(next); }, []);
  const load = useCallback(async () => { try { const [fleet, center] = await Promise.all([api("/bots"), api("/admin/control-center")]); setStats(fleet.stats); setBots(fleet.instances || []); setControl(center); setUpdatedAt(new Date()); } catch (error) { toast(error.message); if (/unauthor/i.test(error.message)) onLogout(); } finally { setLoading(false); } }, [onLogout]);
  useEffect(() => { queueMicrotask(() => { void load(); }); const interval = window.setInterval(load, 15000); const pop = () => setPath(currentPath()); window.addEventListener("popstate", pop); return () => { window.clearInterval(interval); window.removeEventListener("popstate", pop); }; }, [load]);
  const active = pageForPath(path);
  const columns = { subscriptions: [{ label: "Owner", key: "phoneNumber" }, { label: "Plan", key: "plan" }, { label: "Status", key: "status" }, { label: "Expires", render: (row) => row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : row.trialEnd ? new Date(row.trialEnd).toLocaleDateString() : "—" }], plans: [{ label: "Plan", key: "name" }, { label: "Credits", key: "credits" }, { label: "Price", render: (row) => row.amount == null ? "—" : `${row.amount} ${row.currency}` }, { label: "Tier", key: "membershipTier" }], payments: [{ label: "Reference", key: "paymentReference" }, { label: "Owner", key: "phoneNumber" }, { label: "Amount", render: (row) => `${row.amount} ${row.currency}` }, { label: "Status", key: "status" }], wallets: [{ label: "Owner", key: "phoneNumber" }, { label: "Balance", key: "creditBalance" }, { label: "Purchased", key: "totalPurchased" }, { label: "Used", key: "totalUsed" }], transactions: [{ label: "Transaction", key: "transactionId" }, { label: "Owner", key: "phoneNumber" }, { label: "Credits", key: "credits" }, { label: "Status", key: "status" }] };
  return <div className="cc-app"><Sidebar active={active} open={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={navigate} onLogout={onLogout} /><div className="cc-mobile-backdrop" onClick={() => setMenuOpen(false)} /><main className="cc-main"><header className="cc-topbar"><button className="cc-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={20} /></button><div className="cc-breadcrumb">Control Center <span>/</span> {navigation.find((item) => item.key === active)?.label || "Profile & security"}</div><span className="cc-live"><i />System operational</span></header><div className="cc-content">{active === "overview" && <Overview stats={stats} bots={bots} loading={loading} onNavigate={navigate} onRefresh={load} updatedAt={updatedAt} />}{active === "bots" && <BotsView bots={bots} loading={loading} onRefresh={load} />}{active === "pair" && <PairView onCreated={load} />}{["subscriptions", "plans", "payments", "wallets", "transactions"].includes(active) && <BusinessTable title={navigation.find((item) => item.key === active)?.label} description="Live records from the existing platform database." endpoint={`/admin/${active}`} rowsKey={active} columns={columns[active]} />}{active === "system" && <SystemView control={control} />}{active === "settings" && <SettingsView onLogout={onLogout} />}</div></main></div>;
}

export default function AdminPanel() {
  const [session, setSession] = useState(null);
  useEffect(() => { let alive = true; api("/admin/session").then(() => alive && setSession(true)).catch(() => alive && setSession(false)); return () => { alive = false; }; }, []);
  const logout = useCallback(async () => { try { await api("/admin/logout", { method: "POST" }); } finally { setSession(false); window.history.replaceState({}, "", "/admin"); } }, []);
  if (session === null) return <main className="cc-auth-shell"><Loader2 className="cc-spin" size={26} /></main>;
  return <><ToastContainer />{session ? <AdminWorkspace onLogout={logout} /> : <ApiKeyGate onUnlock={() => setSession(true)} />}</>;
}
