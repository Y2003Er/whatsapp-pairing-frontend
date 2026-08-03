import { useEffect, useState } from "react";

const PARTICLES = Array.from({ length: 24 }, (_, index) => ({
  id: index,
  size: `${Math.random() * 4 + 1}px`,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  delay: `${Math.random() * 4}s`,
  duration: `${Math.random() * 6 + 5}s`,
  color: ["var(--token-accent)", "var(--token-info)", "var(--token-secondary)"][index % 3],
}));

export default function ParticleBackground() {
  const [isVisible, setIsVisible] = useState(() => typeof document === "undefined" || !document.hidden);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  return <div className={`global-particles ${isVisible ? "" : "is-paused"}`} aria-hidden="true">
    {PARTICLES.map((particle) => <span key={particle.id} className="global-particle" style={{
      width: particle.size, height: particle.size, background: particle.color,
      left: particle.left, top: particle.top,
      animationDelay: particle.delay, animationDuration: particle.duration,
    }} />)}
  </div>;
}
