import { Construction } from "lucide-react";

export default function ComingSoon({ title, description, icon: Icon = Construction }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: `
          radial-gradient(ellipse at 20% 50%, rgba(236,72,153,0.35) 0%, transparent 55%),
          radial-gradient(ellipse at 80% 30%, rgba(99,102,241,0.35) 0%, transparent 55%),
          linear-gradient(135deg, #0f0c29 0%, #1a103d 40%, #0d1b3e 100%)
        `,
        fontFamily: "'Inter', sans-serif",
      }}
      className="flex flex-col items-center justify-center px-4 text-center"
    >
      <div className="cs-icon">
        <Icon size={26} />
      </div>
      <h1 className="cs-title">{title}</h1>
      <p className="cs-desc">{description}</p>
      <span className="cs-badge">Inakuja Hivi Karibuni</span>

      <style>{`
        .cs-icon {
          width: 64px; height: 64px; border-radius: 18px;
          background: rgba(240,171,252,0.1); border: 1px solid rgba(240,171,252,0.25);
          display: flex; align-items: center; justify-content: center;
          color: #f0abfc; margin-bottom: 18px;
        }
        .cs-title { color: white; font-weight: 800; font-size: 1.5rem; margin-bottom: 8px; }
        .cs-desc { color: rgba(255,255,255,0.55); font-size: 0.88rem; max-width: 340px; line-height: 1.6; margin-bottom: 18px; }
        .cs-badge {
          display: inline-flex; align-items: center; padding: 7px 16px; border-radius: 999px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.6); font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          font-family: 'IBM Plex Mono', monospace;
        }
      `}</style>
    </div>
  );
}
