// Same-origin path. Requests never leave 26-tech-bot.vercel.app from the
// browser's point of view — vercel.json proxies "/api/*" to the Railway
// backend at the edge. This is what makes the admin session cookie
// same-origin instead of cross-site, so it survives on every browser
// (Samsung Internet, Safari, Firefox strict mode, etc.) without the person
// needing to change any privacy/cookie settings on their device — those
// settings only ever affected cross-site cookies, and this removes that
// classification entirely for our own traffic.
export const BACKEND_URL = "/api";

