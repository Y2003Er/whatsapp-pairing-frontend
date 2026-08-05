import { useCallback, useEffect, useState } from "react";
import { Zap, ShieldCheck } from "lucide-react";
import AppNav from "./Sidebar";
import Home from "./Home";
import PairingPage from "./PairingPage";
import Dashboard from "./Dashboard";
import AdminPanel from "./AdminPanel";
import ComingSoon from "./ComingSoon";
import ContactPage from "./ContactPage";
import { ToastContainer } from "./Toast";
import LegalPage from "./LegalPage";
import Footer from "./Footer";
import WalletMarketplace from "./WalletMarketplace";

const COMING_SOON_PAGES = {
  autoreaction: {
    title: "Auto Reaction",
    icon: Zap,
    description: "Automatically react with emoji to selected words in groups or direct messages.",
  },
  admin: {
    title: "Admin Team",
    icon: ShieldCheck,
    description: "Meet the team behind 26-TECH Bot and learn how to contact them directly.",
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

const VIEW_STORAGE_KEY = "26tech-active-view";
const VIEW_STATE_KEY = "26techView";
const VALID_VIEWS = new Set(["home", "pair", "dashboard", "coinshop", "contact", ...Object.keys(COMING_SOON_PAGES)]);

function savedView() {
  if (typeof window === "undefined") return "home";
  try {
    const historyView = window.history.state?.[VIEW_STATE_KEY];
    if (VALID_VIEWS.has(historyView)) return historyView;
    const storedView = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (VALID_VIEWS.has(storedView)) return storedView;
  } catch { /* storage/history unavailable */ }
  return "home";
}

export default function App() {
  const [view, setView] = useState(savedView);

  const navigateView = useCallback((nextView) => {
    if (!VALID_VIEWS.has(nextView)) return;
    try {
      window.history.pushState({ ...window.history.state, [VIEW_STATE_KEY]: nextView }, "");
      window.localStorage.setItem(VIEW_STORAGE_KEY, nextView);
    } catch { /* navigation still works when persistence is unavailable */ }
    setView(nextView);
  }, []);

  useEffect(() => {
    try {
      window.history.replaceState({ ...window.history.state, [VIEW_STATE_KEY]: view }, "");
      window.localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch { /* best effort */ }

    const onPopState = (event) => {
      const nextView = event.state?.[VIEW_STATE_KEY];
      if (!VALID_VIEWS.has(nextView)) return;
      setView(nextView);
      try { window.localStorage.setItem(VIEW_STORAGE_KEY, nextView); } catch { /* best effort */ }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [view]);

  return (
      <div className="app-shell">
        <ToastContainer />
        {IS_ADMIN_ROUTE ? <AdminPanel /> : LEGAL_ROUTE ? <LegalPage page={LEGAL_ROUTE} /> : <>
          <AppNav view={view} setView={navigateView} />
          <main className="page-transition" key={view} tabIndex={-1} aria-live="polite">
            {view === "home" && <Home onGoConnect={() => navigateView("pair")} onGoSettings={() => navigateView("dashboard")} onNavigate={navigateView} />}
            {view === "pair" && <PairingPage onNavigate={navigateView} />}
            {view === "dashboard" && <Dashboard onNavigate={navigateView} />}
            {view === "contact" && <ContactPage />}
            {view === "coinshop" && <WalletMarketplace onNavigate={navigateView} />}
            {COMING_SOON_PAGES[view] && <ComingSoon {...COMING_SOON_PAGES[view]} />}
          </main>
          <Footer onNavigate={navigateView} />
        </>}
      </div>
  );
}
