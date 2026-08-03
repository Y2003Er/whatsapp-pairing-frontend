import { useState } from "react";
import { Coins, Zap, ShieldCheck, Mail } from "lucide-react";
import AppNav from "./Sidebar";
import Home from "./Home";
import PairingPage from "./PairingPage";
import Dashboard from "./Dashboard";
import AdminPanel from "./AdminPanel";
import ComingSoon from "./ComingSoon";
import { ToastContainer } from "./Toast";
import { ThemeProvider } from "./theme";

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

export default function App() {
  const [view, setView] = useState("home");

  return (
    <ThemeProvider>
      <div className="app-shell">
        <ToastContainer />
        {IS_ADMIN_ROUTE ? <AdminPanel /> : <>
          <AppNav view={view} setView={setView} />
          <main className="page-transition" key={view} tabIndex={-1} aria-live="polite">
            {view === "home" && <Home onGoConnect={() => setView("pair")} onGoSettings={() => setView("dashboard")} />}
            {view === "pair" && <PairingPage />}
            {view === "dashboard" && <Dashboard />}
            {COMING_SOON_PAGES[view] && <ComingSoon {...COMING_SOON_PAGES[view]} />}
          </main>
        </>}
      </div>
    </ThemeProvider>
  );
}
