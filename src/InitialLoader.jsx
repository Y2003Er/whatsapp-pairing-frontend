import { useEffect, useState } from "react";

const DISPLAY_MS = 900;
const EXIT_MS = 280;

export default function InitialLoader() {
  const [phase, setPhase] = useState("enter");

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setPhase("exit"), DISPLAY_MS);
    const removeTimer = window.setTimeout(() => setPhase("done"), DISPLAY_MS + EXIT_MS);
    return () => { window.clearTimeout(exitTimer); window.clearTimeout(removeTimer); };
  }, []);

  if (phase === "done") return null;

  return (
    <div className={`initial-loader initial-loader--${phase}`} role="status" aria-label="Loading 26-TECH Bot">
      <div className="initial-loader-card">
        <div className="initial-loader-logo" aria-hidden="true"><span>26</span></div>
        <strong>26-TECH <em>BOT</em></strong>
        <span className="initial-loader-label">Preparing your workspace</span>
        <span className="initial-loader-progress" aria-hidden="true"><i /></span>
      </div>
    </div>
  );
}
