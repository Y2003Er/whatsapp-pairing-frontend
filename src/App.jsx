import { useState } from "react";
import { Coins, Zap, ShieldCheck, Mail } from "lucide-react";
import AppNav from "./Sidebar";
import Home from "./Home";
import PairingPage from "./PairingPage";
import Dashboard from "./Dashboard";
import ComingSoon from "./ComingSoon";
import { ToastContainer } from "./Toast";

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

export default function App() {
  const [view, setView] = useState("home");

  return (
    <div className="app-shell">
      <ToastContainer />
      <AppNav view={view} setView={setView} />

      {view === "home" && (
        <Home onGoConnect={() => setView("pair")} onGoSettings={() => setView("dashboard")} />
      )}
      {view === "pair" && <PairingPage />}
      {view === "dashboard" && <Dashboard />}
      {COMING_SOON_PAGES[view] && <ComingSoon {...COMING_SOON_PAGES[view]} />}
    </div>
  );
}
