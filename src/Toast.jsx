import { useState } from "react";
import { AlertTriangle, CheckCircle, X } from "lucide-react";

let _toastId = 0;
let _setToasts = null;

export function toast(msg, kind = "error") {
  if (!_setToasts) return;
  const id = ++_toastId;
  _setToasts((prev) => [...prev, { id, msg, kind }]);
  setTimeout(() => _setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  _setToasts = setToasts;

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-item"
          style={{
            pointerEvents: "auto",
            borderColor: t.kind === "success" ? "rgba(16,185,129,0.35)" : "rgba(251, 113, 133, 0.35)",
          }}
        >
          {t.kind === "success" ? (
            <CheckCircle size={14} style={{ color: "#34d399", flexShrink: 0 }} />
          ) : (
            <AlertTriangle size={14} style={{ color: "#fb7185", flexShrink: 0 }} />
          )}
          <span style={{ flex: 1, fontSize: "0.8rem", color: "rgba(255,255,255,0.9)", fontFamily: "'Inter', sans-serif" }}>
            {t.msg}
          </span>
          <button
            onClick={() => dismiss(t.id)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "rgba(255,255,255,0.4)", display: "flex" }}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
