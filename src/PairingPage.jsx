import { useState, useEffect, useRef } from "react";

const BACKEND_URL = "https://your-railway-app.up.railway.app";

// Animated background particles
function Particles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20 animate-pulse"
          style={{
            width: `${Math.random() * 4 + 1}px`,
            height: `${Math.random() * 4 + 1}px`,
            background: i % 2 === 0 ? "#7c3aed" : "#06b6d4",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${Math.random() * 3 + 2}s`,
          }}
        />
      ))}
    </div>
  );
}

// Terminal code reveal
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
    <div className="mt-6 rounded-2xl border border-purple-500/30 bg-black/40 backdrop-blur p-6">
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
          {!done && (
            <span className="animate-ping text-cyan-400 opacity-80">|</span>
          )}
        </span>
        <button
          onClick={copy}
          className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
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
        <p className="text-xs text-slate-400 mt-4">
          ⏱ Code inaisha baada ya dakika 3. Weka haraka WhatsApp →{" "}
          <span className="text-cyan-400">
            Settings → Linked Devices → Link Device
          </span>
        </p>
      )}
    </div>
  );
}

// Step indicator
function Steps({ current }) {
  const steps = ["Nambari", "Thibitisha", "Code"];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const active = i + 1 === current;
        const done = i + 1 < current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
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
                {done ? "✓" : i + 1}
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
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (step === 1) inputRef.current?.focus();
  }, [step]);

  const validate = (num) => /^\d{10,15}$/.test(num.trim());

  const handleRequest = async () => {
    setError("");
    if (!validate(number)) {
      setError("Weka nambari sahihi (mfano: 255712345678)");
      return;
    }
    setStep(2);
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: number.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Imeshindwa kupata code");
      }

      setCode(data.code);
      setStep(3);
    } catch (err) {
      setError(err.message);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative"
      style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #0f0a1e 50%, #0a0f1e 100%)" }}
    >
      <Particles />

      {/* Logo */}
      <div className="mb-8 text-center z-10">
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

      {/* Card */}
      <div
        className="w-full max-w-sm z-10 rounded-3xl p-6 border"
        style={{
          background: "rgba(15, 10, 30, 0.7)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(124, 58, 237, 0.25)",
          boxShadow: "0 0 40px rgba(124, 58, 237, 0.15)",
        }}
      >
        <Steps current={step} />

        {/* Step 1 — Weka Nambari */}
        {step === 1 && (
          <div>
            <p className="text-white font-semibold mb-1 text-sm">
              Nambari ya WhatsApp
            </p>
            <p className="text-slate-500 text-xs mb-4">
              Weka nambari yako bila + (mfano: 255712345678)
            </p>
            <input
              ref={inputRef}
              type="tel"
              value={number}
              onChange={(e) => {
                setNumber(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleRequest()}
              placeholder="255712345678"
              maxLength={15}
              className="w-full rounded-xl px-4 py-3 text-white text-sm font-mono outline-none transition-all duration-200 mb-4"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: error
                  ? "1px solid #ef4444"
                  : "1px solid rgba(124, 58, 237, 0.3)",
                caretColor: "#06b6d4",
              }}
            />
            {error && (
              <p className="text-red-400 text-xs mb-4 flex items-center gap-1">
                <span>⚠</span> {error}
              </p>
            )}
            <button
              onClick={handleRequest}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                boxShadow: "0 4px 20px rgba(124, 58, 237, 0.4)",
              }}
            >
              Omba Code →
            </button>
          </div>
        )}

        {/* Step 2 — Loading */}
        {step === 2 && loading && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div
              className="w-12 h-12 rounded-full border-2 border-transparent animate-spin"
              style={{
                borderTopColor: "#7c3aed",
                borderRightColor: "#06b6d4",
              }}
            />
            <p className="text-slate-300 text-sm">Inawasiliana na WhatsApp...</p>
            <p className="text-slate-500 text-xs font-mono">{number}</p>
          </div>
        )}

        {/* Step 3 — Code */}
        {step === 3 && code && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "#10b981" }}
              />
              <p className="text-green-400 text-sm font-semibold">
                Code imepatikana!
              </p>
            </div>
            <CodeDisplay code={code} />
            <button
              onClick={() => {
                setStep(1);
                setCode("");
                setNumber("");
                setError("");
              }}
              className="w-full mt-4 py-2.5 rounded-xl text-slate-400 text-sm border transition-all duration-200 hover:border-purple-500/50 hover:text-white"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              ← Jaribu nambari nyingine
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="mt-6 text-slate-600 text-xs z-10 text-center">
        © 2026 26-TECH · Powered by AI Infrastructure
      </p>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        * { font-family: 'Space Grotesk', sans-serif; box-sizing: border-box; }
        input::placeholder { color: #334155; }
      `}</style>
    </div>
  );
}