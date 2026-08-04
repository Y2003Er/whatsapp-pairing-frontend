import { Construction } from "lucide-react";

export default function ComingSoon({ title, description, icon: Icon = Construction }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "transparent",
      }}
      className="flex flex-col items-center justify-center px-4 text-center"
    >
      <div className="cs-icon">
        <Icon size={26} />
      </div>
      <h1 className="cs-title">{title}</h1>
      <p className="cs-desc">{description}</p>
      <span className="cs-badge">Coming Soon</span>

      <style>{`
        .cs-icon {
          width: 64px; height: 64px; border-radius: 18px;
          background: var(--token-info-bg); border: 1px solid var(--token-info-border);
          display: flex; align-items: center; justify-content: center;
          color: var(--token-info); margin-bottom: 18px;
        }
        .cs-title { color: var(--token-text); font-weight: 800; font-size: 1.5rem; margin-bottom: 8px; }
        .cs-desc { color: var(--token-muted); font-size: 0.88rem; max-width: 340px; line-height: 1.6; margin-bottom: 18px; }
        .cs-badge {
          display: inline-flex; align-items: center; padding: 7px 16px; border-radius: 999px;
          background: var(--token-card); border: 1px solid var(--token-card-border);
          color: var(--token-muted); font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          font-family: var(--font-mono);
        }
      `}</style>
    </div>
  );
}
