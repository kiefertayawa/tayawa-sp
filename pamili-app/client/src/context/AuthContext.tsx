// ============================================================
// PAMILI - Auth Context
// Admin authentication via JWT. Token stored in localStorage.
// ============================================================

import { createContext, useContext, useState, useCallback } from 'react';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAdmin: !!localStorage.getItem('pamili_token'),
    token: localStorage.getItem('pamili_token'),
  });

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

  const logout = useCallback(() => {
    localStorage.removeItem('pamili_token');
    setState({ isAdmin: false, token: null });
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
