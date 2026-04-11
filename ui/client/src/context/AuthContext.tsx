import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { SafeUser } from "@shared/schema";

interface AuthState {
  user: SafeUser | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  const refresh = useCallback(async () => {
    try {
      const meRes = await apiRequest("GET", "/api/auth/me");
      if (meRes.ok) {
        const user: SafeUser = await meRes.json();
        setState({ user, loading: false });
      } else {
        setState({ user: null, loading: false });
      }
    } catch {
      setState({ user: null, loading: false });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (username: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { username, password });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || "Login failed");
    }
    const { user }: { user: SafeUser } = await res.json();
    setState({ user, loading: false });
  };

  const logout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    setState({ user: null, loading: false });
  };

  const changePassword = async (newPassword: string) => {
    const res = await apiRequest("POST", "/api/auth/change-password", { newPassword });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || "Password change failed");
    }
    const updated: SafeUser = await res.json();
    setState((s) => ({ ...s, user: updated }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, changePassword, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
