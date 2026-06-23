import { useState, useEffect, useRef } from "react";

const BACKEND_URL = "https://26-bot-production.up.railway.app";

const STEPS = [
  { id: 1, label: "Number" },
  { id: 2, label: "Method" },
  { id: 3, label: "Result" },
];

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  );
}

function NodeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" />
      <circle cx="7" cy="7" r="0.8" fill="white" />
      <circle cx="7" cy="17" r="0.8" fill="white" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function HashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
      <line x1="9" y1="3" x2="7" y2="21" />
      <line x1="17" y1="3" x2="15" y2="21" />
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="3" y1="15" x2="19" y2="15" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkGraphic({ active }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-5">
      <div className="chip" style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)" }}>
        <PhoneIcon />
      </div>
      <div className="link-track">
        <div className={`link-fill ${active ? "link-fill-active" : ""}`} />
      </div>
      <div className="chip" style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
        <NodeIcon />
      </div>
    </div>
  );
}

function ProgressTrack({ current }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const active = s.id === current;
          const done = s.id < current;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                  style={{
                    background: active || done ? "linear-gradient(135deg, #ec4899, #8b5cf6)" : "rgba(255,255,255,0.08)",
                    border: active ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.12)",
                    color: "white",
                    boxShadow: active ? "0 0 16px rgba(236,72,153,0.5)" : "none",
                  }}
                >
                  {done ? "✓" : s.id}
                </div>
                <span
                  className="font-mono text-[10px] mt-1.5 tracking-widest uppercase"
                  style={{ color: active || done ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)" }}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="h-[2px] flex-1 mx-1 mb-4 rounded-full transition-all duration-500"
                  style={{
                    background: done ? "linear-gradient(90deg, #ec4899, #8b5cf6)" : "rgba(255,255,255,0.12)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CodeBlock({ code }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!code) return;
    setDisplayed("");
    setDone(false);
    let i = 0;
    const t = setInterval(() => {
      setDisplayed(code.slice(0, i + 1));
      i++;
      if (i >= code.length) {
        clearInterval(t);
        setDone(true);
      }
    }, 70);
    return () => clearInterval(t);
  }, [code]);

  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div>
      <LinkGraphic active={done} />
      <div className="inner-glass rounded-2xl px-5 py-5">
        <p className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
          Pairing code
        </p>
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-[26px] tracking-[0.3em] text-white">
            {displayed}
            {!done && <span className="cursor-blink">_</span>}
          </span>
          <button
            onClick={copy}
            className="shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-transform hover:scale-105 active:scale-95"
            style={{
              background: copied ? "linear-gradient(135deg, #10b981, #06b6d4)" : "linear-gradient(135deg, #ec4899, #8b5cf6)",
              color: "white",
            }}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>
      {done && (
        <p className="font-mono text-[11px] mt-3" style={{ color: "rgba(255,255,255,0.55)" }}>
          Expires in 3:00 — WhatsApp → Settings → Linked devices → Link a device
        </p>
      )}
    </div>
  );
}

function QRBlock({ qr }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setActive(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      <LinkGraphic active={active} />
      <div className="inner-glass rounded-2xl px-5 py-5">
        <p className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
          Scan to link
        </p>
        <div className="flex justify-center">
          <div className="qr-frame">
            <img src={qr} alt="Pairing QR code" className="w-44 h-44 rounded-lg" />
          </div>
        </div>
      </div>
      <p className="font-mono text-[11px] mt-3" style={{ color: "rgba(255,255,255,0.55)" }}>
        Expires in 60s — WhatsApp → Linked devices → Link a device
      </p>
    </div>
  );
}

export default function PairingPage() {
  const [step, setStep] = useState(1);
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (step === 1) inputRef.current?.focus();
  }, [step]);

  const validate = (num) => /^\d{10,15}$/.test(num.trim());

  const handleNext = () => {
    setError("");
    if (!validate(number)) {
      setError("Invalid number — digits only, e.g. 255712345678");
      setShakeKey((k) => k + 1);
      return;
    }
    setStep(2);
  };

  const handleMethodSelect = (selected) => sendRequest(selected);

  const sendRequest = async (selectedMethod) => {
    setError("");
    setLoading(true);
    setStep(3);
    try {
      const res = await fetch(`${BACKEND_URL}/pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: number.trim(),
          method: selectedMethod,
          session: number.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to get code");
      selectedMethod === "code" ? setCode(data.code) : setQr(data.qr);
    } catch (err) {
      setError(err.message);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setCode("");
    setQr("");
    setNumber("");
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-mesh relative overflow-hidden">
      <div className="floating-sphere" />
      <div className="floating-cube" />

      <div className="w-full max-w-sm z-10">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)" }}
          >
            26
          </div>
          <span className="font-sans text-sm font-semibold text-white">
            TECH<span style={{ color: "#f0abfc" }}>/</span>pairing
          </span>
        </div>
        <div className="flex items-center gap-1.5 mb-7">
          <span className="status-dot" />
          <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.55)" }}>
            Pairing service online
          </span>
        </div>

        <div className="glass-card rounded-3xl panel-in p-6">
          <ProgressTrack current={step} />

          {step === 1 && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                Device number
              </p>
              <p className="text-[15px] mb-4 text-white font-medium">
                Enter the WhatsApp number to link.
              </p>
              <div
                key={shakeKey}
                className={`flex items-center inner-glass rounded-xl px-3 ${error ? "shake-once" : ""}`}
                style={{ borderColor: error ? "#fb7185" : undefined }}
              >
                <span className="font-mono text-sm mr-1" style={{ color: "rgba(255,255,255,0.5)" }}>+</span>
                <input
                  ref={inputRef}
                  type="tel"
                  value={number}
                  onChange={(e) => {
                    setNumber(e.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  placeholder="255712345678"
                  maxLength={15}
                  className="w-full bg-transparent py-3 font-mono text-sm outline-none text-white"
                  style={{ caretColor: "#f0abfc" }}
                />
              </div>
              {error && (
                <p className="font-mono text-[11px] mt-2" style={{ color: "#fb7185" }}>{error}</p>
              )}
              <button
                onClick={handleNext}
                className="w-full mt-5 py-3 rounded-full text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
                  boxShadow: "0 6px 24px rgba(139,92,246,0.45)",
                }}
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                Connection method
              </p>
              <p className="text-[15px] mb-5 text-white font-medium">
                Number <span className="font-mono" style={{ color: "#f0abfc" }}>+{number}</span>
              </p>

              <button onClick={() => handleMethodSelect("code")} className="method-card mb-3">
                <div className="chip" style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)" }}>
                  <HashIcon />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-white">Pairing code</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>8-digit code, entered manually</p>
                </div>
                <ChevronIcon />
              </button>

              <button onClick={() => handleMethodSelect("qr")} className="method-card mb-4">
                <div className="chip" style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
                  <GridIcon />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-white">QR code</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>Scan with the WhatsApp camera</p>
                </div>
                <ChevronIcon />
              </button>

              {error && (
                <p className="font-mono text-[11px] mb-3" style={{ color: "#fb7185" }}>{error}</p>
              )}

              <button
                onClick={() => { setStep(1); setError(""); }}
                className="font-mono text-xs"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                ← back
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              {loading && (
                <div className="flex flex-col items-center py-10 gap-4">
                  <div className="spinner" />
                  <p className="font-mono text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                    establishing session…
                  </p>
                </div>
              )}

              {!loading && code && (
                <div>
                  <CodeBlock code={code} />
                  <button onClick={reset} className="font-mono text-xs mt-5" style={{ color: "rgba(255,255,255,0.5)" }}>
                    ← try another number
                  </button>
                </div>
              )}

              {!loading && qr && (
                <div>
                  <QRBlock qr={qr} />
                  <button onClick={reset} className="font-mono text-xs mt-5" style={{ color: "rgba(255,255,255,0.5)" }}>
                    ← try another number
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="font-mono text-[10px] uppercase tracking-widest mt-6 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
          26-tech · self-hosted pairing infrastructure
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        input::placeholder { color: rgba(255,255,255,0.3); }

        .bg-mesh {
          background: linear-gradient(135deg, #ec4899 0%, #a855f7 25%, #6366f1 50%, #3b82f6 75%, #06b6d4 100%);
          background-size: 200% 200%;
          animation: gradientShift 14s ease infinite;
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
        }

        .floating-sphere {
          position: absolute; top: -60px; right: -60px;
          width: 220px; height: 220px; border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5), rgba(236,72,153,0.15) 60%, transparent 70%);
          filter: blur(2px);
          animation: floatY 8s ease-in-out infinite;
          pointer-events: none;
        }
        .floating-cube {
          position: absolute; bottom: 40px; left: -30px;
          width: 130px; height: 130px;
          border: 1.5px solid rgba(255,255,255,0.25);
          border-radius: 16px;
          transform: rotate(20deg);
          animation: floatRotate 12s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes floatY { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(20px); } }
        @keyframes floatRotate { 0%, 100% { transform: rotate(20deg) translateY(0); } 50% { transform: rotate(35deg) translateY(-16px); } }

        .glass-card {
          background: rgba(20, 14, 45, 0.45);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
        }
        .inner-glass {
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .qr-frame {
          padding: 10px; border-radius: 14px;
          background: linear-gradient(135deg, rgba(236,72,153,0.25), rgba(59,130,246,0.25));
          border: 1px solid rgba(255,255,255,0.18);
        }

        @keyframes panelIn {
          0% { opacity: 0; transform: translateY(14px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .panel-in { animation: panelIn .5s cubic-bezier(.16,1,.3,1) both; }

        @keyframes shakeOnce {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        .shake-once { animation: shakeOnce .35s ease; }

        .status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #34d399;
          animation: statusPulse 2.4s ease-in-out infinite;
        }
        @keyframes statusPulse { 0%, 100% { opacity: .4; } 50% { opacity: 1; } }

        .cursor-blink { animation: blink 1s steps(1) infinite; color: #f0abfc; }
        @keyframes blink { 50% { opacity: 0; } }

        .chip {
          width: 38px; height: 38px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(0,0,0,0.25);
        }
        .link-track {
          width: 56px; height: 2px; background: rgba(255,255,255,0.15);
          position: relative; border-radius: 2px; overflow: hidden;
        }
        .link-fill {
          position: absolute; inset: 0; width: 0%;
          background: linear-gradient(90deg, #ec4899, #06b6d4);
          transition: width .8s cubic-bezier(.16,1,.3,1);
        }
        .link-fill-active { width: 100%; }

        .method-card {
          width: 100%; display: flex; align-items: center; gap: .75rem;
          padding: 14px; border-radius: 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          transition: all .2s ease;
          text-align: left;
        }
        .method-card:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.25);
          transform: translateY(-2px);
        }
        .method-card:active { transform: scale(0.98); }

        .spinner {
          width: 28px; height: 28px; border-radius: 50%;
          border: 3px solid rgba(255,255,255,0.15);
          border-top-color: #ec4899;
          border-right-color: #8b5cf6;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        button:focus-visible, input:focus-visible {
          outline: 2px solid #f0abfc;
          outline-offset: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}