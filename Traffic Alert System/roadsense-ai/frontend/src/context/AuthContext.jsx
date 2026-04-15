import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("roadsense_token"));
  const [loading, setLoading] = useState(!!localStorage.getItem("roadsense_token"));

  const persistToken = useCallback((t) => {
    if (t) localStorage.setItem("roadsense_token", t);
    else localStorage.removeItem("roadsense_token");
    setToken(t);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem("roadsense_token")) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const me = await authApi.fetchMe();
      setUser(me);
      return me;
    } catch {
      persistToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [persistToken]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (email, password) => {
      const res = await authApi.login({ email, password });
      persistToken(res.access_token);
      setUser(res.user);
      return res.user;
    },
    [persistToken]
  );

  const register = useCallback(
    async (full_name, email, password) => {
      const res = await authApi.register({ full_name, email, password });
      persistToken(res.access_token);
      setUser(res.user);
      return res.user;
    },
    [persistToken]
  );

  const logout = useCallback(() => {
    persistToken(null);
    setUser(null);
  }, [persistToken]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAuthenticated: !!user && !!token,
    }),
    [user, token, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
