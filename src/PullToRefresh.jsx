import { useEffect, useRef, useState } from "react";
import { RotateCw } from "lucide-react";

// Custom pull-to-refresh, built entirely with touch events + CSS transforms —
// it does NOT rely on the browser's native overscroll bounce at all (which
// we deliberately disabled site-wide via `overscroll-behavior-y: none` to
// stop the white browser-chrome flash during fast scroll). That means this
// gesture can never reveal that white background, no matter how it's pulled.
const THRESHOLD = 72;   // px the user must pull before release triggers a refresh
const MAX_PULL = 110;   // px — resistance cap so the indicator can't be dragged forever

export default function PullToRefresh({ children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const dragging = useRef(false);

  useEffect(() => {
    const onTouchStart = (e) => {
      // Only arm the gesture when the page is already scrolled to the very
      // top — otherwise this would fight with normal in-page scrolling.
      if (window.scrollY > 0 || refreshing) return;
      startY.current = e.touches[0].clientY;
      dragging.current = true;
    };

    const onTouchMove = (e) => {
      if (!dragging.current || startY.current == null) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) { setPull(0); return; }
      // Diminishing resistance the further you pull, capped at MAX_PULL.
      const resisted = Math.min(MAX_PULL, delta * 0.5);
      setPull(resisted);
    };

    const onTouchEnd = () => {
      if (!dragging.current) return;
      dragging.current = false;
      startY.current = null;
      if (pull >= THRESHOLD) {
        setRefreshing(true);
        setPull(THRESHOLD);
        // A brief pause so the spinner is visible before the reload —
        // purely cosmetic, matches the feel of native pull-to-refresh.
        window.setTimeout(() => window.location.reload(), 380);
      } else {
        setPull(0);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pull, refreshing]);

  const progress = Math.min(1, pull / THRESHOLD);

  return (
    <>
      <div className="ptr-indicator" style={{ height: pull, opacity: pull > 4 ? 1 : 0 }} aria-hidden="true">
        <RotateCw
          size={20}
          className={refreshing ? "ptr-spin" : ""}
          style={{ transform: refreshing ? undefined : `rotate(${progress * 300}deg)`, opacity: 0.35 + progress * 0.65 }}
        />
      </div>
      <div style={{ transform: pull ? `translateY(${pull}px)` : undefined, transition: dragging.current ? "none" : "transform .25s ease" }}>
        {children}
      </div>

      <style>{`
        .ptr-indicator { position: fixed; top: 0; left: 0; right: 0; z-index: 1050; display: flex; align-items: center; justify-content: center; overflow: hidden; color: var(--token-primary); background: transparent; pointer-events: none; transition: opacity .15s ease; }
        .ptr-spin { animation: ptr-rotate .7s linear infinite; }
        @keyframes ptr-rotate { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
