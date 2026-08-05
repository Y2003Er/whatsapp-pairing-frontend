import { useEffect, useState } from "react";

const MIN_VISIBLE_MS = 650;
const EXIT_MS = 420;

function whenReady() {
  const pageReady = document.readyState === "complete"
    ? Promise.resolve()
    : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
  // Font loading can remain pending on mobile Safari even when the app is
  // already usable. The loader tracks document readiness instead of a font
  // promise that can make the transition appear frozen.
  return pageReady;
}

export default function InitialLoader() {
  const [phase, setPhase] = useState("enter");
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    let removeTimer;
    let startTimer;
    let active = true;
    // Let the loader commit and paint before waiting on any page work. Two
    // frames avoids a mobile navigation race where the exit state wins before
    // the initial animation has been composited.
    const start = () => {
      const shownAt = performance.now();
      whenReady().then(() => {
        const remaining = Math.max(0, MIN_VISIBLE_MS - (performance.now() - shownAt));
        startTimer = window.setTimeout(() => {
          if (!active) return;
          setPhase("exit");
          removeTimer = window.setTimeout(() => { if (active) setPhase("done"); }, EXIT_MS);
        }, remaining);
      });
    };
    let frame = window.requestAnimationFrame(() => { frame = window.requestAnimationFrame(() => { if (active) start(); }); });
    return () => { active = false; window.cancelAnimationFrame(frame); window.clearTimeout(startTimer); window.clearTimeout(removeTimer); };
  }, []);

  if (phase === "done") return null;

  return (
    <div className={`initial-loader initial-loader--${phase}`} role="status" aria-label="Loading 26-TECH Bot">
      <div className="initial-loader-card">
        <div className="initial-loader-logo" aria-hidden="true">
          {videoFailed ? (
            <img src="/robot-logo.jpg" alt="" />
          ) : (
            <video
              src="/robot-loading.mp4"
              poster="/robot-logo.jpg"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onError={() => setVideoFailed(true)}
            />
          )}
        </div>
        <strong>26-TECH <em>BOT</em></strong>
        <span className="initial-loader-label">Preparing your workspace</span>
        <span className="initial-loader-progress" aria-hidden="true"><i /></span>
      </div>
    </div>
  );
}
