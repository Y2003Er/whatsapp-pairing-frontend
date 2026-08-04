import { useState, useEffect } from "react";
import {
  Zap, Shield, Users, Activity, Eye, Download, Sparkles, Type,
  ArrowRight, LayoutDashboard, TrendingUp, MessageSquare, Lock, Clock,
} from "lucide-react";
import { BACKEND_URL } from "./config";
import { useTheme } from "./theme";
import { Skeleton } from "./UIStates";

/* ── LIVE STATS ── */
// /health still gives us the command count + bots snapshot (used elsewhere),
// but bots-ever-paired / messages processed / uptime now come from the
// real, persistent /stats endpoint (lib/platform-stats.js on the backend) —
// these survive backend restarts, unlike the old in-memory-only numbers.
function useLiveStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [healthRes, statsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(6000) }),
          fetch(`${BACKEND_URL}/stats`, { signal: AbortSignal.timeout(6000) }),
        ]);
        if (cancelled) return;
        const health = healthRes.ok ? await healthRes.json() : null;
        const platform = statsRes.ok ? await statsRes.json() : null;
        if (cancelled || (!health && !platform)) return;

        const commandCount = String(health?.commands || "").match(/\d+/)?.[0] ?? null;
        setStats({
          total: platform?.bots?.total ?? health?.bots?.total ?? 0,
          online: platform?.bots?.online ?? health?.bots?.online ?? 0,
          commandCount,
          botsEverPaired: platform?.botsEverPaired ?? null,
          messagesTotal: platform?.messagesTotal ?? null,
          uptimeSec: platform?.uptimeSec ?? null,
        });
      } catch {
        // Silent — the stat cards just stay hidden until the next poll succeeds.
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return stats;
}

/* ── GROWTH HISTORY (real daily snapshots from /stats/history) ── */
function useGrowthHistory() {
  const [history, setHistory] = useState(null); // null = loading, [] = loaded-but-empty

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/stats/history?days=14`, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setHistory(Array.isArray(data.history) ? data.history : []);
      } catch {
        // Leave as-is — placeholder message stays until a poll succeeds.
      }
    };
    load();
    const interval = setInterval(load, 5 * 60 * 1000); // history changes at most hourly server-side
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return history;
}

/** Formats seconds as "2d 4h" / "4h 12m" / "37m" for the uptime stat card. */
function formatUptime(sec) {
  if (sec == null) return null;
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Builds an SVG polyline (0..300 x, 0..80 y, inverted so higher value = higher on screen) from real daily totals. */
function buildGrowthPoints(history, metric) {
  if (!history || history.length === 0) return null;
  const values = history.map((h) => h[metric] ?? 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = history.length > 1 ? 300 / (history.length - 1) : 0;
  return values
    .map((v, i) => {
      const x = (i * stepX).toFixed(1);
      const y = (75 - ((v - min) / range) * 65).toFixed(1); // 10..75 vertical range, 5px padding top/bottom
      return `${x},${y}`;
    })
    .join(" ");
}

/** The one structural element that changes per theme — grain, scanlines, dot-grid, or blueprint grid. */
function TextureLayer({ texture }) {
  return <div className={`texture-layer texture-${texture}`} aria-hidden="true" />;
}

/** Small L-shaped corner brackets — the Blueprint theme's signature, echoing a technical-drawing frame. */
function CornerMarks() {
  return (
    <>
      <span className="corner-mark corner-tl" />
      <span className="corner-mark corner-tr" />
      <span className="corner-mark corner-bl" />
      <span className="corner-mark corner-br" />
    </>
  );
}

const FEATURES = [
  { icon: Shield, title: "Anti-Delete", desc: "Ujumbe ukifutwa — bado utauona, picha na video pia." },
  { icon: Eye, title: "Auto Status Viewer", desc: "Status za watu zinaonekana kiotomatiki, bila kubofya." },
  { icon: Users, title: "Group Manager", desc: "Kick, promote, anti-link, na welcome messages za kiotomatiki." },
  { icon: Download, title: "Media Downloader", desc: "Pakua kutoka TikTok, Instagram, na Pinterest moja kwa moja." },
  { icon: Sparkles, title: "AI Chat Assistant", desc: "Uliza maswali kwenye chat, pata majibu papo hapo." },
  { icon: Type, title: "Text & Sticker Maker", desc: "Tengeneza stika na maandishi ya kisanaa kwa haraka." },
];

function FeatureCard({ icon: Icon, title, desc, index }) {
  return (
    <div className="home-feature-card fade-up" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="home-feature-icon">
        <Icon size={17} />
      </div>
      <h3 className="home-feature-title">{title}</h3>
      <p className="home-feature-desc">{desc}</p>
    </div>
  );
}

function StatBlock({ icon: Icon, value, label }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="stat-block">
      <div className="stat-block-icon">
        <Icon size={15} />
      </div>
      <div className="stat-block-value">{value}</div>
      <div className="stat-block-label">{label}</div>
    </div>
  );
}

export default function Home({ onGoConnect, onGoSettings }) {
  const { theme } = useTheme();
  const stats = useLiveStats();
  const history = useGrowthHistory();
  const growthPoints = buildGrowthPoints(history, "totalBotsEver");
  const uptimeLabel = formatUptime(stats?.uptimeSec);

  return (
    <div
      style={{ background: "transparent" }}
      className="flex flex-col items-center px-4 pt-10 pb-14 relative overflow-hidden home-root"
    >
      <TextureLayer texture={theme.texture} />

      {/* ── HERO ── */}
      <div className="hero-section z-10 fade-up">
        {theme.cornerMarks && <CornerMarks />}

        <div className="hero-top-row">
          <div className="hero-badge">
            <Activity size={11} />
            <span>26-TECH · Multi-Bot Hosting Platform</span>
          </div>
        </div>

        <h1 className="hero-title">
          WhatsApp Bot Yenye
          <span className="emphasis"> Nguvu Zaidi</span>
          <br />
          Kwa Kila Mtu
        </h1>

        <p className="hero-sub">
          Unganisha namba yako ya WhatsApp, pata bot yenye vipengele
          zaidi ya 100 — bila kuandika code hata mstari mmoja.
        </p>

        <div className="home-cta-row">
          <button className="premium-btn home-cta-primary" onClick={onGoConnect} type="button">
            Unganisha Bot Yako <ArrowRight size={16} />
          </button>
          <button className="home-cta-secondary" onClick={onGoSettings} type="button">
            <LayoutDashboard size={15} /> Fungua Settings
          </button>
        </div>
      </div>

      {/* ── LIVE PLATFORM STATS + SESSION GROWTH (real: /stats, /stats/history) ── */}
      <div className="home-growth-card z-10 fade-up">
        <div className="home-growth-header">
          <span className="home-eyebrow"><Activity size={11} style={{ display: "inline", marginRight: 5 }} />LIVE STATS</span>
          {(!stats || history === null) && <span className="cs-mini-badge">Inapakia...</span>}
        </div>
        <h3 className="home-growth-title">Takwimu za Sasa</h3>

        {stats && (
          <div className="stats-grid">
            <StatBlock icon={Users} value={stats.total} label="Bots Zilizounganishwa" />
            <StatBlock icon={Activity} value={stats.online} label="Ziko Online Sasa" />
            <StatBlock icon={Zap} value={stats.commandCount} label="Commands" />
            <StatBlock icon={MessageSquare} value={stats.messagesTotal?.toLocaleString()} label="Messages" />
            <StatBlock icon={TrendingUp} value={stats.botsEverPaired} label="Bots Zote (Wakati Wote)" />
            <StatBlock icon={Clock} value={uptimeLabel} label="Platform Uptime" />
          </div>
        )}
        {!stats && <div className="stats-grid" aria-label="Loading live statistics" role="status">{Array.from({ length: 6 }, (_, index) => <div className="stat-block" key={index}><Skeleton style={{ width: 28, minHeight: 28 }} /><Skeleton style={{ width: "55%", minHeight: "1.3rem" }} /><Skeleton style={{ width: "82%" }} /></div>)}</div>}

        <div className="home-growth-divider" />
        <h3 className="home-growth-title home-growth-title-sm">Session Growth</h3>
        <div className="home-growth-chart-placeholder">
          <svg viewBox="0 0 300 80" preserveAspectRatio="none" className="home-growth-svg">
            {growthPoints ? (
              <polyline points={growthPoints} fill="none" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            ) : null}
          </svg>
          {history !== null && history.length === 0 && (
            <div className="home-growth-overlay">
              <p>Bado hakuna historia ya siku za nyuma — grafu itaanza kujaa kadiri siku zinavyopita.</p>
            </div>
          )}
          {history === null && (
            <div className="home-growth-overlay">
              <Skeleton style={{ width: "72%", minHeight: "1rem" }} />
            </div>
          )}
        </div>
        {history && history.length > 0 && (
          <p className="home-growth-caption">
            Bots {history[history.length - 1].totalBotsEver} zote wakati wote · siku {history.length} za nyuma
          </p>
        )}
      </div>

      {/* ── FEATURES ── */}
      <div className="home-features-section z-10">
        <div className="home-features-header fade-up">
          <span className="home-eyebrow">// VIPENGELE</span>
          <h2 className="home-features-title">Kwa Nini 26-TECH Bot?</h2>
          <p className="home-features-sub">Imejengwa kwa ajili ya watumiaji halisi — kila kitu unachohitaji.</p>
        </div>

        <div className="home-features-grid">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </div>
      </div>

      {/* ── COMMUNITY (placeholder — no comments backend yet) ── */}
      <div className="home-community-card z-10 fade-up">
        <div className="home-growth-header">
          <span className="home-eyebrow"><MessageSquare size={11} style={{ display: "inline", marginRight: 5 }} />COMMUNITY</span>
          <span className="cs-mini-badge"><Lock size={10} /> Inakuja Karibuni</span>
        </div>
        <h3 className="home-growth-title">Majadiliano</h3>
        <p className="home-community-desc">Achana na maoni yako, uliza maswali, na wasiliana na watumiaji wengine wa 26-TECH Bot — kipengele hiki kinakuja hivi karibuni.</p>
        <div className="home-community-input-mock">
          <input disabled placeholder="Ingia kwanza ili kuandika maoni..." />
          <button disabled type="button">Tuma</button>
        </div>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        .home-root { min-height: 100dvh; font-family: 'Inter', sans-serif; color: var(--token-text); }

        /* ── background textures: this is what actually separates the themes ── */
        .texture-layer { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .texture-grain { opacity: 0.5; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/></svg>"); mix-blend-mode: overlay; }
        .texture-scanline { background-image: repeating-linear-gradient(0deg, ${theme.accent}14 0px, ${theme.accent}14 1px, transparent 1px, transparent 3px); animation: scan 9s linear infinite; }
        @keyframes scan { 0% { background-position: 0 0; } 100% { background-position: 0 120px; } }
        .texture-dots { background-image: radial-gradient(${theme.text}22 1px, transparent 1.4px); background-size: 18px 18px; }
        .texture-grid { background-image: linear-gradient(${theme.accent}14 1px, transparent 1px), linear-gradient(90deg, ${theme.accent}14 1px, transparent 1px), linear-gradient(${theme.accent}09 1px, transparent 1px), linear-gradient(90deg, ${theme.accent}09 1px, transparent 1px); background-size: 96px 96px, 96px 96px, 16px 16px, 16px 16px; }

        .corner-mark { position: absolute; width: 18px; height: 18px; border: 2px solid ${theme.accent}; opacity: 0.7; }
        .corner-tl { top: -10px; left: -10px; border-right: none; border-bottom: none; }
        .corner-tr { top: -10px; right: -10px; border-left: none; border-bottom: none; }
        .corner-bl { bottom: -10px; left: -10px; border-right: none; border-top: none; }
        .corner-br { bottom: -10px; right: -10px; border-left: none; border-top: none; }

        @keyframes fadeUp { 0% { opacity: 0; transform: translateY(-8px); } 100% { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease both; }

        .hero-section { position: relative; text-align: center; width: 100%; max-width: 440px; margin: 0 auto 30px; }
        @media (min-width: 900px) { .hero-section { max-width: 700px; } }

        .hero-top-row { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; margin-bottom: 22px; }

        .hero-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: var(--token-radius); background: var(--token-info-bg); border: 1px solid var(--token-info-border); color: var(--token-text); font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }

        .hero-title { font-family: ${theme.headlineFont}; font-weight: ${theme.headlineWeight}; font-style: ${theme.headlineStyle}; font-size: clamp(2rem, 6.5vw, 2.9rem); letter-spacing: -0.01em; line-height: 1.18; margin-bottom: 16px; color: var(--token-heading); }
        .emphasis { color: ${theme.emphasisMode === "underline" ? "var(--token-heading)" : "var(--token-link)"}; ${theme.emphasisMode === "underline" ? "text-decoration: underline; text-decoration-color: var(--token-link); text-decoration-thickness: 3px; text-underline-offset: 6px;" : ""} }

        .hero-sub { font-family: 'Inter', sans-serif; font-weight: 400; max-width: 480px; margin: 0 auto 26px; color: var(--token-text-secondary); font-size: 0.94rem; line-height: 1.7; }

        .home-cta-row { display: flex; flex-direction: column; gap: 10px; align-items: center; margin-bottom: 4px; }
        @media (min-width: 480px) { .home-cta-row { flex-direction: row; justify-content: center; } }

        .premium-btn { padding: 14px 22px; border-radius: var(--token-radius); color: var(--token-button-text); font-weight: 700; font-size: 0.9rem; font-family: 'Inter', sans-serif; letter-spacing: 0.01em; border: none; cursor: pointer; background: var(--token-accent-fill); box-shadow: 0 4px 20px var(--token-glow); transition: transform 0.15s ease, box-shadow 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .premium-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 26px var(--token-glow-strong); }
        .premium-btn:active { transform: scale(0.97); }

        .home-cta-secondary { padding: 14px 22px; border-radius: var(--token-radius); background: var(--token-surface); border: 1px solid var(--token-border); color: var(--token-text); font-weight: 600; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s ease; }
        .home-cta-secondary:hover { background: var(--token-surface-strong); border-color: var(--token-border-strong); }

        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 4px; }
        @media (min-width: 480px) { .stats-grid { grid-template-columns: repeat(3, 1fr); } }
        .stat-block { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 14px; border-radius: var(--token-radius); background: var(--token-surface); border: 1px solid var(--token-border); transition: 0.2s ease; }
        .stat-block:hover { background: var(--token-surface-strong); border-color: var(--token-border-strong); transform: translateY(-2px); }
        .stat-block-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: var(--token-surface-strong); color: var(--token-link); }
        .stat-block-value { font-size: 1.22rem; font-weight: 800; color: var(--token-text); line-height: 1.1; font-variant-numeric: tabular-nums; word-break: break-word; }
        .stat-block-label { font-size: 0.67rem; color: var(--token-text-secondary); font-weight: 600; letter-spacing: 0.01em; line-height: 1.35; }

        .home-growth-divider { height: 1px; background: var(--token-border); margin: 20px 0 16px; }
        .home-growth-title-sm { margin-bottom: 12px; }

        .cs-mini-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 999px; background: var(--token-surface-strong); border: 1px solid var(--token-border); color: var(--token-text-secondary); font-size: 0.62rem; font-weight: 700; letter-spacing: 0.03em; font-family: 'IBM Plex Mono', monospace; }

        .home-growth-card, .home-community-card { position: relative; width: 100%; max-width: 440px; margin: 0 auto 24px; background: var(--token-surface); border: 1px solid var(--token-border); border-radius: var(--token-radius); box-shadow: var(--token-shadow); padding: 18px; }
        @media (min-width: 900px) { .home-growth-card, .home-community-card { max-width: 700px; } }
        .home-growth-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .home-growth-title { color: var(--token-heading); font-weight: 800; font-size: 1rem; margin-bottom: 12px; }

        .home-growth-chart-placeholder { position: relative; border-radius: 6px; overflow: hidden; background: var(--token-card-strong); }
        .home-growth-svg { width: 100%; height: 80px; display: block; opacity: 0.9; }
        .home-growth-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 10px 16px; background: var(--token-card); }
        .home-growth-overlay p { color: var(--token-text-secondary); font-size: 0.74rem; text-align: center; line-height: 1.5; max-width: 300px; }
        .home-growth-caption { margin: 10px 0 0; color: var(--token-text-secondary); font-size: 0.76rem; text-align: center; }

        .home-community-desc { color: var(--token-text-secondary); font-size: 0.8rem; line-height: 1.6; margin-bottom: 14px; }
        .home-community-input-mock { display: flex; gap: 8px; }
        .home-community-input-mock input { flex: 1; min-width: 0; border-radius: 8px; padding: 10px 12px; background: var(--token-surface-strong); border: 1px solid var(--token-border); color: var(--token-text-muted); font-size: 0.82rem; cursor: not-allowed; }
        .home-community-input-mock button { padding: 10px 16px; border-radius: 8px; background: var(--token-surface-strong); border: 1px solid var(--token-border); color: var(--token-text-muted); font-size: 0.8rem; font-weight: 700; cursor: not-allowed; }

        .home-features-section { width: 100%; max-width: 440px; margin: 10px auto 0; }
        @media (min-width: 900px) { .home-features-section { max-width: 940px; } }

        .home-features-header { text-align: center; margin-bottom: 24px; }
        .home-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.1em; color: ${theme.eyebrow}; }
        .home-features-title { font-family: ${theme.headlineFont}; font-size: clamp(1.4rem, 5vw, 1.9rem); font-weight: ${theme.headlineWeight}; color: var(--token-heading); margin: 10px 0 6px; letter-spacing: -0.01em; }
        .home-features-sub { font-size: 0.82rem; color: var(--token-text-secondary); }

        .home-features-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 640px) { .home-features-grid { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 900px) { .home-features-grid { grid-template-columns: 1fr 1fr 1fr; } }

        .home-feature-card { background: var(--token-surface); border: 1px solid var(--token-border); border-radius: var(--token-radius); box-shadow: var(--token-shadow); padding: 18px; transition: 0.2s ease; }
        .home-feature-card:hover { border-color: var(--token-border-strong); transform: translateY(-2px); }
        .home-feature-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; background: var(--token-surface-strong); color: var(--token-link); }
        .home-feature-title { color: var(--token-heading); font-weight: 700; font-size: 0.92rem; margin-bottom: 6px; }
        .home-feature-desc { color: var(--token-text-secondary); font-size: 0.8rem; line-height: 1.6; }

        button:focus-visible { outline: 2px solid var(--token-focus); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
