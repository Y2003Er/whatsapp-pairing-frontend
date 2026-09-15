import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

// 🔧 Badilisha link hii kila unapotoa toleo jipya la APK
// (baada ya kuunda GitHub Release mpya na `gh release create`)
const APK_DOWNLOAD_URL =
  "https://github.com/Y2003Er/whatsapp-pairing-frontend/releases/download/v1.0/app-debug.apk";

const DISMISS_KEY = "26tech-install-banner-dismissed";

function isAndroid() {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

// Inagundua kama site tayari inaendesha ndani ya APK yenyewe (Capacitor),
// ili tusionyeshe banner ya "install" kwa watu walioshasakinisha app.
function isRunningInsideApp() {
  if (typeof window === "undefined") return false;
  return !!window.Capacitor;
}

export default function InstallAppBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = window.sessionStorage.getItem(DISMISS_KEY);
      if (dismissed) return;
    } catch {
      /* sessionStorage isn't available, show banner anyway */
    }
    if (isAndroid() && !isRunningInsideApp()) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* best effort */
    }
  };

  if (!visible) return null;

  return (
    <div className="install-banner" role="dialog" aria-label="Install app">
      <div className="install-banner__icon">
        <Smartphone size={22} />
      </div>
      <div className="install-banner__text">
        <p className="install-banner__title">Sakinisha App</p>
        <p className="install-banner__subtitle">Pata uzoefu bora zaidi na app ya simu</p>
      </div>
      <a
        href={APK_DOWNLOAD_URL}
        className="install-banner__cta"
        download
      >
        <Download size={16} />
        Install
      </a>
      <button
        type="button"
        className="install-banner__close"
        aria-label="Funga"
        onClick={handleDismiss}
      >
        <X size={18} />
      </button>
    </div>
  );
}