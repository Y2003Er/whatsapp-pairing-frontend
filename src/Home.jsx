import { useState, useEffect } from "react";
import {
  Zap, Shield, Users, Activity, Eye, Download, Sparkles, Type,
  ArrowRight, LayoutDashboard,
} from "lucide-react";
import { BACKEND_URL } from "./config";

/* ── LIVE STATS (reuses the same /health the pairing page already polls) ── */
function useLiveStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const commandCount = String(data.commands || "").match(/\d+/)?.[0] ?? null;
        setStats({
          total: data.bots?.total ?? 0,
          online: data.bots?.online ?? 0,
          commandCount,
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

function StatCard({ icon: Icon, color, value, label }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="stat-card">
      <Icon size={14} style={{ color }} />
      <span>{value} {label}</span>
    </div>
  );
}

export default function Home({ onGoConnect, onGoSettings }) {
  const stats = useLiveStats();

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
      className="flex flex-col items-center px-4 pt-24 pb-14 relative overflow-hidden"
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

        {stats && (
          <div className="hero-stats">
            <StatCard icon={Users} color="#f472b6" value={stats.total} label="Bots Zilizounganishwa" />
            <StatCard icon={Activity} color="#34d399" value={stats.online} label="Ziko Online Sasa" />
            <StatCard icon={Zap} color="#38bdf8" value={stats.commandCount} label="Commands" />
          </div>
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

        .hero-stats { display: flex; justify-content: center; align-items: center; gap: 10px; flex-wrap: wrap; }
        .stat-card { display: flex; align-items: center; gap: 7px; padding: 10px 16px; border-radius: 14px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); color: rgba(255, 255, 255, 0.7); font-size: 0.78rem; font-weight: 500; transition: 0.25s ease; }
        .stat-card:hover { transform: translateY(-3px); background: rgba(240, 171, 252, 0.08); border-color: rgba(240, 171, 252, 0.25); color: white; }

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
