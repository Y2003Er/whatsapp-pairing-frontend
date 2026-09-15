import { Capacitor } from "@capacitor/core";

// Same-origin path. Requests never leave 26-tech-bot.vercel.app from the
// browser's point of view — vercel.json proxies "/api/*" to the Railway
// backend at the edge. This is what makes the admin session cookie
// same-origin instead of cross-site, so it survives on every browser
// (Samsung Internet, Safari, Firefox strict mode, etc.) without the person
// needing to change any privacy/cookie settings on their device — those
// settings only ever affected cross-site cookies, and this removes that
// classification entirely for our own traffic.
//
// Inside a Capacitor native app there is no Vercel edge sitting in front
// of the app (the app itself is served from capacitor://localhost /
// https://localhost, not from the vercel.app domain), so the "/api"
// relative path has nothing to resolve against. In that case we call the
// Railway backend directly. Note: this makes the request cross-origin, so
// the admin session cookie must be set with SameSite=None; Secure on the
// backend for it to survive here.
const RAILWAY_BACKEND_URL = "https://pairing-fronted.up.railway.app";

export const BACKEND_URL = Capacitor.isNativePlatform()
  ? RAILWAY_BACKEND_URL
  : "/api";
