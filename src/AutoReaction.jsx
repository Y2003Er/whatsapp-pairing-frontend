import { Zap, Heart, Users, ShieldCheck } from "lucide-react";

// Standalone info page for the Auto Reaction feature. Deliberately kept
// separate from OwnerSettings/Dashboard — this page isn't tied to a single
// paired bot or its settings form; it just explains what the feature does
// and where to turn it on. Toggling itself happens per-bot in Settings
// (Basic Settings → "Auto React Messages") and, for channels, is controlled
// by the newsletterAutoReact settings on the backend.
export default function AutoReaction({ onNavigate }) {
  return (
    <div
      style={{ minHeight: "100dvh", background: "transparent" }}
      className="flex flex-col items-center justify-center px-4 text-center"
    >
      <div className="cs-icon">
        <Zap size={26} />
      </div>
      <h1 className="cs-title">Auto Reaction</h1>
      <p className="cs-desc">
        Your bot can react automatically — to regular messages (private/group)
        and now also to posts in any <strong>Channel (Newsletter)</strong> it
        follows, without needing to be an admin.
      </p>
      <span className="cs-badge cs-badge-live">Live</span>

      <div className="ar-cards">
        <div className="ar-card">
          <Users size={18} />
          <h3>Messages &amp; Groups</h3>
          <p>Automatically react with an emoji to private or group messages.</p>
        </div>
        <div className="ar-card">
          <Heart size={18} />
          <h3>Channel Auto-React</h3>
          <p>The bot reacts to every new post in the channels it follows — no admin required.</p>
        </div>
      </div>

      <button type="button" className="ar-settings-btn" onClick={() => onNavigate?.("dashboard")}>
        <ShieldCheck size={15} />
        Turn it on in your bot's Settings
      </button>

      <style>{`
        .cs-icon {
          width: 64px; height: 64px; border-radius: 18px;
          background: var(--token-info-bg); border: 1px solid var(--token-info-border);
          display: flex; align-items: center; justify-content: center;
          color: var(--token-info); margin-bottom: 18px;
        }
        .cs-title { color: var(--token-text); font-weight: 800; font-size: 1.5rem; margin-bottom: 8px; }
        .cs-desc { color: var(--token-muted); font-size: 0.88rem; max-width: 380px; line-height: 1.6; margin-bottom: 18px; }
        .cs-badge {
          display: inline-flex; align-items: center; padding: 7px 16px; border-radius: 999px;
          background: var(--token-card); border: 1px solid var(--token-card-border);
          color: var(--token-muted); font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          font-family: var(--font-mono);
        }
        .cs-badge-live {
          background: var(--token-success-bg); border-color: var(--token-success-border, var(--token-success));
          color: var(--token-success);
        }
        .ar-cards {
          display: flex; flex-wrap: wrap; gap: 12px; justify-content: center;
          max-width: 480px; margin: 24px 0 8px;
        }
        .ar-card {
          background: var(--token-card); border: 1px solid var(--token-card-border);
          border-radius: 14px; padding: 16px; width: 200px; text-align: left;
          color: var(--token-text);
        }
        .ar-card svg { color: var(--token-info); margin-bottom: 8px; }
        .ar-card h3 { font-size: 0.85rem; font-weight: 700; margin-bottom: 4px; }
        .ar-card p { font-size: 0.75rem; color: var(--token-muted); line-height: 1.5; }
        .ar-settings-btn {
          margin-top: 18px; display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 18px; border-radius: 999px; border: 1px solid var(--token-card-border);
          background: var(--token-card); color: var(--token-text); font-size: 0.82rem; font-weight: 600;
          cursor: pointer;
        }
        .ar-settings-btn:hover { background: var(--token-card-strong); }
      `}</style>
    </div>
  );
}
