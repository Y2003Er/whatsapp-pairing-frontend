import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BACKEND_URL } from "./config";

const OWNER_STORAGE = "26tech_owner_session";
const AuthContext = createContext(null);

async function request(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${BACKEND_URL}${path}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) { const error = new Error(data.error || "Authentication request failed."); error.status = response.status; throw error; }
  return data;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => { try { return JSON.parse(localStorage.getItem(OWNER_STORAGE) || "null"); } catch { return null; } });
  const [ready, setReady] = useState(false);
  const clearSession = useCallback(() => { localStorage.removeItem(OWNER_STORAGE); setSession(null); }, []);
  const saveSession = useCallback((next) => { localStorage.setItem(OWNER_STORAGE, JSON.stringify(next)); setSession(next); }, []);

  useEffect(() => {
    let active = true;
    if (!session?.token) { setReady(true); return undefined; }
    request("/wallet", { token: session.token }).catch((error) => { if (error.status === 401 && active) clearSession(); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [clearSession]);

  const login = useCallback(async (phoneNumber, password) => {
    const data = await request("/bots/login", { method: "POST", body: { phoneNumber: phoneNumber.trim(), password: password.trim() } });
    const next = { token: data.token, botId: data.botId, phoneNumber: data.phoneNumber };
    saveSession(next);
    return next;
  }, [saveSession]);

  const value = useMemo(() => ({ session, ready, login, logout: clearSession, authenticatedRequest: request }), [clearSession, login, ready, session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
