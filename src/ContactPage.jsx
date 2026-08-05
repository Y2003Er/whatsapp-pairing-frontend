import { Mail, ArrowUpRight } from "lucide-react";
import { FaTiktok, FaInstagram, FaFacebookF, FaYoutube, FaTelegramPlane, FaWhatsapp } from "react-icons/fa";

// ── Contact details for 26-TECH Solution ────────────────────────────
const WHATSAPP_NUMBER = "255617155221";
const WHATSAPP_MESSAGE =
  "Habari! 👋 Karibu 26-TECH Solution\n\nAsante kwa kututumia ujumbe.\n\nTuko hapa kukusaidia.\nUna swali gani? Au unahitaji msaada kuhusu nini?";
const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029VbDt4yWD8SDrWJQ3Yc3l";
const EMAIL_ADDRESS = "26techsolution@gmail.com";
const TELEGRAM_URL = "https://t.me/Kipaji_26";

const WHATSAPP_CHAT_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
const EMAIL_URL = `mailto:${EMAIL_ADDRESS}`;

const SOCIAL_LINKS = [
  { label: "WhatsApp", url: WHATSAPP_CHAT_URL, icon: FaWhatsapp, color: "#fff", bg: "#25D366" },
  { label: "WhatsApp Channel", url: WHATSAPP_CHANNEL_URL, icon: FaWhatsapp, color: "#fff", bg: "#128C7E" },
  { label: "Telegram", url: TELEGRAM_URL, icon: FaTelegramPlane, color: "#fff", bg: "#26A5E4" },
  { label: "TikTok", url: "https://www.tiktok.com/@yusuphhanigomba8", icon: FaTiktok, color: "#fff", bg: "#000" },
  { label: "Instagram", url: "https://www.instagram.com/hanigombayusuph?igsh=MW80dHc2MHFwOWpwOQ==", icon: FaInstagram, color: "#fff", bg: "linear-gradient(135deg,#f58529,#dd2a7b,#8134af)" },
  { label: "Facebook", url: "https://www.facebook.com/share/14j1yXoxNjy/", icon: FaFacebookF, color: "#fff", bg: "#1877F2" },
  { label: "YouTube", url: "https://www.youtube.com/watch?v=LY_-yvKo2dQ", icon: FaYoutube, color: "#fff", bg: "#FF0000" },
];

const PRIMARY_CHANNELS = [
  {
    icon: Mail,
    label: "Email",
    value: EMAIL_ADDRESS,
    hint: "For support or partnerships",
    href: EMAIL_URL,
    accent: "var(--token-warning)",
    accentBg: "var(--token-warning-bg)",
  },
];

function ChannelCard({ icon: Icon, label, value, hint, href, accent, accentBg }) {
  return (
    <a className="contact-card" href={href} target="_blank" rel="noopener noreferrer">
      <span className="contact-card-icon" style={{ color: accent, background: accentBg }}>
        <Icon size={20} />
      </span>
      <span className="contact-card-text">
        <strong>{label}</strong>
        <span className="contact-card-value">{value}</span>
        <span className="contact-card-hint">{hint}</span>
      </span>
      <ArrowUpRight size={16} className="contact-card-arrow" />
    </a>
  );
}

function SocialBadge({ icon: Icon, color, bg }) {
  return (
    <span className="social-badge" style={{ background: bg, color }}>
      <Icon size={13} color={color} />
    </span>
  );
}

function SocialPill({ label, url, icon, color, bg }) {
  if (!url) {
    return (
      <span className="social-pill social-pill-soon">
        <SocialBadge icon={icon} color={color} bg={bg} />
        {label}
        <em>Coming soon</em>
      </span>
    );
  }
  return (
    <a className="social-pill" href={url} target="_blank" rel="noopener noreferrer">
      <SocialBadge icon={icon} color={color} bg={bg} />
      {label}
    </a>
  );
}

export default function ContactPage() {
  return (
    <div className="contact-page">
      <div className="contact-header">
        <span className="contact-header-icon">
          <Mail size={22} />
        </span>
        <h1>Contact Us</h1>
        <p>Get in touch with 26-TECH Solution for support, feedback, or partnerships.</p>
      </div>

      <div className="contact-grid">
        {PRIMARY_CHANNELS.map((channel) => (
          <ChannelCard key={channel.label} {...channel} />
        ))}
      </div>

      <div className="contact-socials">
        <p className="contact-socials-label">Follow us</p>
        <div className="contact-socials-row">
          {SOCIAL_LINKS.map((social) => (
            <SocialPill key={social.label} {...social} />
          ))}
        </div>
      </div>

      <style>{`
        .contact-page { min-height: 100dvh; padding: clamp(28px, 6vw, 56px) clamp(16px, 4vw, 32px); display: flex; flex-direction: column; align-items: center; }
        .contact-header { display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 420px; margin-bottom: clamp(28px, 5vw, 40px); }
        .contact-header-icon { width: 56px; height: 56px; border-radius: 16px; background: var(--token-info-bg); border: 1px solid var(--token-info-border); color: var(--token-info); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .contact-header h1 { color: var(--token-heading); font-weight: 800; font-size: 1.5rem; margin-bottom: 8px; font-family: var(--font-display); }
        .contact-header p { color: var(--token-muted); font-size: 0.88rem; line-height: 1.6; }

        .contact-grid { width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 12px; margin-bottom: clamp(28px, 5vw, 40px); }
        .contact-card {
          display: flex; align-items: center; gap: 14px;
          padding: 16px; border-radius: 16px;
          background: var(--token-card); border: 1px solid var(--token-card-border);
          text-decoration: none; transition: 0.15s ease;
        }
        .contact-card:hover { background: var(--token-hover); border-color: var(--token-border-strong); transform: translateY(-1px); }
        .contact-card-icon { flex-shrink: 0; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .contact-card-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
        .contact-card-text strong { color: var(--token-heading); font-size: 0.92rem; font-weight: 700; }
        .contact-card-value { color: var(--token-text); font-size: 0.82rem; font-family: var(--font-mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .contact-card-hint { color: var(--token-muted); font-size: 0.74rem; }
        .contact-card-arrow { color: var(--token-muted); flex-shrink: 0; }

        .contact-socials { width: 100%; max-width: 480px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .contact-socials-label { color: var(--token-muted); font-size: 0.68rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; font-family: var(--font-mono); }
        .contact-socials-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
        .social-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 999px;
          background: var(--token-card); border: 1px solid var(--token-card-border);
          color: var(--token-text); font-size: 0.78rem; font-weight: 650;
          text-decoration: none; transition: 0.15s ease;
        }
        .social-pill:hover { background: var(--token-hover); }
        .social-pill-soon { color: var(--token-muted); cursor: default; }
        .social-pill-soon em { font-style: normal; font-size: 0.62rem; color: var(--token-muted); background: var(--token-surface-strong); padding: 2px 6px; border-radius: 999px; margin-left: 2px; }
        .social-badge { width: 20px; height: 20px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .social-pill-soon .social-badge { filter: grayscale(1); opacity: 0.55; }
      `}</style>
    </div>
  );
}