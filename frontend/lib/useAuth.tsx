import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthUser, getStoredSession, isTokenExpired, refreshAccessToken, saveSession, clearSession } from './auth';
import { setAuthToken } from './api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (session: { access: string; refresh: string; user: AuthUser }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const session = getStoredSession();
    const initialize = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      if (isTokenExpired(session.access)) {
        try {
          const access = await refreshAccessToken();
          setAuthToken(access);
          setUser(session.user);
        } catch {
          clearSession();
          setAuthToken();
          setUser(null);
        }
      } else {
        setAuthToken(session.access);
        setUser(session.user);
      }
      setLoading(false);
    };

    initialize();
  }, []);

  const login = (session: { access: string; refresh: string; user: AuthUser }) => {
    saveSession(session.access, session.refresh, session.user);
    setAuthToken(session.access);
    setUser(session.user);
  };

  const logout = () => {
    clearSession();
    setAuthToken();
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
