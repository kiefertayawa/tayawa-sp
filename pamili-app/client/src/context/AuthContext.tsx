// ============================================================
// PAMILI - Auth Context
// Admin authentication via JWT. Token stored in localStorage.
// ============================================================

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { adminService } from '../services/api';

interface AuthState {
  isAdmin: boolean;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAdmin: !!localStorage.getItem('pamili_token'),
    token: localStorage.getItem('pamili_token'),
  });

  const logout = useCallback(() => {
    localStorage.removeItem('pamili_token');
    setState({ isAdmin: false, token: null });
  }, []);

  // Sync state with token expiration
  useEffect(() => {
    const token = localStorage.getItem('pamili_token');
    if (!token) return;

    const payload = parseJwt(token);
    if (!payload || !payload.exp) {
      logout();
      return;
    }

    const expiresMs = payload.exp * 1000 - Date.now();
    if (expiresMs <= 0) {
      logout(); // Token already expired
    } else {
      const timer = setTimeout(() => {
        logout();
      }, expiresMs);
      return () => clearTimeout(timer);
    }
  }, [state.token, logout]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await adminService.login({ username, password });
      const { token } = res.data.data;
      localStorage.setItem('pamili_token', token);
      setState({ isAdmin: true, token });
      return true;
    } catch {
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
