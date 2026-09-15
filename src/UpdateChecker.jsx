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
    background: "var(--token-backdrop)",
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "28px 22px 24px",
    borderRadius: "var(--token-radius)",
    background: "var(--token-card)",
    color: "var(--token-text)",
    border: "1px solid var(--token-card-border)",
    textAlign: "center",
    boxShadow: "var(--token-shadow)",
    boxSizing: "border-box",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
  },

  icon: {
    width: "56px",
    height: "56px",
    margin: "0 auto 16px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--token-info-bg)",
    color: "var(--token-primary)",
    border: "1px solid var(--token-info-border)",
    fontSize: "28px",
    fontWeight: 700,
  },

  title: {
    margin: "0 0 10px",
    color: "var(--token-heading)",
    fontSize: "24px",
    lineHeight: 1.2,
    fontWeight: 800,
  },

  version: {
    margin: "0 0 12px",
    color: "var(--token-text-secondary)",
    fontSize: "16px",
    lineHeight: 1.4,
  },

  description: {
    margin: "0 0 18px",
    color: "var(--token-text-secondary)",
    fontSize: "14px",
    lineHeight: 1.55,
  },

  error: {
    margin: "0 0 16px",
    padding: "12px",
    borderRadius: "var(--token-radius)",
    background: "var(--token-error-bg)",
    color: "var(--token-error)",
    border: "1px solid color-mix(in srgb, var(--token-error) 30%, transparent)",
    fontSize: "13px",
    lineHeight: 1.45,
    textAlign: "left",
    wordBreak: "break-word",
  },

  updateButton: {
    width: "100%",
    padding: "14px 16px",
    border: "1px solid var(--token-border-strong)",
    borderRadius: "var(--token-radius)",
    background: "var(--token-accent-fill)",
    color: "var(--token-button-text)",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "var(--token-glow)",
  },

  laterButton: {
    marginTop: "10px",
    width: "100%",
    padding: "12px",
    border: "1px solid var(--token-border)",
    borderRadius: "var(--token-radius)",
    background: "transparent",
    color: "var(--token-text-secondary)",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
};
