import { ShieldCheck, FileText } from "lucide-react";

const CONTENT = {
  terms: {
    title: "Terms of Service",
    icon: FileText,
    sections: [
      {
        heading: "1. Acceptance of Terms",
        body: "By using 26-TECH Bot, you agree to these Terms of Service. If you do not agree, please do not use this service.",
      },
      {
        heading: "2. Use of the Service",
        body: "26-TECH Bot provides WhatsApp automation services. Do not use this service for illegal activity, spam, or abuse of other users.",
      },
      {
        heading: "3. Your Account",
        body: "You are responsible for protecting the confidentiality of the WhatsApp number connected to your bot and all activity carried out through your account.",
      },
      {
        heading: "4. Changes to the Service",
        body: "26-TECH Solution may modify, suspend, or end the service at any time without prior notice.",
      },
      {
        heading: "5. Contact",
        body: "For questions about these terms, use the Contact Us page in the app.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    icon: ShieldCheck,
    sections: [
      {
        heading: "1. Information We Collect",
        body: "We collect your WhatsApp number, the session data required to connect your bot, and command usage logs to improve the service.",
      },
      {
        heading: "2. How We Use Your Information",
        body: "Your information is used only to enable the connection between your bot and WhatsApp, resolve technical issues, and improve your experience.",
      },
      {
        heading: "3. Confidentiality of Information",
        body: "We do not sell or share your personal information with third parties without your consent, except where required by law.",
      },
      {
        heading: "4. Security",
        body: "We take technical measures to protect session keys and your data, though no digital system can guarantee 100% security.",
      },
      {
        heading: "5. Your Rights",
        body: "You can request deletion of your information and disconnect your bot at any time through your dashboard.",
      },
    ],
  },
};

export default function LegalPage({ page }) {
  const data = CONTENT[page] || CONTENT.terms;
  const Icon = data.icon;

  return (
    <div className="legal-page">
      <div className="legal-card">
        <div className="legal-header">
          <div className="legal-icon"><Icon size={22} /></div>
          <div>
            <p className="legal-brand">26-TECH SOLUTION</p>
            <h1 className="legal-title">{data.title}</h1>
          </div>
        </div>

        {data.sections.map((section) => (
          <section key={section.heading} className="legal-section">
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))}

        <p className="legal-footer">Last updated: {new Date().getFullYear()} · 26-TECH Bot</p>
      </div>

      <style>{`
        .legal-page {
          min-height: 100dvh;
          display: flex;
          justify-content: center;
          padding: 32px 16px;
          background: transparent;
          color: var(--token-text, #eee);
        }
        .legal-card {
          max-width: 640px;
          width: 100%;
        }
        .legal-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 28px;
        }
        .legal-icon {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(120,120,255,0.15);
          color: var(--token-accent, #7b7bff);
          flex-shrink: 0;
        }
        .legal-brand { font-size: 0.68rem; letter-spacing: 0.14em; opacity: 0.6; margin: 0 0 2px; }
        .legal-title { font-size: 1.4rem; font-weight: 800; margin: 0; }
        .legal-section { margin-bottom: 20px; }
        .legal-section h2 { font-size: 0.95rem; font-weight: 700; margin: 0 0 6px; }
        .legal-section p { font-size: 0.87rem; line-height: 1.55; opacity: 0.8; margin: 0; }
        .legal-footer { font-size: 0.72rem; opacity: 0.5; margin-top: 24px; }
      `}</style>
    </div>
  );
}
