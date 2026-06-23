import { useState, useEffect, useRef } from "react";

const BACKEND_URL = "https://26-bot-production.up.railway.app";

function Particles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20 particle-float"
          style={{
            width: `${Math.random() * 4 + 1}px`,
            height: `${Math.random() * 4 + 1}px`,
            background: i % 2 === 0 ? "#7c3aed" : "#06b6d4",
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
      color: i % 3 === 0 ? "#06b6d4" : i % 3 === 1 ? "#7c3aed" : "#10b981",
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
            left: "50%",
            top: "12%",
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
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(code.slice(0, i + 1));
      i++;
      if (i >= code.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [code]);

  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6 rounded-2xl border border-purple-500/30 bg-black/40 backdrop-blur p-6 step-enter relative">
      {done && <Confetti />}
      <p className="text-xs text-cyan-400 mb-3 font-mono tracking-widest">
        // PAIRING CODE
      </p>
      <div className="flex items-center justify-between gap-4">
        <span
          className="font-mono text-3xl font-bold tracking-[0.3em]"
          style={{
            background: "linear-gradient(90deg, #7c3aed, #06b6d4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {displayed}
          {!done && <span className="animate-ping text-cyan-400 opacity-80">|</span>}
        </span>
        <button
          onClick={copy}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${copied ? "copy-pop" : ""}`}
          style={{
            background: copied
              ? "linear-gradient(135deg, #059669, #10b981)"
              : "linear-gradient(135deg, #7c3aed, #06b6d4)",
            color: "white",
          }}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      {done && (
        <p className="text-xs text-slate-400 mt-4 fade-up">
          ⏱ Code expires in 3 minutes. Quickly open WhatsApp →{" "}
          <span className="text-cyan-400">Settings → Linked Devices → Link Device</span>
        </p>
      )}
    </div>
  );
}

function QRDisplay({ qr }) {
  return (
    <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-black/40 backdrop-blur p-6 step-enter relative">
      <Confetti />
      <p className="text-xs text-cyan-400 mb-3 font-mono tracking-widest">
        // QR CODE
      </p>
      <div className="flex justify-center">
        <img
          src={qr}
          alt="QR Code"
          className="w-48 h-48 rounded-xl border border-purple-500/20 img-pop"
        />
      </div>
      <p className="text-xs text-slate-400 mt-4 text-center">
        📱 Scan quickly — QR expires in 60 seconds.{" "}
        <span className="text-cyan-400">WhatsApp → Linked Devices → Link Device</span>
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
                  background: done
                    ? "linear-gradient(135deg, #059669, #10b981)"
                    : active
                    ? "linear-gradient(135deg, #7c3aed, #06b6d4)"
                    : "rgba(255,255,255,0.05)",
                  border: active
                    ? "1px solid #7c3aed"
                    : "1px solid rgba(255,255,255,0.1)",
                  color: active || done ? "white" : "#64748b",
                }}
              >
                {done ? <span className="pop-in inline-block">✓</span> : i + 1}
              </div>
              <span
                className="text-[10px] mt-1 font-medium"
                style={{ color: active ? "#06b6d4" : "#475569" }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="w-8 h-px mb-4 transition-all duration-500"
                style={{
                  background: done
                    ? "linear-gradient(90deg, #059669, #06b6d4)"
                    : "rgba(255,255,255,0.1)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PairingPage() {
  const [step, setStep] = useState(1);
  const [number, setNumber] = useState("");
  const [method, setMethod] = useState("");
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

  const handleMethodSelect = (selected) => {
    setMethod(selected);
    setError("");
    sendRequest(selected);
  };

  const handleNext = () => {
    setError("");
    if (!validate(number)) {
      setError("Enter a valid number (e.g. 255712345678)");
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
        body: JSON.stringify({
          number: number.trim(),
          method: selectedMethod,
          session: number.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to get code");
      }

      if (selectedMethod === "code") {
        setCode(data.code);
      } else {
        setQr(data.qr);
      }
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
    setMethod("");
    setError("");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative"
      style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #0f0a1e 50%, #0a0f1e 100%)" }}
    >
      <Particles />

      <div className="mb-8 text-center z-10 fade-up">
        <h1
          className="text-3xl font-bold tracking-tight mb-1"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            background: "linear-gradient(90deg, #7c3aed, #06b6d4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ⚡ 26-TECH BOT
        </h1>
        <p className="text-slate-500 text-sm">WhatsApp Pairing Portal</p>
      </div>

      <div
        className="w-full max-w-sm z-10 rounded-3xl p-6 border card-in relative overflow-hidden"
        style={{
          background: "rgba(15, 10, 30, 0.7)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(124, 58, 237, 0.25)",
          boxShadow: "0 0 40px rgba(124, 58, 237, 0.15)",
        }}
      >
        <Steps current={step} />

        {step === 1 && (
          <div className="step-enter">
            <p className="text-white font-semibold mb-1 text-sm">
              WhatsApp Number
            </p>
            <p className="text-slate-500 text-xs mb-4">
              Enter your number without + (e.g. 255712345678)
            </p>
            <input
              key={shakeKey}
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
              className={`w-full rounded-xl px-4 py-3 text-white text-sm font-mono outline-none transition-all duration-200 mb-4 ${error ? "shake-once" : ""}`}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: error
                  ? "1px solid #ef4444"
                  : "1px solid rgba(124, 58, 237, 0.3)",
                caretColor: "#06b6d4",
              }}
            />
            {error && (
              <p className="text-red-400 text-xs mb-4 flex items-center gap-1 fade-up">
                <span>⚠</span> {error}
              </p>
            )}
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 btn-glow"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                boxShadow: "0 4px 20px rgba(124, 58, 237, 0.4)",
              }}
            >
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="step-enter">
            <p className="text-white font-semibold mb-1 text-sm">
              Choose Connection Method
            </p>
            <p className="text-slate-500 text-xs mb-5">
              Number: <span className="text-cyan-400 font-mono">{number}</span>
            </p>

            <button
              onClick={() => handleMethodSelect("code")}
              className="w-full mb-3 p-4 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 hover:border-purple-500/60"
              style={{
                background: "rgba(124, 58, 237, 0.08)",
                borderColor: "rgba(124, 58, 237, 0.3)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: "rgba(124, 58, 237, 0.2)" }}
                >
                  🔢
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Pairing Code</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Get an 8-digit code — enter it in WhatsApp
                  </p>
                </div>
                <span className="ml-auto text-purple-400 text-lg">→</span>
              </div>
            </button>

            <button
              onClick={() => handleMethodSelect("qr")}
              className="w-full mb-4 p-4 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 hover:border-cyan-500/60"
              style={{
                background: "rgba(6, 182, 212, 0.08)",
                borderColor: "rgba(6, 182, 212, 0.3)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: "rgba(6, 182, 212, 0.2)" }}
                >
                  📷
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">QR Code</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Scan with WhatsApp camera
                  </p>
                </div>
                <span className="ml-auto text-cyan-400 text-lg">→</span>
              </div>
            </button>

            {error && (
              <p className="text-red-400 text-xs mb-3 flex items-center gap-1 fade-up">
                <span>⚠</span> {error}
              </p>
            )}

            <button
              onClick={() => { setStep(1); setError(""); }}
              className="w-full py-2.5 rounded-xl text-slate-400 text-sm border transition-all duration-200 hover:border-purple-500/50 hover:text-white"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              ← Back
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            {loading && (
              <div className="flex flex-col items-center py-8 gap-4 step-enter">
                <div
                  className="w-12 h-12 rounded-full border-2 border-transparent animate-spin"
                  style={{
                    borderTopColor: "#7c3aed",
                    borderRightColor: "#06b6d4",
                  }}
                />
                <p className="text-slate-300 text-sm">Connecting to WhatsApp...</p>
                <p className="text-slate-500 text-xs font-mono">{number}</p>
              </div>
            )}

            {!loading && code && (
              <div className="step-enter">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10b981" }} />
                  <p className="text-green-400 text-sm font-semibold">Code received!</p>
                </div>
                <CodeDisplay code={code} />
                <button onClick={reset} className="w-full mt-4 py-2.5 rounded-xl text-slate-400 text-sm border transition-all duration-200 hover:border-purple-500/50 hover:text-white hover:-translate-y-0.5" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  ← Try another number
                </button>
              </div>
            )}

            {!loading && qr && (
              <div className="step-enter">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#06b6d4" }} />
                  <p className="text-cyan-400 text-sm font-semibold">QR Code ready!</p>
                </div>
                <QRDisplay qr={qr} />
                <button onClick={reset} className="w-full mt-4 py-2.5 rounded-xl text-slate-400 text-sm border transition-all duration-200 hover:border-purple-500/50 hover:text-white hover:-translate-y-0.5" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  ← Try another number
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-6 text-slate-600 text-xs z-10 text-center fade-up" style={{ animationDelay: "0.2s" }}>
        © 2026 26-TECH · Powered by AI Infrastructure
      </p>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        * { font-family: 'Space Grotesk', sans-serif; box-sizing: border-box; }
        input::placeholder { color: #334155; }

        @keyframes particleFloat {
          0%, 100% { transform: translate(0,0); opacity: 0.1; }
          50% { transform: translate(8px,-16px); opacity: 0.4; }
        }
        .particle-float { animation: particleFloat ease-in-out infinite; }

        @keyframes cardIn {
          0% { opacity: 0; transform: translateY(24px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .card-in { animation: cardIn 0.55s cubic-bezier(0.16,1,0.3,1); }

        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease both; }

        @keyframes stepEnter {
          0% { opacity: 0; transform: translateY(10px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .step-enter { animation: stepEnter 0.35s ease; }

        @keyframes shakeOnce {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .shake-once { animation: shakeOnce 0.4s ease; }

        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.5); }
          50% { box-shadow: 0 0 0 6px rgba(124,58,237,0); }
        }
        .glow-active { animation: glowPulse 2s ease-in-out infinite; }

        @keyframes popIn {
          0% { transform: scale(0); }
          70% { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
        .pop-in { animation: popIn 0.3s ease; }

        @keyframes btnGlow {
          0%, 100% { box-shadow: 0 4px 20px rgba(124,58,237,0.4); }
          50% { box-shadow: 0 4px 28px rgba(6,182,212,0.5); }
        }
        .btn-glow { animation: btnGlow 3s ease-in-out infinite; }

        @keyframes copyPop {
          0% { transform: scale(0.85); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .copy-pop { animation: copyPop 0.35s ease; }

        @keyframes imgPop {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
        .img-pop { animation: imgPop 0.4s ease; }

        .confetti-piece {
          width: 6px; height: 6px; border-radius: 2px;
          animation: confettiBurst 0.9s ease-out forwards;
        }
        @keyframes confettiBurst {
          0% { opacity: 1; transform: translate(0,0) scale(1); }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.4); }
        }
      `}</style>
    </div>
  );
}