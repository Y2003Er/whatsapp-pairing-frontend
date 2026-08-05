/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, LoaderCircle, X } from "lucide-react";

let toastId = 0;
let updateToasts = null;
const DEFAULT_DURATION = 5000;
const MAX_VISIBLE = 4;

export function toast(message, kind = "error", options = {}) {
  if (!updateToasts) return null;
  const id = ++toastId;
  updateToasts((current) => [...current, { id, message, kind, duration: options.duration ?? DEFAULT_DURATION }]);
  return id;
}

export function dismissToast(id) {
  updateToasts?.((current) => current.filter((item) => item.id !== id));
}

const toastVisuals = {
  success: { Icon: CheckCircle2, label: "Success" },
  error: { Icon: AlertCircle, label: "Error" },
  warning: { Icon: AlertTriangle, label: "Warning" },
  info: { Icon: Info, label: "Information" },
  loading: { Icon: LoaderCircle, label: "Loading" },
};

function ToastItem({ item, onDismiss }) {
  const { Icon, label } = toastVisuals[item.kind] || toastVisuals.info;
  const [paused, setPaused] = useState(false);
  const remaining = useRef(item.duration);
  const startedAt = useRef(0);
  const timer = useRef(null);

  useEffect(() => {
    if (item.kind === "loading" || paused) return undefined;
    startedAt.current = Date.now();
    timer.current = window.setTimeout(onDismiss, remaining.current);
    return () => window.clearTimeout(timer.current);
  }, [item.kind, onDismiss, paused]);

  const pause = () => {
    if (item.kind === "loading") return;
    remaining.current -= Date.now() - startedAt.current;
    setPaused(true);
  };
  const resume = () => setPaused(false);

  return (
    <div className={`toast-item toast-${item.kind}`} role={item.kind === "error" ? "alert" : "status"} aria-label={label}
      onMouseEnter={pause} onMouseLeave={resume} onFocus={pause} onBlur={resume}>
      <Icon className={item.kind === "loading" ? "spin-icon" : ""} size={18} aria-hidden="true" />
      <span className="toast-message">{item.message}</span>
      <button className="toast-close" type="button" onClick={onDismiss} aria-label={`Dismiss ${label} notification`}><X size={16} /></button>
      {item.kind !== "loading" && <span className={`toast-progress ${paused ? "is-paused" : ""}`} style={{ "--toast-duration": `${item.duration}ms` }} aria-hidden="true" />}
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => { updateToasts = setToasts; return () => { updateToasts = null; }; }, []);
  return <div className="toast-region" aria-live="polite" aria-relevant="additions">
    {toasts.slice(-MAX_VISIBLE).map((item) => <ToastItem key={item.id} item={item} onDismiss={() => dismissToast(item.id)} />)}
  </div>;
}
