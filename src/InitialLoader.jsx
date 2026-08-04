import { useEffect, useState } from "react";

const MIN_DISPLAY_MS = 2000;
const EXIT_MS = 420;

function whenReady() {
  const pageReady = document.readyState === "complete"
    ? Promise.resolve()
    : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
  const fontsReady = document.fonts?.ready ?? Promise.resolve();
  return Promise.all([pageReady, fontsReady]);
}

export default function InitialLoader() {
  const [phase, setPhase] = useState("enter");

  useEffect(() => {
    let removeTimer;
    let active = true;
    const minimumDuration = new Promise((resolve) => window.setTimeout(resolve, MIN_DISPLAY_MS));
    Promise.all([minimumDuration, whenReady()]).then(() => {
      if (!active) return;
      setPhase("exit");
      removeTimer = window.setTimeout(() => { if (active) setPhase("done"); }, EXIT_MS);
    });
    return () => { active = false; window.clearTimeout(removeTimer); };
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
