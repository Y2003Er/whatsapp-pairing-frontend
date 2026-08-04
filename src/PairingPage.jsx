import { useState, useEffect, useRef } from "react";
import { Smartphone, CheckCircle, Hash, Camera, ArrowRight, ArrowLeft, Copy, Check, Clock, Wifi, WifiOff, Zap, Shield, Users, Activity } from "lucide-react";
import { BACKEND_URL } from "./config";
import { toast } from "./Toast";

/* ── FONTS ── load Inter + IBM Plex Mono then mark as ready */
/* ── SERVER STATUS ── */
function useServerStatus() {
  const [status, setStatus] = useState("checking");
  const [ping, setPing] = useState(null);
  const [botName, setBotName] = useState(null);
  const [uptime, setUptime] = useState(null);

  const check = async () => {
    const start = Date.now();
    try {
      const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(6000) });
      const ms = Date.now() - start;
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus("online");
        setPing(ms);
        setBotName(data.botName || data.name || null);
        if (data.uptime) {
          const s = Math.floor(data.uptime);
          const h = Math.floor(s / 3600);
          const m = Math.floor((s % 3600) / 60);
          setUptime(h > 0 ? `${h}h ${m}m` : `${m}m`);
        }
      } else {
        setStatus("offline");
      }
    } catch {
      setStatus("offline");
    }
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return { status, ping, botName, uptime };
}

/* ── PARTICLES ── */
function Confetti() {
  const pieces = [...Array(14)].map((_, i) => {
    const angle = (i / 14) * 2 * Math.PI;
    const distance = 60 + Math.random() * 40;
    return {
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance,
      color: i % 3 === 0 ? "var(--token-secondary)" : i % 3 === 1 ? "var(--token-accent)" : "var(--token-info)",
      delay: Math.random() * 0.15,
    };
  });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute confetti-piece"
          style={{
            left: "50%", top: "12%",
            background: p.color,
            animationDelay: `${p.delay}s`,
            "--tx": `${p.tx}px`,
            "--ty": `${p.ty}px`,
          }}
        />
      ))}
    </div>
  );
}

function CodeDisplay({ code }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!code) return;
    setDisplayed(""); setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(code.slice(0, i + 1)); i++;
      if (i >= code.length) { clearInterval(interval); setDone(true); }
    }, 80);
    return () => clearInterval(interval);
  }, [code]);

  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="mt-6 rounded-2xl inner-glass p-6 step-enter relative">
      {done && <Confetti />}
      <p className="font-mono text-xs mb-3 tracking-widest" style={{ color: "var(--token-info)" }}>// PAIRING CODE</p>
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-3xl font-bold tracking-[0.3em]" style={{ color: "var(--token-text)" }}>
          {displayed}{!done && <span className="cursor-blink">_</span>}
        </span>
        <button
          onClick={copy}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 ${copied ? "copy-pop" : ""}`}
          style={{ background: copied ? "var(--token-success)" : "var(--token-accent-fill)", color: "var(--token-on-accent)" }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {done && (
        <p className="text-xs mt-4 fade-up flex items-center gap-1" style={{ color: "var(--token-muted)" }}>
          <Clock size={11} /> Code expires in 3 minutes. Open WhatsApp → Settings → Linked Devices → Link Device
        </p>
      )}
    </div>
  );
}

function QRDisplay({ qr }) {
  return (
    <div className="mt-6 rounded-2xl inner-glass p-6 step-enter relative">
      <Confetti />
      <p className="font-mono text-xs mb-3 tracking-widest" style={{ color: "var(--token-secondary)" }}>// QR CODE</p>
      <div className="flex justify-center">
        <div className="qr-frame">
          <img src={qr} alt="QR Code" className="w-44 h-44 rounded-xl img-pop" />
        </div>
      </div>
      <p className="text-xs mt-4 text-center flex items-center justify-center gap-1" style={{ color: "var(--token-muted)" }}>
        <Smartphone size={11} /> Scan quickly — QR expires in 60 seconds. WhatsApp → Linked Devices → Link Device
      </p>
    </div>
  );
}

function Steps({ current }) {
  const steps = ["Number", "Method", "Result"];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const active = i + 1 === current;
        const done = i + 1 < current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${active ? "glow-active" : ""}`}
                style={{
                  background: done ? "var(--token-success)" : active ? "var(--token-accent-fill)" : "var(--token-card-strong)",
                  border: active ? "1px solid var(--token-border-strong)" : "1px solid var(--token-card-border)",
                  color: "var(--token-on-accent)",
                }}
              >
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span className="font-mono text-[10px] mt-1 tracking-widest uppercase" style={{ color: active ? "var(--token-info)" : "var(--token-muted)" }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 h-px mb-4 transition-all duration-500" style={{ background: done ? "var(--token-success)" : "var(--token-card-border)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InfoPanel() {
  return (
    <div className="info-panel fade-up">
      <div className="info-panel-header">
        <span className="info-dot" />
        <span className="font-mono text-xs tracking-widest" style={{ color: "var(--token-info)" }}>// INFO</span>
      </div>
      <ul className="info-list">
        <li><Zap size={13} style={{ color: "var(--token-accent)", flexShrink: 0 }} /> Connect your WhatsApp in seconds</li>
        <li><Shield size={13} style={{ color: "var(--token-info)", flexShrink: 0 }} /> Secure end-to-end pairing</li>
        <li><Users size={13} style={{ color: "var(--token-secondary)", flexShrink: 0 }} /> Works on any WhatsApp account</li>
      </ul>
    </div>
  );
}

function StatusCard() {
  const { status, ping, botName, uptime } = useServerStatus();
  const isOnline = status === "online";
  const isChecking = status === "checking";
  const dotColor = isOnline ? "var(--token-success)" : isChecking ? "var(--token-warning)" : "var(--token-error)";
  const textColor = dotColor;
  const borderColor = dotColor;
  const label = isOnline ? "Server Online" : isChecking ? "Checking..." : "Server Offline";

  return (
    <div className="status-card fade-up" style={{ borderColor }}>
      <div className="flex items-center gap-2">
        <span className="status-dot" style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
        <span className="text-xs font-semibold" style={{ color: textColor }}>{label}</span>
        {isOnline ? <Wifi size={12} style={{ color: dotColor, marginLeft: "auto" }} />
          : isChecking ? <Activity size={12} style={{ color: dotColor, marginLeft: "auto" }} />
          : <WifiOff size={12} style={{ color: dotColor, marginLeft: "auto" }} />}
      </div>
      {isOnline && (
        <div className="mt-2 flex flex-col gap-1">
          {botName && <p className="text-xs font-mono" style={{ color: "var(--token-muted)" }}>🤖 {botName}</p>}
          <div className="flex items-center gap-3">
            {ping !== null && (
              <p className="text-xs" style={{ color: "var(--token-muted)" }}>
                Ping: <span style={{ color: ping < 300 ? "var(--token-success)" : ping < 700 ? "var(--token-warning)" : "var(--token-error)" }}>{ping}ms</span>
              </p>
            )}
            {uptime && <p className="text-xs" style={{ color: "var(--token-muted)" }}>Up: <span style={{ color: "var(--token-text)" }}>{uptime}</span></p>}
          </div>
          <p className="text-xs" style={{ color: "var(--token-muted)" }}>26-TECH Infrastructure</p>
        </div>
      )}
      {!isOnline && !isChecking && <p className="text-xs mt-1" style={{ color: "var(--token-muted)" }}>Cannot reach Railway server</p>}
      {isChecking && <p className="text-xs mt-1" style={{ color: "var(--token-muted)" }}>Contacting server...</p>}
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function PairingPage() {
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [qr, setQr] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { if (step === 1) inputRef.current?.focus(); }, [step]);

  const validate = (num) => /^\d{10,15}$/.test(num.trim());

  const handleNext = () => {
    if (!validate(number)) {
      toast("Enter a valid number (e.g. 255712345678)");
      setShakeKey((k) => k + 1);
      return;
    }
    if (!agreed) {
      toast("Please agree to the Terms & Policy to continue");
      return;
    }
    setStep(2);
  };

  const sendRequest = async (selectedMethod) => {
    setLoading(true);
    setStep(3);
    try {
      const res = await fetch(`${BACKEND_URL}/pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: number.trim(), method: selectedMethod, session: number.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to get code");
      if (selectedMethod === "code") setCode(data.code);
      else setQr(data.qr);
    } catch (err) {
      toast(err.message);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setStep(1); setCode(""); setQr(""); setNumber(""); };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--token-background)",
      }}
      className="pairing-root flex flex-col items-center justify-center px-4 pt-10 pb-10 relative overflow-hidden"
    >
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="floating-cube" />

      {/* ── HERO SECTION ── */}
      <div className="hero-section z-10 fade-up">
        <div className="hero-badge">
          <Activity size={11} />
          <span>26-TECH Infrastructure Online</span>
        </div>

        <h1 className="hero-title">
          Connect Your
          <span className="gradient-text"> WhatsApp Bot</span>
          <br />
          In Seconds
        </h1>

        <p className="hero-sub">
          Fast, secure and reliable WhatsApp pairing platform
          powered by modern cloud infrastructure.
        </p>

        <div className="hero-stats">
          <div className="stat-card">
            <Users size={14} style={{ color: "var(--token-accent)" }} />
            <span>5K+ Users</span>
          </div>
          <div className="stat-card">
            <Shield size={14} style={{ color: "var(--token-info)" }} />
            <span>Secure Pairing</span>
          </div>
          <div className="stat-card">
            <Zap size={14} style={{ color: "var(--token-secondary)" }} />
            <span>Instant Setup</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid z-10">
        <InfoPanel />

        <div className="glass-card rounded-3xl p-6 card-in relative overflow-hidden">
          <Steps current={step} />

          {step === 1 && (
            <div className="step-enter">
              <p className="font-semibold mb-1 text-sm" style={{ color: "var(--token-text)" }}>WhatsApp Number</p>
              <p className="text-xs mb-4" style={{ color: "var(--token-muted)" }}>Enter your number without + (e.g. 255712345678)</p>
              <div className="modern-input-wrap mb-4">
                <Smartphone size={16} className="input-icon-svg" />
                <input
                  key={shakeKey} ref={inputRef} type="tel" value={number}
                  onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  placeholder="255712345678" maxLength={15}
                  className={`modern-input ${shakeKey > 0 ? "shake-once" : ""}`}
                />
              </div>
              <label
                className="terms-check-row"
                style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 14, cursor: "pointer" }}
              >
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0, accentColor: "var(--token-accent-fill)" }}
                />
                <span className="text-xs" style={{ color: "var(--token-muted)", lineHeight: 1.4 }}>
                  I agree to the{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "var(--token-accent)" }}>
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--token-accent)" }}>
                    Privacy Policy
                  </a>
                </span>
              </label>
              <button onClick={handleNext} className="premium-btn" disabled={!agreed} style={!agreed ? { opacity: 0.5, cursor: "not-allowed" } : undefined}>
                Continue <ArrowRight size={15} style={{ marginLeft: 6 }} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="step-enter">
              <p className="font-semibold mb-1 text-sm" style={{ color: "var(--token-text)" }}>Choose Connection Method</p>
              <p className="text-xs mb-5" style={{ color: "var(--token-muted)" }}>
                Number: <span className="font-mono" style={{ color: "var(--token-secondary)" }}>{number}</span>
              </p>
              <button onClick={() => sendRequest("code")} className="w-full mb-3 p-4 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95 method-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--token-info-bg)" }}>
                    <Hash size={18} style={{ color: "var(--token-info)" }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--token-text)" }}>Pairing Code</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--token-muted)" }}>Get an 8-digit code — enter it in WhatsApp</p>
                  </div>
                  <ArrowRight size={16} className="ml-auto" style={{ color: "var(--token-info)" }} />
                </div>
              </button>
              <button onClick={() => sendRequest("qr")} className="w-full mb-4 p-4 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95 method-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--token-info-bg)" }}>
                    <Camera size={18} style={{ color: "var(--token-secondary)" }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--token-text)" }}>QR Code</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--token-muted)" }}>Scan with WhatsApp camera</p>
                  </div>
                  <ArrowRight size={16} className="ml-auto" style={{ color: "var(--token-secondary)" }} />
                </div>
              </button>
              <button onClick={() => setStep(1)} className="w-full py-2.5 rounded-xl text-sm transition-all duration-200 hover:text-white flex items-center justify-center gap-1" style={{ color: "var(--token-muted)" }}>
                <ArrowLeft size={13} /> Back
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              {loading && (
                <div className="flex flex-col items-center py-8 gap-4 step-enter">
                  <div className="spinner" />
                  <p className="text-sm" style={{ color: "var(--token-text)" }}>Connecting to WhatsApp...</p>
                  <p className="text-xs font-mono" style={{ color: "var(--token-muted)" }}>{number}</p>
                </div>
              )}
              {!loading && code && (
                <div className="step-enter">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={14} style={{ color: "var(--token-success)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--token-success)" }}>Code received!</p>
                  </div>
                  <CodeDisplay code={code} />
                  <button onClick={reset} className="w-full mt-4 py-2.5 rounded-xl text-sm transition-all duration-200 hover:text-white hover:-translate-y-0.5 flex items-center justify-center gap-1" style={{ color: "var(--token-muted)" }}>
                    <ArrowLeft size={13} /> Try another number
                  </button>
                </div>
              )}
              {!loading && qr && (
                <div className="step-enter">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={14} style={{ color: "var(--token-success)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--token-success)" }}>QR Code ready!</p>
                  </div>
                  <QRDisplay qr={qr} />
                  <button onClick={reset} className="w-full mt-4 py-2.5 rounded-xl text-sm transition-all duration-200 hover:text-white hover:-translate-y-0.5 flex items-center justify-center gap-1" style={{ color: "var(--token-muted)" }}>
                    <ArrowLeft size={13} /> Try another number
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <StatusCard />
      </div>

      <p className="mt-6 text-xs z-10 text-center fade-up" style={{ color: "var(--token-muted)" }}>
        © 2026 26-TECH · Powered by AI Infrastructure
      </p>

      <style>{`
        /* ── BASE FONTS ── applied to every element */
        *, *::before, *::after {
          box-sizing: border-box;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        .font-mono, .hero-badge, .hero-badge span {
          font-family: 'IBM Plex Mono', 'Courier New', monospace !important;
        }

        /* ── HERO TYPOGRAPHY ── explicit font-family so it never falls back */
        .hero-title {
          font-size: clamp(1.9rem, 7vw, 3.6rem);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: var(--token-heading);
          margin-bottom: 16px;
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .hero-sub {
          font-weight: 400;
          max-width: 520px;
          margin: 0 auto;
          color: var(--token-text-secondary);
          font-size: 0.9rem;
          line-height: 1.7;
        }
        .stat-card span {
          font-weight: 500;
        }

        input::placeholder { color: var(--token-muted); }

        /* ── TOAST ── */
        .toast-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 14px;
          background: var(--token-card);
          border: 1px solid var(--token-error);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 8px 32px var(--token-shadow), 0 0 0 0.5px var(--token-error-bg) inset;
          min-width: 240px;
          max-width: 320px;
          animation: toastIn 0.35s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(24px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)   scale(1); }
        }

        /* ── ORBs ── */
        .orb { position: absolute; border-radius: 50%; filter: blur(60px); pointer-events: none; animation: orbFloat ease-in-out infinite; }
        .orb-1 { width: 280px; height: 280px; background: radial-gradient(circle, var(--token-glow), transparent 70%); top: -80px; right: -80px; animation-duration: 9s; }
        .orb-2 { width: 220px; height: 220px; background: radial-gradient(circle, var(--token-glow-strong), transparent 70%); bottom: 40px; left: -60px; animation-duration: 12s; animation-delay: 2s; }
        .orb-3 { width: 160px; height: 160px; background: radial-gradient(circle, var(--token-info-bg), transparent 70%); top: 50%; left: 50%; animation-duration: 7s; animation-delay: 1s; }
        @keyframes orbFloat { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(20px) scale(1.07); } }

        .floating-cube { position: absolute; bottom: 40px; left: -30px; width: 130px; height: 130px; border: 1.5px solid var(--token-card-border); border-radius: 16px; transform: rotate(20deg); animation: floatRotate 12s ease-in-out infinite; pointer-events: none; }
        @keyframes floatRotate { 0%, 100% { transform: rotate(20deg) translateY(0); } 50% { transform: rotate(35deg) translateY(-16px); } }


        .pairing-root { background-image: radial-gradient(circle at 8% 26%, var(--token-glow), transparent 30%), radial-gradient(circle at 92% 70%, var(--token-info-bg), transparent 26%); }
        .glass-card, .info-panel, .status-card, .method-card, .inner-glass { background: linear-gradient(135deg, color-mix(in srgb, var(--token-card) 94%, transparent), color-mix(in srgb, var(--token-surface-strong) 64%, transparent)); backdrop-filter: blur(28px) saturate(125%); -webkit-backdrop-filter: blur(28px) saturate(125%); border: 1px solid var(--token-border); box-shadow: 0 14px 38px var(--token-shadow), inset 0 1px 0 color-mix(in srgb, var(--token-text) 9%, transparent); }
        .glass-card { border-radius: var(--token-radius) !important; }
        .inner-glass { border-radius: calc(var(--token-radius) - 3px); }
        .method-card { color: var(--token-text); }
        .glass-card:hover, .info-panel:hover, .status-card:hover, .method-card:hover { border-color: var(--token-border-strong); box-shadow: 0 18px 46px var(--token-shadow), 0 0 24px var(--token-glow); }
        .qr-frame { padding: 10px; border-radius: 14px; background: var(--token-info-bg); border: 1px solid var(--token-info-border); }

        /* hero width matches the dashboard-grid max-width (420px mobile, 680px desktop) */
        .hero-section {
          text-align: center;
          width: 100%;
          max-width: 420px;   /* same as dashboard-grid mobile */
          margin: 0 auto 30px;
          overflow: hidden;
        }
        @media (min-width: 900px) {
          .hero-section { max-width: 680px; } /* same as dashboard-grid desktop */
        }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 16px; border-radius: 999px;
          background: var(--token-info-bg); border: 1px solid var(--token-info-border);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          color: var(--token-info); font-size: 11px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 22px;
        }
        .hero-stats { display: flex; justify-content: center; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 26px; }
        .stat-card { display: flex; align-items: center; gap: 7px; padding: 10px 16px; border-radius: 14px; background: var(--token-surface); border: 1px solid var(--token-card-border); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); color: var(--token-text); font-size: 0.78rem; font-weight: 500; transition: 0.25s ease; }
        .stat-card:hover { transform: translateY(-3px); background: var(--token-hover); border-color: var(--token-border-strong); color: var(--token-text); }

        @media (max-width: 640px) {
          .hero-title { font-size: clamp(1.8rem, 8vw, 2.4rem) !important; }
          .hero-sub { font-size: 0.82rem !important; }
          .hero-stats { gap: 7px; }
          .stat-card { padding: 8px 13px; font-size: 0.72rem; }
        }

        .gradient-text { color: var(--token-accent); }

        .modern-input-wrap { position: relative; display: flex; align-items: center; min-height: 52px; padding: 2px; border: 1px solid var(--token-border); border-radius: calc(var(--token-radius) - 2px); background: color-mix(in srgb, var(--token-surface) 88%, transparent); transition: border-color var(--motion-base) ease, box-shadow var(--motion-base) ease, transform var(--motion-base) ease; }
        .modern-input-wrap:focus-within { border-color: var(--token-focus); box-shadow: 0 0 0 3px var(--token-info-bg), 0 10px 28px var(--token-glow); transform: translateY(-1px); }
        .input-icon-svg { position: absolute; left: 17px; pointer-events: none; z-index: 1; color: var(--token-link); }
        .modern-input { width: 100%; min-width: 0; border: 0; border-radius: calc(var(--token-radius) - 4px); padding: 14px 16px 14px 46px; color: var(--token-text); font-size: 0.92rem; outline: none; transition: background var(--motion-base) ease; background: transparent; caret-color: var(--token-link); }
        .modern-input::placeholder { color: var(--token-text-muted); opacity: 1; }
        .modern-input:focus { background: color-mix(in srgb, var(--token-hover) 68%, transparent); box-shadow: none; }

        .premium-btn { width: 100%; min-height: 48px; padding: 14px 18px; border-radius: var(--token-radius); color: var(--token-button-text) !important; font-weight: 700; font-size: 0.9rem; letter-spacing: 0.04em; border: 1px solid transparent; cursor: pointer; position: relative; overflow: hidden; background: linear-gradient(135deg, var(--token-accent-fill), var(--token-primary)); background-size: 200% 200%; animation: btnShimmer 4s ease infinite, btnGlow 3s ease-in-out infinite; transition: transform 0.15s ease, box-shadow 0.15s ease; display: flex; align-items: center; justify-content: center; gap: 6px; isolation: isolate; }
        .premium-btn::before { display: none; }
        .premium-btn:hover { transform: translateY(-2px) scale(1.01); }
        .premium-btn:active { transform: scale(0.97); }
        @keyframes btnShimmer { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes btnGlow { 0%, 100% { box-shadow: 0 4px 24px var(--token-glow); } 50% { box-shadow: 0 4px 32px var(--token-glow-strong); } }

        .dashboard-grid { display: flex; flex-direction: column; align-items: stretch; gap: clamp(14px, 3vw, 20px); width: 100%; max-width: 420px; margin: 0 auto; }
        @media (min-width: 900px) {
          .dashboard-grid { display: grid; grid-template-columns: 200px 1fr; grid-template-rows: auto auto; max-width: 680px; align-items: start; gap: 16px; }
          .info-panel { grid-column: 1; grid-row: 1; }
          .glass-card  { grid-column: 2; grid-row: 1 / 3; }
          .status-card { grid-column: 1; grid-row: 2; }
        }

        .info-panel { border-radius: var(--token-radius); padding: 18px; width: 100%; }
        .info-panel-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .info-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--token-accent); display: inline-block; }
        .info-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .info-list li { font-size: 0.75rem; color: var(--token-text-secondary); display: flex; align-items: center; gap: 7px; }

        .status-card { border-radius: var(--token-radius); padding: 16px 18px; width: 100%; transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; animation: statusPulse 2s ease-in-out infinite; }
        @keyframes statusPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        @keyframes cardIn { 0% { opacity: 0; transform: translateY(24px) scale(0.96); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        .card-in { animation: cardIn 0.55s cubic-bezier(0.16,1,0.3,1); }
        @keyframes fadeUp { 0% { opacity: 0; transform: translateY(-8px); } 100% { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease both; }
        @keyframes stepEnter { 0% { opacity: 0; transform: translateY(10px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        .step-enter { animation: stepEnter 0.35s ease; }
        @keyframes shakeOnce { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
        .shake-once { animation: shakeOnce 0.4s ease; }
        @keyframes glowPulse { 0%, 100% { box-shadow: 0 0 0 0 var(--token-glow-strong); } 50% { box-shadow: 0 0 0 6px transparent; } }
        .glow-active { animation: glowPulse 2s ease-in-out infinite; }
        @keyframes copyPop { 0% { transform: scale(0.85); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
        .copy-pop { animation: copyPop 0.35s ease; }
        @keyframes imgPop { 0% { opacity: 0; transform: scale(0.85); } 100% { opacity: 1; transform: scale(1); } }
        .img-pop { animation: imgPop 0.4s ease; }
        .cursor-blink { animation: blink 1s steps(1) infinite; color: var(--token-info); }
        @keyframes blink { 50% { opacity: 0; } }
        .confetti-piece { width: 6px; height: 6px; border-radius: 2px; animation: confettiBurst 0.9s ease-out forwards; }
        @keyframes confettiBurst { 0% { opacity: 1; transform: translate(0,0) scale(1); } 100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.4); } }
        .spinner { width: 28px; height: 28px; border-radius: 50%; border: 3px solid var(--token-card-border); border-top-color: var(--token-accent); border-right-color: var(--token-info); animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        button:focus-visible, input:focus-visible { outline: 2px solid var(--token-focus); outline-offset: 2px; }
        @media (max-width: 414px) { .pairing-root { padding-inline: 12px !important; }.glass-card { padding: 18px !important; }.hero-section { margin-bottom: 22px; }.stat-card { min-height: 36px; }.hero-stats { gap: 6px; } }
        @media (max-width: 340px) { .hero-stats { display: grid; grid-template-columns: 1fr 1fr; }.stat-card:last-child { grid-column: span 2; justify-content: center; }.glass-card { padding: 16px !important; } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
