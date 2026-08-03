import { useState, useEffect } from "react";
import {
  Zap, Shield, Users, Activity, Eye, Download, Sparkles, Type,
  ArrowRight, LayoutDashboard, TrendingUp, MessageSquare, Lock, Clock,
} from "lucide-react";
import { BACKEND_URL } from "./config";

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

function Orbs() {
  return (
    <>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </>
  );
}

const FEATURES = [
  {
    icon: Shield,
    color: "#f472b6",
    title: "Anti-Delete",
    desc: "Ujumbe ukifutwa — bado utauona, picha na video pia.",
  },
  {
    icon: Eye,
    color: "#38bdf8",
    title: "Auto Status Viewer",
    desc: "Status za watu zinaonekana kiotomatiki, bila kubofya.",
  },
  {
    icon: Users,
    color: "#a78bfa",
    title: "Group Manager",
    desc: "Kick, promote, anti-link, na welcome messages za kiotomatiki.",
  },
  {
    icon: Download,
    color: "#34d399",
    title: "Media Downloader",
    desc: "Pakua kutoka TikTok, Instagram, na Pinterest moja kwa moja.",
  },
  {
    icon: Sparkles,
    color: "#fbbf24",
    title: "AI Chat Assistant",
    desc: "Uliza maswali kwenye chat, pata majibu papo hapo.",
  },
  {
    icon: Type,
    color: "#fb7185",
    title: "Text & Sticker Maker",
    desc: "Tengeneza stika na maandishi ya kisanaa kwa haraka.",
  },
];

function FeatureCard({ icon: Icon, color, title, desc }) {
  return (
    <div className="home-feature-card fade-up">
      <div className="home-feature-icon" style={{ background: `${color}22`, color }}>
        <Icon size={18} />
      </div>
      <h3 className="home-feature-title">{title}</h3>
      <p className="home-feature-desc">{desc}</p>
    </div>
  );
}

function StatBlock({ icon: Icon, color, value, label }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="stat-block">
      <div className="stat-block-icon" style={{ background: `${color}1a`, color }}>
        <Icon size={16} />
      </div>
      <div className="stat-block-value">{value}</div>
      <div className="stat-block-label">{label}</div>
    </div>
  );
}

export default function Home({ onGoConnect, onGoSettings }) {
  const stats = useLiveStats();
  const history = useGrowthHistory();
  const growthPoints = buildGrowthPoints(history, "totalBotsEver");
  const uptimeLabel = formatUptime(stats?.uptimeSec);

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
      className="flex flex-col items-center px-4 pt-10 pb-14 relative overflow-hidden"
    >
      <Orbs />

      {/* ── HERO ── */}
      <div className="hero-section z-10 fade-up">
        <div className="hero-badge">
          <Activity size={11} />
          <span>26-TECH · Multi-Bot Hosting Platform</span>
        </div>

        <h1 className="hero-title">
          WhatsApp Bot Yenye
          <span className="gradient-text"> Nguvu Zaidi</span>
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
            <StatBlock icon={Users} color="#f472b6" value={stats.total} label="Bots Zilizounganishwa" />
            <StatBlock icon={Activity} color="#34d399" value={stats.online} label="Ziko Online Sasa" />
            <StatBlock icon={Zap} color="#38bdf8" value={stats.commandCount} label="Commands" />
            <StatBlock icon={MessageSquare} color="#fbbf24" value={stats.messagesTotal?.toLocaleString()} label="Messages" />
            <StatBlock icon={TrendingUp} color="#a78bfa" value={stats.botsEverPaired} label="Bots Zote (Wakati Wote)" />
            <StatBlock icon={Clock} color="#7dd3fc" value={uptimeLabel} label="Platform Uptime" />
          </div>
        )}

        <div className="home-growth-divider" />
        <h3 className="home-growth-title home-growth-title-sm">Session Growth</h3>
        <div className="home-growth-chart-placeholder">
          <svg viewBox="0 0 300 80" preserveAspectRatio="none" className="home-growth-svg">
            {growthPoints ? (
              <>
                <polyline points={growthPoints} fill="none" stroke="url(#gline)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="gline" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </>
            ) : null}
          </svg>
          {history !== null && history.length === 0 && (
            <div className="home-growth-overlay">
              <p>Bado hakuna historia ya siku za nyuma — grafu itaanza kujaa kadiri siku zinavyopita.</p>
            </div>
          )}
          {history === null && (
            <div className="home-growth-overlay">
              <p>Inapakia data halisi ya ukuaji...</p>
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
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
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

        .orb { position: absolute; border-radius: 50%; filter: blur(60px); pointer-events: none; animation: orbFloat ease-in-out infinite; }
        .orb-1 { width: 280px; height: 280px; background: radial-gradient(circle, rgba(236,72,153,0.45), transparent 70%); top: -80px; right: -80px; animation-duration: 9s; }
        .orb-2 { width: 220px; height: 220px; background: radial-gradient(circle, rgba(99,102,241,0.4), transparent 70%); bottom: 40px; left: -60px; animation-duration: 12s; animation-delay: 2s; }
        .orb-3 { width: 160px; height: 160px; background: radial-gradient(circle, rgba(6,182,212,0.35), transparent 70%); top: 50%; left: 50%; animation-duration: 7s; animation-delay: 1s; }
        @keyframes orbFloat { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(20px) scale(1.07); } }

        @keyframes fadeUp { 0% { opacity: 0; transform: translateY(-8px); } 100% { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease both; }

        .hero-section { text-align: center; width: 100%; max-width: 420px; margin: 0 auto 30px; overflow: hidden; }
        @media (min-width: 900px) { .hero-section { max-width: 680px; } }

        .hero-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 999px; background: rgba(240, 171, 252, 0.08); border: 1px solid rgba(240, 171, 252, 0.2); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); color: #f0abfc; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 22px; }

        .hero-title { font-size: clamp(2rem, 7vw, 2.8rem); font-weight: 800; color: white; letter-spacing: -0.02em; line-height: 1.15; margin-bottom: 16px; }
        .gradient-text { background: linear-gradient(135deg, #f472b6, #a78bfa, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        .hero-sub { font-family: 'Inter', sans-serif !important; font-weight: 400; max-width: 480px; margin: 0 auto 26px; color: rgba(255,255,255,0.55); font-size: 0.92rem; line-height: 1.7; }

        .home-cta-row { display: flex; flex-direction: column; gap: 10px; align-items: center; margin-bottom: 26px; }
        @media (min-width: 480px) { .home-cta-row { flex-direction: row; justify-content: center; } }

        .premium-btn { padding: 14px 22px; border-radius: 14px; color: white; font-weight: 700; font-size: 0.9rem; font-family: 'Inter', sans-serif !important; letter-spacing: 0.02em; border: none; cursor: pointer; position: relative; overflow: hidden; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%); background-size: 200% 200%; animation: btnShimmer 4s ease infinite, btnGlow 3s ease-in-out infinite; transition: transform 0.15s ease; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .premium-btn:hover { transform: translateY(-2px) scale(1.01); }
        .premium-btn:active { transform: scale(0.97); }
        @keyframes btnShimmer { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes btnGlow { 0%, 100% { box-shadow: 0 4px 24px rgba(236,72,153,0.45); } 50% { box-shadow: 0 4px 32px rgba(139,92,246,0.55); } }

        .home-cta-secondary { padding: 14px 22px; border-radius: 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.16); color: white; font-weight: 600; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s ease; }
        .home-cta-secondary:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.3); }

        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 4px; }
        @media (min-width: 480px) { .stats-grid { grid-template-columns: repeat(3, 1fr); } }
        .stat-block { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 14px; border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); transition: 0.2s ease; }
        .stat-block:hover { background: rgba(255,255,255,0.06); border-color: rgba(240,171,252,0.25); transform: translateY(-2px); }
        .stat-block-icon { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .stat-block-value { font-size: 1.25rem; font-weight: 800; color: white; line-height: 1.1; font-variant-numeric: tabular-nums; word-break: break-word; }
        .stat-block-label { font-size: 0.68rem; color: rgba(255,255,255,0.5); font-weight: 600; letter-spacing: 0.01em; line-height: 1.35; }

        .home-growth-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 20px 0 16px; }
        .home-growth-title-sm { margin-bottom: 12px; }

        .cs-mini-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 999px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); color: rgba(255,255,255,0.55); font-size: 0.62rem; font-weight: 700; letter-spacing: 0.04em; font-family: 'IBM Plex Mono', monospace; }

        .home-growth-card, .home-community-card { width: 100%; max-width: 420px; margin: 0 auto 24px; background: rgba(15,10,40,0.55); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.14); border-radius: 18px; padding: 18px; }
        @media (min-width: 900px) { .home-growth-card, .home-community-card { max-width: 680px; } }
        .home-growth-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .home-growth-title { color: white; font-weight: 800; font-size: 1rem; margin-bottom: 12px; }

        .home-growth-chart-placeholder { position: relative; border-radius: 12px; overflow: hidden; background: rgba(0,0,0,0.2); }
        .home-growth-svg { width: 100%; height: 80px; display: block; filter: blur(1.5px); opacity: 0.55; }
        .home-growth-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 10px 16px; background: rgba(10,8,28,0.5); }
        .home-growth-overlay p { color: rgba(255,255,255,0.65); font-size: 0.74rem; text-align: center; line-height: 1.5; max-width: 300px; }
        .home-growth-caption { margin: 10px 0 0; color: rgba(255,255,255,0.5); font-size: 0.76rem; text-align: center; }

        .home-community-desc { color: rgba(255,255,255,0.5); font-size: 0.8rem; line-height: 1.6; margin-bottom: 14px; }
        .home-community-input-mock { display: flex; gap: 8px; }
        .home-community-input-mock input { flex: 1; min-width: 0; border-radius: 10px; padding: 10px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.4); font-size: 0.82rem; cursor: not-allowed; }
        .home-community-input-mock button { padding: 10px 16px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.35); font-size: 0.8rem; font-weight: 700; cursor: not-allowed; }

        .home-features-section { width: 100%; max-width: 420px; margin: 10px auto 0; }
        @media (min-width: 900px) { .home-features-section { max-width: 900px; } }

        .home-features-header { text-align: center; margin-bottom: 24px; }
        .home-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.12em; color: #7dd3fc; }
        .home-features-title { font-size: clamp(1.4rem, 5vw, 1.9rem); font-weight: 800; color: white; margin: 8px 0 6px; letter-spacing: -0.01em; }
        .home-features-sub { font-size: 0.82rem; color: rgba(255,255,255,0.5); }

        .home-features-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 640px) { .home-features-grid { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 900px) { .home-features-grid { grid-template-columns: 1fr 1fr 1fr; } }

        .home-feature-card { background: rgba(15,10,40,0.55); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.14); border-radius: 18px; padding: 18px; transition: 0.2s ease; }
        .home-feature-card:hover { border-color: rgba(240,171,252,0.3); transform: translateY(-2px); }
        .home-feature-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .home-feature-title { color: white; font-weight: 700; font-size: 0.92rem; margin-bottom: 6px; }
        .home-feature-desc { color: rgba(255,255,255,0.5); font-size: 0.8rem; line-height: 1.6; }

        button:focus-visible { outline: 2px solid #f0abfc; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
