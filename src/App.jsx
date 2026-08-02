import { useState } from "react";
import { Smartphone, LayoutDashboard } from "lucide-react";
import PairingPage from "./PairingPage";
import Dashboard from "./Dashboard";
import { ToastContainer } from "./Toast";

export default function App() {
  const [view, setView] = useState("pair");

  return (
    <div className="app-shell">
      <ToastContainer />

      <nav className="nav-pill">
        <button
          className={view === "pair" ? "active" : ""}
          onClick={() => setView("pair")}
          type="button"
        >
          <Smartphone size={13} /> Pairing
        </button>
        <button
          className={view === "dashboard" ? "active" : ""}
          onClick={() => setView("dashboard")}
          type="button"
        >
          <LayoutDashboard size={13} /> Dashboard
        </button>
      </nav>

      {view === "pair" ? <PairingPage /> : <Dashboard />}

      <style>{`
        .nav-pill {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          display: flex;
          gap: 4px;
          background: rgba(15,10,40,0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.16);
          border-radius: 999px;
          padding: 4px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        .nav-pill button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 999px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.55);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Inter', system-ui, sans-serif;
          transition: 0.2s ease;
        }
        .nav-pill button:hover { color: rgba(255,255,255,0.85); }
        .nav-pill button.active {
          background: linear-gradient(135deg,#ec4899,#8b5cf6);
          color: white;
        }
      `}</style>
    </div>
  );
}
