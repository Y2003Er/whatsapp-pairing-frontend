import { ShieldCheck, FileText } from "lucide-react";

const CONTENT = {
  terms: {
    title: "Terms of Service",
    icon: FileText,
    sections: [
      {
        heading: "1. Kukubali Masharti",
        body: "Kwa kutumia 26-TECH Bot, unakubali masharti haya ya matumizi. Kama hukubaliani na masharti haya, tafadhali usitumie huduma hii.",
      },
      {
        heading: "2. Matumizi ya Huduma",
        body: "26-TECH Bot inatoa huduma za automation kwenye WhatsApp. Huduma hii isitumike kwa shughuli haramu, spam, au unyanyasaji wa watumiaji wengine.",
      },
      {
        heading: "3. Akaunti Yako",
        body: "Wewe unawajibika kulinda usiri wa namba yako ya WhatsApp iliyounganishwa na bot, na shughuli zote zinazofanyika kupitia akaunti yako.",
      },
      {
        heading: "4. Mabadiliko ya Huduma",
        body: "26-TECH Solution inaweza kubadilisha, kusitisha, au kufunga huduma wakati wowote bila taarifa ya awali.",
      },
      {
        heading: "5. Mawasiliano",
        body: "Kwa maswali kuhusu masharti haya, tumia ukurasa wa Contact Us kwenye app.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    icon: ShieldCheck,
    sections: [
      {
        heading: "1. Taarifa Tunazokusanya",
        body: "Tunakusanya namba yako ya WhatsApp, session data inayohitajika kuunganisha bot, na logs za matumizi ya amri (commands) kwa lengo la kuboresha huduma.",
      },
      {
        heading: "2. Jinsi Tunavyotumia Taarifa",
        body: "Taarifa zako hutumika tu kuwezesha muunganiko wa bot na WhatsApp, kutatua matatizo ya kiufundi, na kuboresha uzoefu wako wa matumizi.",
      },
      {
        heading: "3. Usiri wa Taarifa",
        body: "Hatutauza au kushiriki taarifa zako binafsi na wahusika wengine bila ridhaa yako, isipokuwa inavyotakiwa kisheria.",
      },
      {
        heading: "4. Usalama",
        body: "Tunachukua hatua za kiufundi kulinda session keys na data yako, ingawa hakuna mfumo wa kidijitali unaoweza kuhakikisha usalama 100%.",
      },
      {
        heading: "5. Haki Zako",
        body: "Unaweza kuomba kufutwa kwa taarifa zako na kuunganisha upya (unpair) bot wakati wowote kupitia dashboard yako.",
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
          background: var(--token-background, #0b0b0f);
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
