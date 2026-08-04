import { useState } from "react";
import { Coins, Zap, ShieldCheck, Mail } from "lucide-react";
import AppNav from "./Sidebar";
import Home from "./Home";
import PairingPage from "./PairingPage";
import Dashboard from "./Dashboard";
import AdminPanel from "./AdminPanel";
import ComingSoon from "./ComingSoon";
import { ToastContainer } from "./Toast";
import LegalPage from "./LegalPage";

const COMING_SOON_PAGES = {
  autoreaction: {
    title: "Auto Reaction",
    icon: Zap,
    description: "Weka emoji za kiotomatiki kwa maneno maalum kwenye group au DM — unapangia hapa hivi karibuni.",
  },
  coinshop: {
    title: "Coin Shop",
    icon: Coins,
    description: "Nunua coins kwa M-Pesa/Tigo Pesa/Airtel Money kisha uzitumie kufungua features za premium.",
  },
  admin: {
    title: "Admin Team",
    icon: ShieldCheck,
    description: "Timu inayosimamia 26-TECH Bot na jinsi ya kuwasiliana nao moja kwa moja.",
  },
  contact: {
    title: "Contact Us",
    icon: Mail,
    description: "Njia za kuwasiliana na 26-TECH Solution kwa msaada, mapendekezo, au ushirikiano.",
  },
};

// Developer-only route. Nobody in the sidebar, header, or menu links here —
// it only opens if someone types /admin directly into the address bar.
const IS_ADMIN_ROUTE =
  typeof window !== "undefined" &&
  window.location.pathname.replace(/\/+$/, "") === "/admin";

// Static-content routes linked from the Terms/Privacy checkbox on the
// pairing page. These must be handled here because the app has no
// client-side router — without this check, /terms and /privacy just
// fall back to index.html (via vercel.json) and render the default "home" view.
const LEGAL_ROUTE =
  typeof window !== "undefined"
    ? { "/terms": "terms", "/privacy": "privacy" }[window.location.pathname.replace(/\/+$/, "")]
    : undefined;

export default function App() {
  const [view, setView] = useState("home");

  return (
      <div className="app-shell">
        <ToastContainer />
        {IS_ADMIN_ROUTE ? <AdminPanel /> : LEGAL_ROUTE ? <LegalPage page={LEGAL_ROUTE} /> : <>
          <AppNav view={view} setView={setView} />
          <main className="page-transition" key={view} tabIndex={-1} aria-live="polite">
            {view === "home" && <Home onGoConnect={() => setView("pair")} onGoSettings={() => setView("dashboard")} />}
            {view === "pair" && <PairingPage />}
            {view === "dashboard" && <Dashboard onNavigate={setView} />}
            {COMING_SOON_PAGES[view] && <ComingSoon {...COMING_SOON_PAGES[view]} />}
          </main>
        </>}
      </div>
  );
}
