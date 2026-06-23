import { useState, useEffect, useRef } from "react";
import { Smartphone, CheckCircle, Hash, Camera, ArrowRight, ArrowLeft, Copy, Check, AlertTriangle, Clock, Wifi, WifiOff, Zap, Shield, Users, Activity, X } from "lucide-react";

const BACKEND_URL = "https://26-bot-production.up.railway.app";

/* ── FONTS ── load Inter + IBM Plex Mono then mark as ready */
function useFonts() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (document.getElementById("26tech-fonts")) {
      setReady(true);
      return;
    }
    const link = document.createElement("link");
    link.id = "26tech-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800;0,14..32,900&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
    link.onload = () => setReady(true);
    document.head.appendChild(link);
  }, []);

  return ready;
}

/* ── TOAST ── */
let _toastId = 0;
let _setToasts = null;

function toast(msg) {
  if (!_setToasts) return;
  const id = ++_toastId;
  _setToasts((prev) => [...prev, { id, msg }]);
  setTimeout(() => _setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
}

function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  _setToasts = setToasts;

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-item"
          style={{ pointerEvents: "auto" }}
        >
          <AlertTriangle size={14} style={{ color: "#fb7185", flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: "0.8rem", color: "rgba(255,255,255,0.9)", fontFamily: "'Inter', sans-serif" }}>
            {t.msg}
          </span>
          <button
            onClick={() => dismiss(t.id)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "rgba(255,255,255,0.4)", display: "flex" }}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

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
function Particles() {
  const colors = ["#f472b6", "#a78bfa", "#38bdf8"];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {[...Array(24)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-30 particle-float"
          style={{
            width: `${Math.random() * 4 + 1}px`,
            height: `${Math.random() * 4 + 1}px`,
            background: colors[i % 3],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${Math.random() * 6 + 5}s`,
          }}
        />
      ))}
    </div>
  );
}

function Confetti() {
  const pieces = [...Array(14)].map((_, i) => {
    const angle = (i / 14) * 2 * Math.PI;
    const distance = 60 + Math.random() * 40;
    return {
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance,
      color: i % 3 === 0 ? "#38bdf8" : i % 3 === 1 ? "#f472b6" : "#a78bfa",
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
      <p className="font-mono text-xs mb-3 tracking-widest" style={{ color: "#f0abfc" }}>// PAIRING CODE</p>
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-3xl font-bold tracking-[0.3em] text-white">
          {displayed}{!done && <span className="cursor-blink">_</span>}
        </span>
        <button
          onClick={copy}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 ${copied ? "copy-pop" : ""}`}
          style={{ background: copied ? "linear-gradient(135deg,#10b981,#06b6d4)" : "linear-gradient(135deg,#ec4899,#8b5cf6)", color: "white" }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {done && (
        <p className="text-xs mt-4 fade-up flex items-center gap-1" style={{ color: "rgba(255,255,255,0.6)" }}>
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
      <p className="font-mono text-xs mb-3 tracking-widest" style={{ color: "#7dd3fc" }}>// QR CODE</p>
      <div className="flex justify-center">
        <div className="qr-frame">
          <img src={qr} alt="QR Code" className="w-44 h-44 rounded-xl img-pop" />
        </div>
      </div>
      <p className="text-xs mt-4 text-center flex items-center justify-center gap-1" style={{ color: "rgba(255,255,255,0.6)" }}>
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
                  background: done ? "linear-gradient(135deg,#10b981,#06b6d4)" : active ? "linear-gradient(135deg,#ec4899,#8b5cf6)" : "rgba(255,255,255,0.08)",
                  border: active ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.12)",
                  color: "white",
                }}
              >
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span className="font-mono text-[10px] mt-1 tracking-widest uppercase" style={{ color: active ? "#f0abfc" : "rgba(255,255,255,0.45)" }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 h-px mb-4 transition-all duration-500" style={{ background: done ? "linear-gradient(90deg,#ec4899,#06b6d4)" : "rgba(255,255,255,0.12)" }} />
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
        <span className="font-mono text-xs tracking-widest" style={{ color: "#f0abfc" }}>// INFO</span>
      </div>
      <ul className="info-list">
        <li><Zap size={13} style={{ color: "#f472b6", flexShrink: 0 }} /> Connect your WhatsApp in seconds</li>
        <li><Shield size={13} style={{ color: "#a78bfa", flexShrink: 0 }} /> Secure end-to-end pairing</li>
        <li><Users size={13} style={{ color: "#38bdf8", flexShrink: 0 }} /> Works on any WhatsApp account</li>
      </ul>
    </div>
  );
}

function StatusCard() {
  const { status, ping, botName, uptime } = useServerStatus();
  const isOnline = status === "online";
  const isChecking = status === "checking";
  const dotColor = isOnline ? "#10b981" : isChecking ? "#f59e0b" : "#f43f5e";
  const textColor = isOnline ? "#34d399" : isChecking ? "#fbbf24" : "#fb7185";
  const borderColor = isOnline ? "rgba(16,185,129,0.25)" : isChecking ? "rgba(245,158,11,0.25)" : "rgba(244,63,94,0.25)";
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
          {botName && <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.55)" }}>🤖 {botName}</p>}
          <div className="flex items-center gap-3">
            {ping !== null && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                Ping: <span style={{ color: ping < 300 ? "#34d399" : ping < 700 ? "#fbbf24" : "#fb7185" }}>{ping}ms</span>
              </p>
            )}
            {uptime && <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Up: <span style={{ color: "rgba(255,255,255,0.7)" }}>{uptime}</span></p>}
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>26-TECH Infrastructure</p>
        </div>
      )}
      {!isOnline && !isChecking && <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Cannot reach Railway server</p>}
      {isChecking && <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Contacting server...</p>}
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function PairingPage() {
  const fontsReady = useFonts();
  const [step, setStep] = useState(1);
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

  /* Apply Inter globally as soon as fonts load */
  const rootStyle = fontsReady
    ? { fontFamily: "'Inter', sans-serif" }
    : {};

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
        ...rootStyle,
      }}
      className="flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden"
    >
      <ToastContainer />

      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="floating-cube" />
      <Particles />

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
            <Users size={14} style={{ color: "#f472b6" }} />
            <span>5K+ Users</span>
          </div>
          <div className="stat-card">
            <Shield size={14} style={{ color: "#a78bfa" }} />
            <span>Secure Pairing</span>
          </div>
          <div className="stat-card">
            <Zap size={14} style={{ color: "#38bdf8" }} />
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
              <p className="text-white font-semibold mb-1 text-sm">WhatsApp Number</p>
              <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>Enter your number without + (e.g. 255712345678)</p>
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
              <button onClick={handleNext} className="premium-btn">
                Continue <ArrowRight size={15} style={{ marginLeft: 6 }} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="step-enter">
              <p className="text-white font-semibold mb-1 text-sm">Choose Connection Method</p>
              <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
                Number: <span className="font-mono" style={{ color: "#7dd3fc" }}>{number}</span>
              </p>
              <button onClick={() => sendRequest("code")} className="w-full mb-3 p-4 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95 method-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,rgba(236,72,153,0.35),rgba(139,92,246,0.35))" }}>
                    <Hash size={18} style={{ color: "#f0abfc" }} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Pairing Code</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>Get an 8-digit code — enter it in WhatsApp</p>
                  </div>
                  <ArrowRight size={16} className="ml-auto" style={{ color: "#f0abfc" }} />
                </div>
              </button>
              <button onClick={() => sendRequest("qr")} className="w-full mb-4 p-4 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95 method-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,rgba(59,130,246,0.35),rgba(6,182,212,0.35))" }}>
                    <Camera size={18} style={{ color: "#7dd3fc" }} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">QR Code</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>Scan with WhatsApp camera</p>
                  </div>
                  <ArrowRight size={16} className="ml-auto" style={{ color: "#7dd3fc" }} />
                </div>
              </button>
              <button onClick={() => setStep(1)} className="w-full py-2.5 rounded-xl text-sm transition-all duration-200 hover:text-white flex items-center justify-center gap-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                <ArrowLeft size={13} /> Back
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              {loading && (
                <div className="flex flex-col items-center py-8 gap-4 step-enter">
                  <div className="spinner" />
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>Connecting to WhatsApp...</p>
                  <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>{number}</p>
                </div>
              )}
              {!loading && code && (
                <div className="step-enter">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={14} style={{ color: "#10b981" }} />
                    <p className="text-sm font-semibold" style={{ color: "#34d399" }}>Code received!</p>
                  </div>
                  <CodeDisplay code={code} />
                  <button onClick={reset} className="w-full mt-4 py-2.5 rounded-xl text-sm transition-all duration-200 hover:text-white hover:-translate-y-0.5 flex items-center justify-center gap-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                    <ArrowLeft size={13} /> Try another number
                  </button>
                </div>
              )}
              {!loading && qr && (
                <div className="step-enter">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={14} style={{ color: "#06b6d4" }} />
                    <p className="text-sm font-semibold" style={{ color: "#7dd3fc" }}>QR Code ready!</p>
                  </div>
                  <QRDisplay qr={qr} />
                  <button onClick={reset} className="w-full mt-4 py-2.5 rounded-xl text-sm transition-all duration-200 hover:text-white hover:-translate-y-0.5 flex items-center justify-center gap-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                    <ArrowLeft size={13} /> Try another number
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <StatusCard />
      </div>

      <p className="mt-6 text-xs z-10 text-center fade-up" style={{ color: "rgba(255,255,255,0.4)" }}>
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
          font-family: 'Inter', system-ui, sans-serif !important;
          font-size: clamp(1.9rem, 7vw, 3.6rem);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: white;
          margin-bottom: 16px;
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .hero-sub {
          font-family: 'Inter', system-ui, sans-serif !important;
          font-weight: 400;
          max-width: 520px;
          margin: 0 auto;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9rem;
          line-height: 1.7;
        }
        .stat-card span {
          font-family: 'Inter', system-ui, sans-serif !important;
          font-weight: 500;
        }

        input::placeholder { color: rgba(255,255,255,0.3); }

        /* ── TOAST ── */
        .toast-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 14px;
          background: rgba(20, 10, 45, 0.92);
          border: 1px solid rgba(251, 113, 133, 0.35);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(251,113,133,0.15) inset;
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
        .orb-1 { width: 280px; height: 280px; background: radial-gradient(circle, rgba(236,72,153,0.45), transparent 70%); top: -80px; right: -80px; animation-duration: 9s; }
        .orb-2 { width: 220px; height: 220px; background: radial-gradient(circle, rgba(99,102,241,0.4), transparent 70%); bottom: 40px; left: -60px; animation-duration: 12s; animation-delay: 2s; }
        .orb-3 { width: 160px; height: 160px; background: radial-gradient(circle, rgba(6,182,212,0.35), transparent 70%); top: 50%; left: 50%; animation-duration: 7s; animation-delay: 1s; }
        @keyframes orbFloat { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(20px) scale(1.07); } }

        .floating-cube { position: absolute; bottom: 40px; left: -30px; width: 130px; height: 130px; border: 1.5px solid rgba(255,255,255,0.12); border-radius: 16px; transform: rotate(20deg); animation: floatRotate 12s ease-in-out infinite; pointer-events: none; }
        @keyframes floatRotate { 0%, 100% { transform: rotate(20deg) translateY(0); } 50% { transform: rotate(35deg) translateY(-16px); } }

        @keyframes particleFloat { 0%, 100% { transform: translate(0,0); opacity: 0.15; } 50% { transform: translate(8px,-16px); opacity: 0.5; } }
        .particle-float { animation: particleFloat ease-in-out infinite; }

        .glass-card { background: rgba(15,10,40,0.55); backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px); border: 1px solid rgba(255,255,255,0.14); box-shadow: 0 8px 48px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.06) inset, 0 1px 0 rgba(255,255,255,0.1) inset; }
        .inner-glass { background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.14); }
        .method-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); }
        .method-card:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.25); }
        .qr-frame { padding: 10px; border-radius: 14px; background: linear-gradient(135deg, rgba(236,72,153,0.25), rgba(59,130,246,0.25)); border: 1px solid rgba(255,255,255,0.18); }

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
          background: rgba(240, 171, 252, 0.08); border: 1px solid rgba(240, 171, 252, 0.2);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          color: #f0abfc; font-size: 11px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 22px;
        }
        .hero-stats { display: flex; justify-content: center; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 26px; }
        .stat-card { display: flex; align-items: center; gap: 7px; padding: 10px 16px; border-radius: 14px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); color: rgba(255, 255, 255, 0.7); font-size: 0.78rem; font-weight: 500; transition: 0.25s ease; }
        .stat-card:hover { transform: translateY(-3px); background: rgba(240, 171, 252, 0.08); border-color: rgba(240, 171, 252, 0.25); color: white; }

        @media (max-width: 640px) {
          .hero-title { font-size: clamp(1.8rem, 8vw, 2.4rem) !important; }
          .hero-sub { font-size: 0.82rem !important; }
          .hero-stats { gap: 7px; }
          .stat-card { padding: 8px 13px; font-size: 0.72rem; }
        }

        .gradient-text { background: linear-gradient(135deg, #f472b6, #a78bfa, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        .modern-input-wrap { position: relative; display: flex; align-items: center; }
        .input-icon-svg { position: absolute; left: 14px; pointer-events: none; z-index: 1; color: rgba(255,255,255,0.4); }
        .modern-input { width: 100%; border-radius: 14px; padding: 14px 16px 14px 44px; color: white; font-size: 0.9rem; font-family: 'IBM Plex Mono', monospace !important; outline: none; transition: all 0.25s ease; background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.14); caret-color: #f0abfc; }
        .modern-input:focus { background: rgba(240,171,252,0.08); border-color: rgba(240,171,252,0.5); box-shadow: 0 0 0 3px rgba(240,171,252,0.12), 0 2px 16px rgba(236,72,153,0.15); }

        .premium-btn { width: 100%; padding: 14px; border-radius: 14px; color: white; font-weight: 700; font-size: 0.9rem; font-family: 'Inter', sans-serif !important; letter-spacing: 0.04em; border: none; cursor: pointer; position: relative; overflow: hidden; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%); background-size: 200% 200%; animation: btnShimmer 4s ease infinite, btnGlow 3s ease-in-out infinite; transition: transform 0.15s ease, box-shadow 0.15s ease; display: flex; align-items: center; justify-content: center; }
        .premium-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent 60%); pointer-events: none; }
        .premium-btn:hover { transform: translateY(-2px) scale(1.01); }
        .premium-btn:active { transform: scale(0.97); }
        @keyframes btnShimmer { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes btnGlow { 0%, 100% { box-shadow: 0 4px 24px rgba(236,72,153,0.45); } 50% { box-shadow: 0 4px 32px rgba(139,92,246,0.55); } }

        .dashboard-grid { display: flex; flex-direction: column; align-items: stretch; gap: 16px; width: 100%; max-width: 420px; margin: 0 auto; }
        @media (min-width: 900px) {
          .dashboard-grid { display: grid; grid-template-columns: 200px 1fr; grid-template-rows: auto auto; max-width: 680px; align-items: start; gap: 16px; }
          .info-panel { grid-column: 1; grid-row: 1; }
          .glass-card  { grid-column: 2; grid-row: 1 / 3; }
          .status-card { grid-column: 1; grid-row: 2; }
        }

        .info-panel { background: rgba(15,10,40,0.5); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 16px; width: 100%; }
        .info-panel-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .info-dot { width: 6px; height: 6px; border-radius: 50%; background: #f472b6; display: inline-block; }
        .info-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .info-list li { font-size: 0.75rem; color: rgba(255,255,255,0.6); display: flex; align-items: center; gap: 7px; }

        .status-card { background: rgba(15,10,40,0.5); backdrop-filter: blur(20px); border: 1px solid rgba(16,185,129,0.25); border-radius: 16px; padding: 14px 16px; width: 100%; transition: border-color 0.3s ease; }
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
        @keyframes glowPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(236,72,153,0.5); } 50% { box-shadow: 0 0 0 6px rgba(236,72,153,0); } }
        .glow-active { animation: glowPulse 2s ease-in-out infinite; }
        @keyframes copyPop { 0% { transform: scale(0.85); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
        .copy-pop { animation: copyPop 0.35s ease; }
        @keyframes imgPop { 0% { opacity: 0; transform: scale(0.85); } 100% { opacity: 1; transform: scale(1); } }
        .img-pop { animation: imgPop 0.4s ease; }
        .cursor-blink { animation: blink 1s steps(1) infinite; color: #f0abfc; }
        @keyframes blink { 50% { opacity: 0; } }
        .confetti-piece { width: 6px; height: 6px; border-radius: 2px; animation: confettiBurst 0.9s ease-out forwards; }
        @keyframes confettiBurst { 0% { opacity: 1; transform: translate(0,0) scale(1); } 100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.4); } }
        .spinner { width: 28px; height: 28px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.15); border-top-color: #ec4899; border-right-color: #8b5cf6; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        button:focus-visible, input:focus-visible { outline: 2px solid #f0abfc; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
