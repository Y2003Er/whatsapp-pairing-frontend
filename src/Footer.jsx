// Site-wide footer — rendered once from App.jsx so it appears on every
// view (Home, Pairing, Dashboard, Coming Soon pages), not just the landing
// page. Deliberately NOT rendered on /admin (developer-only, no public
// chrome) or /terms /privacy (LegalPage already has its own minimal footer).
export default function Footer({ onNavigate }) {
  const year = new Date().getFullYear(
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <span className="footer-logo">26</span>
          <div>
            <strong>26-TECH BOT</strong>
            <p>A calmer way to run WhatsApp — connect, automate, and manage your bot from one focused workspace.</p>
          </div>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <small>PRODUCT</small>
            <button type="button" onClick={() => onNavigate?.("pair")}>Connect your bot</button>
            <button type="button" onClick={() => onNavigate?.("dashboard")}>Open workspace</button>
          </div>
          <div className="footer-col">
            <small>COMPANY</small>
            <button type="button" onClick={() => onNavigate?.("contact")}>Contact us</button>
            <button type="button" onClick={() => onNavigate?.("coinshop")}>Coin shop</button>
          </div>
          <div className="footer-col">
            <small>LEGAL</small>
            <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a>
            <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy policy</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} 26-TECH BOT. All rights reserved.</span>
        <span className="footer-status"><span className="footer-dot" /> All systems operational</span>
      </div>

      <style>{`
        .site-footer { position: relative; z-index: 1; width: 100%; padding: clamp(40px, 6vw, 64px) clamp(16px, 4vw, 46px) clamp(28px, 4vw, 40px); background: transparent; }
        .footer-top { width: min(1160px, 100%); margin: 0 auto; display: flex; flex-wrap: wrap; justify-content: space-between; gap: clamp(28px, 5vw, 56px); padding-bottom: clamp(28px, 4vw, 40px); border-top: 1px solid var(--token-border); padding-top: clamp(32px, 5vw, 48px); color: var(--token-muted); }
        .footer-brand { display: flex; gap: 14px; max-width: 340px; }
        .footer-logo { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 11px; background: var(--token-accent-fill); color: var(--token-on-accent); font-family: var(--font-display); font-weight: 700; font-size: .95rem; }
        .footer-brand strong { display: block; color: var(--token-heading); font-family: var(--font-display); font-size: 1.02rem; letter-spacing: -.02em; }
        .footer-brand p { margin: 6px 0 0; font-size: .82rem; line-height: 1.6; }
        .footer-links { display: flex; flex-wrap: wrap; gap: clamp(28px, 5vw, 64px); }
        .footer-col { display: flex; flex-direction: column; gap: 10px; min-width: 120px; }
        .footer-col small { color: var(--token-primary); font-family: var(--font-mono); font-size: .62rem; font-weight: 700; letter-spacing: .1em; margin-bottom: 2px; }
        .footer-col button, .footer-col a { all: unset; cursor: pointer; color: var(--token-muted); font-size: .84rem; transition: color .15s ease; }
        .footer-col button:hover, .footer-col a:hover { color: var(--token-heading); }
        .footer-bottom { width: min(1160px, 100%); margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; color: var(--token-muted); font-size: .74rem; }
        .footer-status { display: inline-flex; align-items: center; gap: 7px; }
        .footer-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--token-success); box-shadow: 0 0 0 4px var(--token-info-bg); }
        @media (max-width: 640px) { .footer-top { flex-direction: column; } .footer-bottom { flex-direction: column; align-items: flex-start; } }
      `}</style>
    </footer>
  );
}
