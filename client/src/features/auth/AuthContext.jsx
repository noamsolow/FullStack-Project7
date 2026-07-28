import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authService } from "../../services/auth/authService.js";
import {
  clearSession,
  readSession,
  writeSession,
} from "../../utils/session.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [initial] = useState(readSession);
  const [user, setUser] = useState(initial?.user ?? null);
  const [checking, setChecking] = useState(Boolean(initial?.token));

  const logout = useCallback((record = true) => {
    if (record) authService.logout().catch(() => {});
    clearSession();
    setUser(null);
    setChecking(false);
  }, []);

  const acceptSession = useCallback((session) => {
    writeSession(session);
    setUser(session.user);
    setChecking(false);
  }, []);

  useEffect(() => {
    const expire = () => logout(false);
    window.addEventListener("levgo:session-expired", expire);
    return () => window.removeEventListener("levgo:session-expired", expire);
  }, [logout]);

  useEffect(() => {
    if (!initial?.token) {
      setChecking(false);
      return;
    }
    let active = true;
    authService.me()
      .then(({ data }) => {
        if (!active) return;
        const session = { token: initial.token, user: data };
        writeSession(session);
        setUser(data);
      })
      .catch(() => {
        if (active) logout(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({
    user,
    checking,
    isAuthenticated: Boolean(user),
    acceptSession,
    logout,
    setUser,
  }), [acceptSession, checking, logout, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
