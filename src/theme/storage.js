const STORAGE_KEY = "26tech-theme";

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
