import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

const ApkInstaller = Capacitor.registerPlugin("ApkInstaller");

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
        console.error("Update check failed:", err);
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

      let message = "Unknown update error";

      if (typeof err === "string") {
        message = err;
      } else if (err?.message) {
        message = err.message;
      } else if (err?.errorMessage) {
        message = err.errorMessage;
      } else {
        try {
          message = JSON.stringify(err);
        } catch {
          message = String(err);
        }
      }

      setError(message);
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
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background: "rgba(0, 0, 0, 0.72)",
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "30px 22px 24px",
    borderRadius: "24px",
    background: "#ffffff",
    color: "#111827",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
    boxSizing: "border-box",
  },

  icon: {
    width: "58px",
    height: "58px",
    margin: "0 auto 16px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#e8f5e9",
    color: "#15803d",
    fontSize: "28px",
    fontWeight: 700,
  },

  title: {
    margin: "0 0 10px",
    color: "#111827",
    fontSize: "24px",
    lineHeight: 1.2,
    fontWeight: 800,
  },

  version: {
    margin: "0 0 12px",
    color: "#374151",
    fontSize: "16px",
    lineHeight: 1.4,
  },

  description: {
    margin: "0 0 18px",
    color: "#4b5563",
    fontSize: "14px",
    lineHeight: 1.55,
  },

  error: {
    margin: "0 0 16px",
    padding: "12px",
    borderRadius: "10px",
    background: "#fee2e2",
    color: "#991b1b",
    fontSize: "13px",
    lineHeight: 1.45,
    textAlign: "left",
    wordBreak: "break-word",
  },

  updateButton: {
    width: "100%",
    padding: "14px 16px",
    border: "none",
    borderRadius: "12px",
    background: "#16a34a",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(22, 163, 74, 0.28)",
  },

  laterButton: {
    marginTop: "10px",
    width: "100%",
    padding: "12px",
    border: "none",
    background: "transparent",
    color: "#4b5563",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
};
