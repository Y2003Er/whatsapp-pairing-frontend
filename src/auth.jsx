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
  // This accepts only a value returned by an authenticated backend response.
  // It deliberately contains no client-side tier rules or package mapping.
  const updateMembership = useCallback((membership) => {
    const tier = membership?.tier || membership?.membershipTier;
    if (!tier) return;
    setSession((current) => {
      if (!current || current.membershipTier === tier) return current;
      const next = { ...current, membershipTier: tier };
      localStorage.setItem(OWNER_STORAGE, JSON.stringify(next));
      return next;
    });
  }, []);

  const refreshProfile = useCallback(async (current = session) => {
    if (!current?.token || !current?.botId) return null;
    const data = await request(`/bots/${encodeURIComponent(current.botId)}`, { token: current.token });
    const next = { ...current, phoneNumber: data.profile?.phoneNumber || current.phoneNumber, membershipTier: data.profile?.membershipTier || current.membershipTier };
    if (next.phoneNumber !== current.phoneNumber || next.membershipTier !== current.membershipTier) saveSession(next);
    return next;
  }, [saveSession, session]);

  useEffect(() => {
    let active = true;
    if (!session?.token) { setReady(true); return undefined; }
    const validate = async () => {
      try { await request("/wallet", { token: session.token }); await refreshProfile(session); }
      catch (error) { if (error.status === 401 && active) clearSession(); }
      finally { if (active) setReady(true); }
    };
    void validate();
    const interval = window.setInterval(() => { void refreshProfile(session).catch((error) => { if (error.status === 401) clearSession(); }); }, 30000);
    return () => { active = false; window.clearInterval(interval); };
  }, [clearSession, refreshProfile, session]);

  const login = useCallback(async (phoneNumber, password) => {
    const data = await request("/bots/login", { method: "POST", body: { phoneNumber: phoneNumber.trim(), password: password.trim() } });
    const next = { token: data.token, botId: data.botId, phoneNumber: data.phoneNumber, membershipTier: data.membershipTier };
    saveSession(next);
    return next;
  }, [saveSession]);

  const value = useMemo(() => ({ session, ready, login, logout: clearSession, refreshProfile, updateMembership, authenticatedRequest: request }), [clearSession, login, ready, refreshProfile, session, updateMembership]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
