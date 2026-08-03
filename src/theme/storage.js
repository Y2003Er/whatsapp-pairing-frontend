const STORAGE_KEY = "26tech-theme";
const FAVORITES_KEY = "26tech-theme-favorites";
const RECENTS_KEY = "26tech-theme-recents";

export function readTheme() {
  try {
    if (typeof window === "undefined") return null;
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v;
  } catch (e) {
    // localStorage unavailable (private mode, disabled, etc.)
    return null;
  }
}

export function writeTheme(id) {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.setItem(STORAGE_KEY, id);
    return true;
  } catch (e) {
    // ignore storage errors
    return false;
  }
}

function readList(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeList(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage is best-effort */ }
}

export function readThemeFavorites() {
  if (typeof window === "undefined") return [];
  return readList(FAVORITES_KEY);
}

export function writeThemeFavorites(ids) { writeList(FAVORITES_KEY, ids); }

export function readRecentThemes() {
  if (typeof window === "undefined") return [];
  return readList(RECENTS_KEY);
}

export function addRecentTheme(id) {
  if (typeof window === "undefined") return;
  writeList(RECENTS_KEY, [id, ...readList(RECENTS_KEY).filter((item) => item !== id)].slice(0, 5));
}
