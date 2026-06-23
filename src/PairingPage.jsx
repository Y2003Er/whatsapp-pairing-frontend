import { useState, useEffect, useRef } from "react";

const BACKEND_URL = "https://26-bot-production.up.railway.app";

const STEPS = [
  { id: 1, label: "Number" },
  { id: 2, label: "Method" },
  { id: 3, label: "Result" },
];

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5B6270" strokeWidth="2">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon({ active }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={active ? "#00D9A3" : "#5B6270"} strokeWidth="1.8">
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  );
}

function NodeIcon({ active }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={active ? "#00D9A3" : "#5B6270"} strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" />
      <circle cx="7" cy="7" r="0.8" fill={active ? "#00D9A3" : "#5B6270"} />
      <circle cx="7" cy="17" r="0.8" fill={active ? "#00D9A3" : "#5B6270"} />
    </svg>
  );
}

function LinkGraphic({ active }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-5">
      <div className="node" style={{ borderColor: active ? "#00D9A3" : "#22262C" }}>
        <PhoneIcon active={active} />
      </div>
      <div className="link-track">
        <div className={`link-fill ${active ? "link-fill-active" : ""}`} />
      </div>
      <div className="node" style={{ borderColor: active ? "#00D9A3" : "#22262C" }}>
        <NodeIcon active={active} />
      </div>
    </div>
  );
}

function ProgressTrack({ current }) {
  return (
    <div className="mb-8">
      <div className="flex gap-1.5">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className="h-[3px] flex-1 rounded-full transition-colors duration-500"
            style={{ background: s.id <= current ? "#00D9A3" : "#22262C" }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2.5">
        {STEPS.map((s) => (
          <span
            key={s.id}
            className="font-mono text-[10px] tracking-widest uppercase"
            style={{ color: s.id <= current ? "#00D9A3" : "#5B6270" }}
          >
            {String(s.id).padStart(2, "0")} {s.label}
          </span>
        ))}
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
      <div className="rounded-lg border px-5 py-4" style={{ borderColor: "#22262C", background: "#0D0F13" }}>
        <p className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: "#5B6270" }}>
          Pairing code
        </p>
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-[26px] tracking-[0.3em]" style={{ color: "#E8EAED" }}>
            {displayed}
            {!done && <span className="cursor-blink">_</span>}
          </span>
          <button
            onClick={copy}
            className="font-mono text-xs px-3 py-1.5 rounded-md border transition-colors"
            style={{
              borderColor: copied ? "#00D9A3" : "#2A2F38",
              color: copied ? "#00D9A3" : "#9AA1AC",
            }}
          >
            {copied ? "copied" : "copy"}
          </button>
        </div>
      </div>
      {done && (
        <p className="font-mono text-[11px] mt-3" style={{ color: "#5B6270" }}>
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
      <div className="rounded-lg border px-5 py-5" style={{ borderColor: "#22262C", background: "#0D0F13" }}>
        <p className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color: "#5B6270" }}>
          Scan to link
        </p>
        <div className="flex justify-center">
          <img src={qr} alt="Pairing QR code" className="w-44 h-44 rounded-md" style={{ border: "1px solid #22262C" }} />
        </div>
      </div>
      <p className="font-mono text-[11px] mt-3" style={{ color: "#5B6270" }}>
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-base relative">
      <div className="w-full max-w-sm z-10">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold"
            style={{ background: "#00D9A3", color: "#0B0D0F" }}
          >
            26
          </div>
          <span className="font-mono text-sm" style={{ color: "#E8EAED" }}>
            TECH<span style={{ color: "#00D9A3" }}>/</span>pairing
          </span>
        </div>
        <div className="flex items-center gap-1.5 mb-7">
          <span className="status-dot" />
          <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: "#5B6270" }}>
            Pairing service online
          </span>
        </div>

        <div className="rounded-xl border panel-in p-6" style={{ background: "#12141A", borderColor: "#22262C" }}>
          <ProgressTrack current={step} />

          {step === 1 && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest mb-2" style={{ color: "#5B6270" }}>
                Device number
              </p>
              <p className="text-[15px] mb-4" style={{ color: "#E8EAED" }}>
                Enter the WhatsApp number to link.
              </p>
              <div
                key={shakeKey}
                className={`flex items-center rounded-lg border px-3 ${error ? "shake-once" : ""}`}
                style={{ borderColor: error ? "#FF5C5C" : "#22262C", background: "#0D0F13" }}
              >
                <span className="font-mono text-sm mr-1" style={{ color: "#5B6270" }}>
                  +
                </span>
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
                  className="w-full bg-transparent py-3 font-mono text-sm outline-none"
                  style={{ color: "#E8EAED", caretColor: "#00D9A3" }}
                />
              </div>
              {error && (
                <p className="font-mono text-[11px] mt-2" style={{ color: "#FF5C5C" }}>
                  {error}
                </p>
              )}
              <button
                onClick={handleNext}
                className="w-full mt-5 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 active:opacity-80"
                style={{ background: "#00D9A3", color: "#0B0D0F" }}
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest mb-2" style={{ color: "#5B6270" }}>
                Connection method
              </p>
              <p className="text-[15px] mb-2" style={{ color: "#E8EAED" }}>
                Number <span className="font-mono" style={{ color: "#00D9A3" }}>+{number}</span>
              </p>

              <div className="mt-3">
                <button onClick={() => handleMethodSelect("code")} className="method-row">
                  <span className="font-mono text-xs w-5" style={{ color: "#5B6270" }}>01</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium" style={{ color: "#E8EAED" }}>Pairing code</p>
                    <p className="text-xs mt-0.5" style={{ color: "#5B6270" }}>8-digit code, entered manually</p>
                  </div>
                  <ChevronIcon />
                </button>
                <button onClick={() => handleMethodSelect("qr")} className="method-row">
                  <span className="font-mono text-xs w-5" style={{ color: "#5B6270" }}>02</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium" style={{ color: "#E8EAED" }}>QR code</p>
                    <p className="text-xs mt-0.5" style={{ color: "#5B6270" }}>Scan with the WhatsApp camera</p>
                  </div>
                  <ChevronIcon />
                </button>
              </div>

              {error && (
                <p className="font-mono text-[11px] mt-4" style={{ color: "#FF5C5C" }}>
                  {error}
                </p>
              )}

              <button
                onClick={() => { setStep(1); setError(""); }}
                className="font-mono text-xs mt-5"
                style={{ color: "#5B6270" }}
              >
                ← back
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              {loading && (
                <div className="flex flex-col items-center py-10 gap-4">
                  <div
                    className="w-7 h-7 rounded-full border-2 animate-spin"
                    style={{ borderColor: "#22262C", borderTopColor: "#00D9A3" }}
                  />
                  <p className="font-mono text-xs" style={{ color: "#5B6270" }}>
                    establishing session…
                  </p>
                </div>
              )}

              {!loading && code && (
                <div>
                  <CodeBlock code={code} />
                  <button onClick={reset} className="font-mono text-xs mt-5" style={{ color: "#5B6270" }}>
                    ← try another number
                  </button>
                </div>
              )}

              {!loading && qr && (
                <div>
                  <QRBlock qr={qr} />
                  <button onClick={reset} className="font-mono text-xs mt-5" style={{ color: "#5B6270" }}>
                    ← try another number
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="font-mono text-[10px] uppercase tracking-widest mt-6 text-center" style={{ color: "#3D424B" }}>
          26-tech · self-hosted pairing infrastructure
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        input::placeholder { color: #3D424B; }

        .bg-base {
          background-color: #0B0D0F;
          background-image:
            radial-gradient(circle at 50% 0%, rgba(0,217,163,0.06), transparent 60%),
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: auto, 32px 32px, 32px 32px;
        }

        .status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #00D9A3;
          animation: statusPulse 2.4s ease-in-out infinite;
        }
        @keyframes statusPulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }

        @keyframes panelIn {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
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

        .cursor-blink { animation: blink 1s steps(1) infinite; color: #00D9A3; }
        @keyframes blink { 50% { opacity: 0; } }

        .node {
          width: 36px; height: 36px; border-radius: 10px;
          border: 1px solid #22262C;
          display: flex; align-items: center; justify-content: center;
          background: #0D0F13;
          transition: border-color .6s ease;
        }
        .link-track {
          width: 56px; height: 2px; background: #22262C;
          position: relative; border-radius: 2px; overflow: hidden;
        }
        .link-fill {
          position: absolute; inset: 0; width: 0%;
          background: #00D9A3;
          transition: width .8s cubic-bezier(.16,1,.3,1);
        }
        .link-fill-active { width: 100%; }

        .method-row {
          width: 100%; display: flex; align-items: center; gap: .75rem;
          padding: 14px 4px;
          border-top: 1px solid #1B1E24;
          background: transparent;
          transition: background .15s ease;
          text-align: left;
        }
        .method-row:first-of-type { border-top: none; }
        .method-row:hover { background: rgba(255,255,255,0.02); }

        button:focus-visible, input:focus-visible {
          outline: 2px solid #00D9A3;
          outline-offset: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}