import { useEffect, useRef } from "react";

const random = (min, max) => min + Math.random() * (max - min);

function createNetwork(count, width, height, layer) {
  return Array.from({ length: count }, () => ({ x: Math.random() * width, y: Math.random() * height, vx: random(-1, 1) * layer.speed, vy: random(-1, 1) * layer.speed, phase: Math.random() * Math.PI * 2 }));
}
function createStarfall(width, height) {
  const dust = Array.from({ length: 25 }, () => ({ x: Math.random() * width, y: Math.random() * height, radius: random(2, 5), speed: random(.06, .16), alpha: random(.08, .18) }));
  const stars = Array.from({ length: 55 }, () => ({ x: Math.random() * width, y: Math.random() * height, radius: random(.7, 2.2), speed: random(.18, .53), drift: random(-.12, .12), alpha: random(.45, .95), phase: random(0, Math.PI * 2) }));
  return { dust, stars };
}

export default function ParticleBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current; const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return undefined;
    let frame = null; let active = !document.hidden; let width = 0; let height = 0; let dpr = 1; let network; let starfall; let last = performance.now();
    const currentTheme = () => document.documentElement.dataset.theme === "warmStone" ? "warmStone" : "slateIndigo";
    const resize = () => { dpr = Math.min(window.devicePixelRatio || 1, 2); width = window.innerWidth; height = window.innerHeight; canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); network = [createNetwork(28, width, height, { speed: .15 }), createNetwork(30, width, height, { speed: .35 })]; starfall = createStarfall(width, height); };
    const drawNetwork = (time, step) => {
      const layers = [{ radius: 1.1, speed: .15, blur: 6, alpha: .35 }, { radius: 1.8, speed: .35, blur: 12, alpha: .95 }];
      layers.forEach((layer, index) => { const nodes = network[index]; nodes.forEach((node) => { node.x += node.vx * step; node.y += node.vy * step; if (node.x < -8 || node.x > width + 8) node.vx *= -1; if (node.y < -8 || node.y > height + 8) node.vy *= -1; }); ctx.lineWidth = .65; for (let i = 0; i < nodes.length; i += 1) for (let j = i + 1; j < nodes.length; j += 1) { const dx = nodes[i].x - nodes[j].x; const dy = nodes[i].y - nodes[j].y; const distance = Math.hypot(dx, dy); const limit = 105; if (distance < limit) { ctx.strokeStyle = `rgba(129,140,248,${(1 - distance / limit) * layer.alpha * .34})`; ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke(); } } nodes.forEach((node) => { const pulse = 1 + Math.sin(time / 700 + node.phase) * .3; ctx.shadowBlur = layer.blur; ctx.shadowColor = "rgba(165,168,255,.9)"; ctx.fillStyle = `rgba(165,168,255,${layer.alpha})`; ctx.beginPath(); ctx.arc(node.x, node.y, layer.radius * pulse, 0, Math.PI * 2); ctx.fill(); }); });
    };
    const drawStarfall = (time, step) => { const respawn = (p) => { p.y = -8; p.x = Math.random() * width; }; starfall.dust.forEach((p) => { p.y += p.speed * step; if (p.y > height + p.radius) respawn(p); ctx.fillStyle = `rgba(255,244,224,${p.alpha})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill(); }); starfall.stars.forEach((p) => { p.y += p.speed * step; p.x += p.drift * step; if (p.y > height + p.radius) respawn(p); const alpha = p.alpha * (.55 + .45 * Math.sin(time / 750 + p.phase)); ctx.shadowBlur = 8; ctx.shadowColor = "rgba(255,244,224,.7)"; ctx.fillStyle = `rgba(255,244,224,${alpha})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill(); }); };
    const draw = (time) => { if (!active) { frame = null; return; } const step = Math.min(2.5, (time - last) / 16.667); last = time; ctx.clearRect(0, 0, width, height); ctx.shadowBlur = 0; currentTheme() === "warmStone" ? drawStarfall(time, step) : drawNetwork(time, step); ctx.shadowBlur = 0; frame = requestAnimationFrame(draw); };
    const onVisibility = () => { active = !document.hidden; if (active) { last = performance.now(); if (frame === null) frame = requestAnimationFrame(draw); } else if (frame !== null) { cancelAnimationFrame(frame); frame = null; } };
    resize(); window.addEventListener("resize", resize, { passive: true }); document.addEventListener("visibilitychange", onVisibility); if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { active = false; ctx.clearRect(0, 0, width, height); } else frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);
  return <canvas ref={canvasRef} className="global-canvas" aria-hidden="true" />;
}
