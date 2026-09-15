import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

const FALLBACK_VERSION = "1.0.1";

const RELEASES_URL =
  "https://api.github.com/repos/Y2003Er/whatsapp-pairing-frontend/releases/latest";

function compareVersions(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }

  return 0;
}

function getApkInstaller() {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  return Capacitor.registerPlugin("ApkInstaller");
}

export default function UpdateChecker() {
  const [update, setUpdate] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkForUpdate() {
      try {
        const appInfo = await App.getInfo();
        const currentVersion = appInfo.version || FALLBACK_VERSION;

        const response = await fetch(RELEASES_URL, {
          headers: {
            Accept: "application/vnd.github+json",
          },
        });

        if (!response.ok) return;

        const release = await response.json();
        const latestVersion = release.tag_name?.replace(/^v/, "");

        if (
          latestVersion &&
          compareVersions(latestVersion, currentVersion) > 0
        ) {
          const apk = release.assets?.find((asset) =>
            asset.name?.toLowerCase().endsWith(".apk")
          );

          if (!apk?.browser_download_url) return;

          setUpdate({
            version: latestVersion,
            notes: release.body || "",
            downloadUrl: apk.browser_download_url,
          });
        }
      } catch (err) {
        console.log("Update check failed:", err);
      }
    }

    if (Capacitor.isNativePlatform()) {
      checkForUpdate();
    }
  }, []);

  async function handleUpdate() {
    if (!update?.downloadUrl || downloading) return;

    setDownloading(true);
    setError("");

    try {
      const ApkInstaller = getApkInstaller();

      if (!ApkInstaller) {
        throw new Error("APK installer is not available.");
      }

      const result = await ApkInstaller.download({
        url: update.downloadUrl,
      });

      if (!result?.filePath) {
        throw new Error("APK download completed without a file.");
      }

      await ApkInstaller.install({
        filePath: result.filePath,
      });
    } catch (err) {
      console.error("Update installation failed:", err);
      setError(
        "Update failed. Please try again or download the APK manually."
      );
      setDownloading(false);
    }
  }

  if (!update) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.icon}>↻</div>

        <h2 style={styles.title}>Update Available</h2>

        <p style={styles.version}>
          Version <strong>{update.version}</strong> is now available.
        </p>

        <p style={styles.description}>
          A newer version of 26 Tech Bot is ready. Update now to get the
          latest improvements and fixes.
        </p>

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={{
            ...styles.updateButton,
            opacity: downloading ? 0.7 : 1,
          }}
          onClick={handleUpdate}
          disabled={downloading}
        >
          {downloading ? "DOWNLOADING..." : "UPDATE NOW"}
        </button>

        {!downloading && (
          <button
            style={styles.laterButton}
            onClick={() => setUpdate(null)}
          >
            LATER
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 99999,
    background: "rgba(0,0,0,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 390,
    borderRadius: 24,
    padding: 28,
    background: "#111827",
    color: "#fff",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  },

  icon: {
    width: 64,
    height: 64,
    margin: "0 auto 18px",
    borderRadius: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#2563eb",
    fontSize: 32,
  },

  title: {
    margin: "0 0 8px",
    fontSize: 24,
    fontWeight: 700,
  },

  version: {
    margin: "0 0 14px",
    color: "#93c5fd",
  },

  description: {
    margin: "0 0 24px",
    lineHeight: 1.5,
    color: "#d1d5db",
  },

  error: {
    margin: "0 0 16px",
    color: "#fca5a5",
    fontSize: 14,
    lineHeight: 1.4,
  },

  updateButton: {
    width: "100%",
    border: 0,
    borderRadius: 14,
    padding: "14px 18px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },

  laterButton: {
    width: "100%",
    marginTop: 10,
    border: 0,
    borderRadius: 14,
    padding: "12px 18px",
    background: "transparent",
    color: "#9ca3af",
    fontWeight: 600,
    cursor: "pointer",
  },
};
