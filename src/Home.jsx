import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity, ArrowRight, Bot, Check, ChevronRight, Cloud, Code2, Cpu, Eye,
  Gauge, LayoutDashboard, LockKeyhole, MessageCircle, MonitorSmartphone,
  ShieldCheck, Sparkles, Timer, Users, WandSparkles, Wifi, Zap,
} from "lucide-react";
import { BACKEND_URL } from "./config";

function useLiveStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [healthResponse, statsResponse] = await Promise.all([
          fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(6000) }),
          fetch(`${BACKEND_URL}/stats`, { signal: AbortSignal.timeout(6000) }),
        ]);
        const health = healthResponse.ok ? await healthResponse.json() : null;
        const platform = statsResponse.ok ? await statsResponse.json() : null;
        if (cancelled || (!health && !platform)) return;
        setStats({
          total: platform?.bots?.total ?? health?.bots?.total ?? 0,
          online: platform?.bots?.online ?? health?.bots?.online ?? 0,
          commands: String(health?.commands || "").match(/\d+/)?.[0] ?? 0,
          messages: platform?.messagesTotal ?? null,
          paired: platform?.botsEverPaired ?? null,
          uptime: platform?.uptimeSec ?? null,
        });
      } catch { /* Live data is progressive enhancement. */ }
    };
    load();
    const interval = window.setInterval(load, 30000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, []);
  return stats;
}

function formatUptime(seconds) {
  if (seconds == null) return "—";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return days ? `${days}d ${hours}h` : `${hours}h`;
}

const features = [
  [Bot, "WhatsApp Pairing", "Connect a number in seconds with a guided, secure flow.", "Connect bot", "connect"],
  [Cloud, "24/7 Hosting", "Reliable cloud sessions that keep working while you rest.", "Open workspace", "settings"],
  [Eye, "Anti Delete", "Keep important messages available when they disappear.", "View controls", "settings"],
  [LockKeyhole, "View Once", "A polished toolkit for your private media workflows.", "Open workspace", "settings"],
  [WandSparkles, "AI Automation", "Build smarter responses with less repetitive work.", "View controls", "settings"],
  [LayoutDashboard, "Owner Controls", "Manage your bot, groups, and access from one place.", "Open settings", "settings"],
  [Sparkles, "Premium Themes", "A considered interface that adapts to your preferred style.", "Open appearance", "appearance"],
  [MonitorSmartphone, "Multi Device", "A responsive workspace that feels native on every screen.", "View dashboard", "showcase"],
];

const experience = [
  [Zap, "Lightning fast", "Built for a responsive, no-friction daily workflow."],
  [ShieldCheck, "Highly secure", "Thoughtful controls around every important action."],
  [Wifi, "Always online", "Reliable sessions backed by cloud infrastructure."],
  [Cpu, "Easy to manage", "Clear controls made for owners, not engineers."],
];

const reveal = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

function Section({ children, className = "" }) {
  const reduced = useReducedMotion();
  return <motion.section className={`home-section ${className}`} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.16 }} variants={reduced ? undefined : reveal} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.section>;
}

function LiveMetric({ icon: Icon, label, value, accent }) {
  return <div className="live-metric"><span className="live-metric-icon" style={{ color: accent }}><Icon size={16} /></span><span className="live-metric-value">{value ?? "—"}</span><span className="live-metric-label">{label}</span></div>;
}

function DashboardPreview({ stats }) {
  return <div className="product-preview" aria-label="26-TECH Bot dashboard preview">
    <div className="preview-topbar"><span className="preview-orb">26</span><span>Workspace</span><span className="preview-live"><i /> LIVE</span></div>
    <div className="preview-layout">
      <aside><span className="active" /><span /><span /><span /></aside>
      <div className="preview-content">
        <div className="preview-heading"><div><small>OVERVIEW</small><strong>Good evening, owner.</strong></div><span className="preview-add-label">Add bot <b>+</b></span></div>
        <div className="preview-kpis"><PreviewKpi label="Active bots" value={stats?.online ?? "05"} /><PreviewKpi label="Messages" value={stats?.messages?.toLocaleString() ?? "5.3k"} /><PreviewKpi label="Uptime" value={formatUptime(stats?.uptime) === "—" ? "99.9%" : formatUptime(stats?.uptime)} /></div>
        <div className="preview-chart"><div className="chart-title"><span>Session activity</span><em>Last 7 days</em></div><svg viewBox="0 0 460 120" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="home-chart-gradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--token-primary)" stopOpacity=".32" /><stop offset="1" stopColor="var(--token-primary)" stopOpacity="0" /></linearGradient></defs><path d="M0 102 C36 92 46 104 78 83 S132 72 164 82 S216 35 252 57 S310 64 345 35 S402 47 460 14 L460 120 L0 120Z" fill="url(#home-chart-gradient)" /><path d="M0 102 C36 92 46 104 78 83 S132 72 164 82 S216 35 252 57 S310 64 345 35 S402 47 460 14" fill="none" stroke="var(--token-primary)" strokeWidth="3" /></svg></div>
      </div>
    </div>
    <span className="preview-callout callout-one"><Check size={13} /> Session protected</span>
    <span className="preview-callout callout-two"><Activity size={13} /> Real-time activity</span>
  </div>;
}

function PreviewKpi({ label, value }) { return <div><small>{label}</small><strong>{value}</strong><span /></div>; }

export default function Home({ onGoConnect, onGoSettings }) {
  const stats = useLiveStats();
  const reduced = useReducedMotion();
  const messages = stats?.messages?.toLocaleString() ?? "—";
  const metricCards = [
    [Bot, "Bots hosted", stats?.total ?? "—"],
    [MessageCircle, "Messages processed", messages],
    [Activity, "Active sessions", stats?.online ?? "—"],
    [Timer, "Platform uptime", formatUptime(stats?.uptime)],
  ];
  const handleFeatureAction = (action) => {
    if (action === "connect") { onGoConnect(); return; }
    if (action === "settings") { onGoSettings(); return; }
    if (action === "appearance") { window.dispatchEvent(new Event("26tech:open-appearance")); return; }
    document.getElementById("product-showcase")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return <main className="home-root" aria-label="26-TECH Bot home">
    <div className="home-aura home-aura-one" aria-hidden="true" /><div className="home-aura home-aura-two" aria-hidden="true" />
    <Section className="home-hero">
      <div className="hero-copy">
        <span className="home-kicker"><span className="kicker-dot" /> A calmer way to run WhatsApp</span>
        <h1>Operate your WhatsApp bot like a <em>premium product.</em></h1>
        <p>Connect, automate, and manage your bot from one focused workspace designed to feel effortless every day.</p>
        <div className="hero-actions">
          <button className="home-primary-action" type="button" onClick={onGoConnect}>Connect your bot <ArrowRight size={17} /></button>
          <button className="home-secondary-action" type="button" onClick={onGoSettings}><LayoutDashboard size={16} /> Open workspace</button>
        </div>
        <div className="hero-proof"><span><Check size={14} /> No code required</span><span><Check size={14} /> Secure pairing</span><span><Check size={14} /> Built for mobile</span></div>
      </div>
      <motion.div className="hero-preview-wrap" initial={reduced ? false : { opacity: 0, y: 26, rotate: 1.5 }} animate={reduced ? undefined : { opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.15, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}><DashboardPreview stats={stats} /></motion.div>
    </Section>

    <Section className="trusted-section">
      <div className="section-intro compact"><span className="home-kicker">LIVE PLATFORM</span><h2>Made for reliable everyday momentum.</h2></div>
      <div className="live-metrics">{metricCards.map(([Icon, label, value]) => <LiveMetric key={label} icon={Icon} label={label} value={value} accent="var(--token-primary)" />)}</div>
    </Section>

    <Section>
      <div className="section-intro"><span className="home-kicker">CORE CAPABILITIES</span><h2>Everything your bot needs. Nothing it doesn’t.</h2><p>Purposeful tools for pairing, protection, automation, and ownership—brought together in one refined experience.</p></div>
      <div className="feature-grid">{features.map(([Icon, title, description, actionLabel, action], index) => <motion.article className="feature-card" key={title} whileHover={reduced ? undefined : { y: -5 }} transition={{ duration: 0.2 }}><span className="feature-icon"><Icon size={19} /></span><span className="feature-number">0{index + 1}</span><h3>{title}</h3><p>{description}</p><button className="feature-link" type="button" onClick={() => handleFeatureAction(action)}>{actionLabel} <ChevronRight size={15} /></button></motion.article>)}</div>
    </Section>

    <Section className="showcase-section" id="product-showcase">
      <div className="showcase-copy"><span className="home-kicker">ONE COMMAND CENTER</span><h2>See what matters. Act without the noise.</h2><p>From live session health to group controls, every important decision has a clear and useful place.</p><ul>{["Live bot and session status", "Secure owner-only controls", "Clear activity and growth signals"].map((item) => <li key={item}><Check size={16} />{item}</li>)}</ul><button className="text-action" type="button" onClick={onGoSettings}>View owner settings <ArrowRight size={15} /></button></div>
      <DashboardPreview stats={stats} />
    </Section>

    <Section className="choice-section">
      <div className="section-intro"><span className="home-kicker">WHY 26-TECH BOT</span><h2>Built with the details other platforms overlook.</h2></div>
      <div className="choice-grid"><article className="choice-card standout"><small>26-TECH BOT</small><h3>A workspace that respects your attention.</h3><p>Clear information, dependable controls, and a premium experience from first connection onward.</p><span><Check size={15} /> Designed around real operators</span><span><Check size={15} /> Everything in one calm place</span></article><article className="choice-card"><small>THE DIFFERENCE</small><div className="comparison-row"><span>Setup</span><strong>Guided pairing</strong></div><div className="comparison-row"><span>Control</span><strong>Owner-first tools</strong></div><div className="comparison-row"><span>Experience</span><strong>Focused and polished</strong></div><div className="comparison-row"><span>Availability</span><strong>Cloud-backed sessions</strong></div></article></div>
    </Section>

    <Section className="experience-section">
      <div className="section-intro compact"><span className="home-kicker">PREMIUM BY DEFAULT</span><h2>Quiet confidence, built in.</h2></div>
      <div className="experience-grid">{experience.map(([Icon, title, description]) => <article key={title}><Icon size={21} /><div><h3>{title}</h3><p>{description}</p></div></article>)}</div>
    </Section>

    <Section className="cta-section"><span className="home-kicker">START IN MINUTES</span><h2>Your bot deserves a better home.</h2><p>Connect your WhatsApp account and experience a cleaner way to manage what matters.</p><button className="home-primary-action" type="button" onClick={onGoConnect}>Get started now <ArrowRight size={17} /></button></Section>

    <style>{`
      .home-root { position: relative; isolation: isolate; width: 100%; overflow: clip; padding: clamp(34px, 6vw, 84px) clamp(16px, 4vw, 46px) 96px; color: var(--token-text); font-family: var(--font-body); }
      .home-root::before { content: ""; position: absolute; z-index: -1; inset: 0; background: linear-gradient(180deg, color-mix(in srgb, var(--token-background) 18%, transparent), transparent 28%, color-mix(in srgb, var(--token-background) 16%, transparent)); pointer-events: none; }
      .home-aura { position: absolute; z-index: -1; width: min(58vw, 760px); aspect-ratio: 1; border-radius: 50%; filter: blur(70px); pointer-events: none; opacity: .22; background: var(--token-primary); }
      .home-aura-one { top: 3%; right: -20%; }.home-aura-two { top: 48%; left: -32%; background: var(--token-secondary); opacity: .13; }
      .home-section { position: relative; width: min(1160px, 100%); margin: 0 auto clamp(96px, 13vw, 168px); }
      .home-hero { display: grid; grid-template-columns: minmax(0, .93fr) minmax(0, 1.07fr); align-items: center; gap: clamp(40px, 7vw, 88px); min-height: min(720px, calc(100dvh - 120px)); }
      .home-kicker { display: inline-flex; align-items: center; gap: 8px; color: var(--token-primary); font-family: var(--font-mono); font-size: .68rem; font-weight: 700; letter-spacing: .12em; }
      .kicker-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 5px var(--token-info-bg); }
      .hero-copy h1, .section-intro h2, .showcase-copy h2, .cta-section h2 { margin: 17px 0 20px; color: var(--token-heading); font-family: var(--font-display); font-size: clamp(2.65rem, 5.35vw, 5.1rem); font-weight: 600; letter-spacing: -.055em; line-height: .98; }
      .hero-copy h1 em { color: var(--token-primary); font-style: italic; font-weight: 500; }.hero-copy > p { max-width: 33rem; margin: 0; color: var(--token-muted); font-size: 1.02rem; line-height: 1.75; }
      .hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 31px; }.home-primary-action, .home-secondary-action { display: inline-flex; align-items: center; justify-content: center; gap: 9px; min-height: 49px; padding: 0 19px; border-radius: 13px; font-family: var(--font-body); font-size: .86rem; font-weight: 750; transition: transform .2s ease, box-shadow .2s ease, background .2s ease; }
      .home-primary-action { border: 1px solid transparent; background: var(--token-accent-fill); box-shadow: 0 14px 30px var(--token-glow); color: var(--token-on-accent); }.home-primary-action:hover { transform: translateY(-2px); box-shadow: 0 20px 38px var(--token-glow-strong); }.home-secondary-action { border: 1px solid var(--token-border); background: color-mix(in srgb, var(--token-card) 76%, transparent); color: var(--token-text); }.home-secondary-action:hover { transform: translateY(-2px); border-color: var(--token-border-strong); background: var(--token-hover); }
      .hero-proof { display: flex; flex-wrap: wrap; gap: 13px 18px; margin-top: 25px; color: var(--token-muted); font-size: .74rem; }.hero-proof span { display: inline-flex; align-items: center; gap: 5px; }.hero-proof svg { color: var(--token-success); }
      .hero-preview-wrap { min-width: 0; }.product-preview { position: relative; overflow: visible; border: 1px solid color-mix(in srgb, var(--token-border-strong) 70%, transparent); border-radius: 21px; background: color-mix(in srgb, var(--token-card) 87%, transparent); box-shadow: 0 34px 80px var(--token-shadow), inset 0 1px 0 color-mix(in srgb, var(--token-text) 12%, transparent); backdrop-filter: blur(24px) saturate(125%); }
      .preview-topbar { display: flex; align-items: center; gap: 9px; height: 52px; padding: 0 17px; border-bottom: 1px solid var(--token-border); color: var(--token-muted); font-size: .73rem; font-weight: 700; }.preview-orb { display: grid; width: 25px; height: 25px; place-items: center; border-radius: 8px; background: var(--token-accent-fill); color: var(--token-on-accent); font-family: var(--font-mono); font-size: .61rem; }.preview-live { display: inline-flex; align-items: center; gap: 5px; margin-left: auto; color: var(--token-success); font-family: var(--font-mono); font-size: .59rem; }.preview-live i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; box-shadow: 0 0 7px currentColor; }
      .preview-layout { display: grid; grid-template-columns: 54px minmax(0, 1fr); min-height: 350px; }.preview-layout aside { display: grid; align-content: start; justify-items: center; gap: 20px; padding-top: 25px; border-right: 1px solid var(--token-border); }.preview-layout aside span { width: 17px; height: 17px; border: 1px solid var(--token-border-strong); border-radius: 5px; opacity: .55; }.preview-layout aside .active { border-color: var(--token-primary); background: var(--token-active); opacity: 1; }
      .preview-content { padding: clamp(17px, 3vw, 28px); }.preview-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }.preview-heading small, .preview-kpis small { display: block; color: var(--token-muted); font-family: var(--font-mono); font-size: .55rem; letter-spacing: .08em; }.preview-heading strong { display: block; margin-top: 6px; color: var(--token-heading); font-family: var(--font-display); font-size: clamp(1.05rem, 2vw, 1.45rem); font-weight: 600; }.preview-heading button { padding: 7px 9px; border: 1px solid var(--token-border); border-radius: 8px; background: var(--token-surface); color: var(--token-text); font-family: var(--font-body); font-size: .59rem; }.preview-heading button span { color: var(--token-primary); font-size: .85rem; }
      .preview-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; margin: 23px 0 17px; }.preview-kpis > div { padding: 10px; border: 1px solid var(--token-border); border-radius: 9px; background: color-mix(in srgb, var(--token-surface) 78%, transparent); }.preview-kpis strong { display: block; margin-top: 7px; color: var(--token-text); font-family: var(--font-mono); font-size: .88rem; }.preview-kpis span { display: block; width: 42%; height: 3px; margin-top: 10px; border-radius: 3px; background: var(--token-primary); opacity: .6; }
      .preview-chart { padding: 13px; border: 1px solid var(--token-border); border-radius: 11px; background: color-mix(in srgb, var(--token-surface) 70%, transparent); }.chart-title { display: flex; justify-content: space-between; color: var(--token-text); font-size: .65rem; font-weight: 700; }.chart-title em { color: var(--token-muted); font-family: var(--font-mono); font-size: .53rem; font-style: normal; }.preview-chart svg { display: block; width: 100%; height: 125px; margin-top: 11px; }
      .preview-callout { position: absolute; display: inline-flex; align-items: center; gap: 6px; padding: 8px 10px; border: 1px solid var(--token-border-strong); border-radius: 9px; background: color-mix(in srgb, var(--token-card) 94%, transparent); box-shadow: var(--token-shadow); color: var(--token-text); font-family: var(--font-mono); font-size: .59rem; backdrop-filter: blur(12px); }.preview-callout svg { color: var(--token-success); }.callout-one { top: 26%; right: -18px; }.callout-two { bottom: 16%; left: -25px; }
      .section-intro { max-width: 660px; margin-bottom: 38px; }.section-intro.compact { max-width: 510px; }.section-intro h2, .showcase-copy h2, .cta-section h2 { font-size: clamp(2rem, 4vw, 3.55rem); line-height: 1.02; }.section-intro p, .showcase-copy > p { max-width: 39rem; margin: 0; color: var(--token-muted); font-size: .94rem; line-height: 1.72; }
      .trusted-section { padding: clamp(25px, 5vw, 50px); border: 1px solid var(--token-border); border-radius: 20px; background: color-mix(in srgb, var(--token-card) 65%, transparent); box-shadow: var(--token-shadow); backdrop-filter: blur(16px); }.trusted-section .section-intro { margin-bottom: 28px; }.live-metrics { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--token-border); border-left: 1px solid var(--token-border); }.live-metric { min-width: 0; padding: 18px; border-right: 1px solid var(--token-border); border-bottom: 1px solid var(--token-border); }.live-metric-icon { display: grid; width: 31px; height: 31px; place-items: center; border-radius: 9px; background: var(--token-active); }.live-metric-value { display: block; margin-top: 17px; color: var(--token-text); font-family: var(--font-mono); font-size: clamp(1rem, 2.2vw, 1.55rem); font-weight: 600; }.live-metric-label { display: block; margin-top: 5px; color: var(--token-muted); font-size: .67rem; font-weight: 650; }
      .feature-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }.feature-card { position: relative; min-height: 224px; overflow: hidden; padding: 23px; border: 1px solid var(--token-border); border-radius: 16px; background: color-mix(in srgb, var(--token-card) 77%, transparent); box-shadow: 0 12px 30px color-mix(in srgb, var(--token-shadow) 62%, transparent); backdrop-filter: blur(17px); }.feature-card:hover { border-color: var(--token-border-strong); box-shadow: var(--token-shadow); }.feature-icon { display: grid; width: 39px; height: 39px; place-items: center; border-radius: 11px; background: var(--token-active); color: var(--token-primary); }.feature-number { position: absolute; top: 23px; right: 20px; color: var(--token-muted); font-family: var(--font-mono); font-size: .61rem; opacity: .6; }.feature-card h3, .experience-grid h3, .choice-card h3 { margin: 22px 0 8px; color: var(--token-heading); font-family: var(--font-display); font-size: 1.15rem; font-weight: 600; }.feature-card p, .experience-grid p, .choice-card p { margin: 0; color: var(--token-muted); font-size: .78rem; line-height: 1.62; }.feature-link { position: absolute; bottom: 19px; display: inline-flex; align-items: center; gap: 3px; color: var(--token-primary); font-size: .68rem; font-weight: 750; }
      .showcase-section { display: grid; grid-template-columns: minmax(0, .76fr) minmax(0, 1.24fr); align-items: center; gap: clamp(35px, 7vw, 93px); }.showcase-copy ul { display: grid; gap: 12px; margin: 27px 0; padding: 0; list-style: none; }.showcase-copy li { display: flex; align-items: center; gap: 9px; color: var(--token-text); font-size: .83rem; font-weight: 650; }.showcase-copy li svg { color: var(--token-success); }.text-action { display: inline-flex; align-items: center; gap: 7px; padding: 0; border: 0; background: transparent; color: var(--token-primary); font-family: var(--font-body); font-size: .82rem; font-weight: 750; }
      .choice-grid { display: grid; grid-template-columns: 1.08fr .92fr; gap: 14px; }.choice-card { display: flex; flex-direction: column; min-height: 285px; padding: clamp(25px, 4vw, 39px); border: 1px solid var(--token-border); border-radius: 18px; background: color-mix(in srgb, var(--token-card) 79%, transparent); backdrop-filter: blur(17px); }.choice-card.standout { border-color: var(--token-border-strong); background: linear-gradient(135deg, color-mix(in srgb, var(--token-active) 68%, transparent), color-mix(in srgb, var(--token-card) 88%, transparent)); }.choice-card small { color: var(--token-primary); font-family: var(--font-mono); font-size: .61rem; font-weight: 700; letter-spacing: .11em; }.choice-card h3 { max-width: 27rem; margin-top: 19px; font-size: clamp(1.45rem, 3vw, 2rem); }.choice-card span { display: inline-flex; align-items: center; gap: 7px; margin-top: 13px; color: var(--token-text); font-size: .72rem; font-weight: 650; }.choice-card span svg { color: var(--token-success); }.comparison-row { display: flex; justify-content: space-between; gap: 15px; padding: 15px 0; border-bottom: 1px solid var(--token-border); color: var(--token-muted); font-size: .76rem; }.comparison-row strong { color: var(--token-text); font-weight: 700; text-align: right; }
      .experience-section { padding: clamp(28px, 5vw, 56px); border: 1px solid var(--token-border); border-radius: 21px; background: color-mix(in srgb, var(--token-surface) 56%, transparent); }.experience-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }.experience-grid article { display: grid; grid-template-columns: 33px 1fr; gap: 12px; }.experience-grid article > svg { color: var(--token-primary); }.experience-grid h3 { margin: 0 0 5px; font-size: 1rem; }
      .cta-section { display: grid; justify-items: center; max-width: 800px; padding: clamp(45px, 8vw, 85px) 20px; margin-bottom: 0; text-align: center; }.cta-section h2 { max-width: 670px; margin-bottom: 15px; }.cta-section p { max-width: 500px; margin: 0 0 27px; color: var(--token-muted); font-size: .94rem; line-height: 1.7; }
      .preview-add-label { padding: 7px 9px; border: 1px solid var(--token-border); border-radius: 8px; background: var(--token-surface); color: var(--token-text); font-family: var(--font-body); font-size: .59rem; }.preview-add-label b { color: var(--token-primary); font-size: .85rem; }.feature-link { padding: 0; border: 0; background: transparent; font-family: var(--font-body); }.feature-link:hover { color: var(--token-text); }
      @media (max-width: 980px) { .home-hero, .showcase-section { grid-template-columns: 1fr; }.home-hero { min-height: 0; }.hero-copy { max-width: 650px; }.hero-preview-wrap { max-width: 700px; width: calc(100% - 25px); margin: 5px auto 0; }.feature-grid { grid-template-columns: repeat(2, 1fr); }.showcase-section .product-preview { max-width: 700px; width: calc(100% - 25px); margin: 0 auto; }.experience-grid { grid-template-columns: repeat(2, 1fr); gap: 27px; } }
      @media (max-width: 640px) { .home-root { padding-inline: 15px; padding-bottom: 66px; }.home-section { margin-bottom: 78px; }.hero-copy h1 { font-size: clamp(2.48rem, 13vw, 3.65rem); }.hero-actions { display: grid; grid-template-columns: 1fr; }.hero-actions button { width: 100%; }.hero-proof { gap: 9px 13px; }.product-preview { border-radius: 15px; }.preview-layout { grid-template-columns: 37px minmax(0, 1fr); min-height: 300px; }.preview-layout aside { gap: 16px; padding-top: 20px; }.preview-layout aside span { width: 14px; height: 14px; }.preview-content { padding: 15px; }.preview-kpis { gap: 6px; }.preview-kpis > div { padding: 8px; }.preview-chart svg { height: 95px; }.preview-callout { display: none; }.trusted-section, .experience-section { padding: 22px; border-radius: 16px; }.live-metrics { grid-template-columns: repeat(2, 1fr); }.live-metric { padding: 14px; }.feature-grid, .choice-grid, .experience-grid { grid-template-columns: 1fr; }.feature-card { min-height: 202px; }.choice-card { min-height: auto; }.section-intro { margin-bottom: 28px; }.cta-section { padding-inline: 0; }.showcase-section .product-preview, .hero-preview-wrap { width: 100%; } }
      @media (prefers-reduced-motion: reduce) { .home-root *, .home-root *::before, .home-root *::after { transition-duration: .01ms !important; animation-duration: .01ms !important; } }
    `}</style>
  </main>;
}
