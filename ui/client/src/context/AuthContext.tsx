import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { SafeUser } from "@shared/schema";

interface AuthState {
  user: SafeUser | null;
  loading: boolean;
  needsSetup: boolean;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setup: (username: string, email: string, password: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, needsSetup: false });

  const refresh = useCallback(async () => {
    try {
      // First check if setup is needed
      const setupRes = await apiRequest("GET", "/api/auth/setup-status").then((r) => r.json());
      if (setupRes.needsSetup) {
        setState({ user: null, loading: false, needsSetup: true });
        return;
      }
      // Try to restore session from cookie
      const meRes = await apiRequest("GET", "/api/auth/me");
      if (meRes.ok) {
        const user = await meRes.json();
        setState({ user, loading: false, needsSetup: false });
      } else {
        setState({ user: null, loading: false, needsSetup: false });
      }
    } catch {
      setState({ user: null, loading: false, needsSetup: false });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (username: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { username, password });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || "Login failed");
    }
    const { user } = await res.json();
    setState((s) => ({ ...s, user, needsSetup: false }));
  };

  const logout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    setState((s) => ({ ...s, user: null }));
  };

  const setup = async (username: string, email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/setup", { username, email, password });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || "Setup failed");
    }
    const { user } = await res.json();
    setState({ user, loading: false, needsSetup: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setup, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
