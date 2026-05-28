import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, getStoredAuthToken, setStoredAuthToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children, apiBase }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const refreshUser = useCallback(async () => {
    const token = await getStoredAuthToken();
    if (!token || !apiBase) {
      setUser(null);
      setReady(true);
      return;
    }
    try {
      const data = await apiGet(apiBase, '/api/auth/me');
      if (data.ok && data.user) setUser(data.user);
      else {
        setUser(null);
        await setStoredAuthToken(null);
      }
    } catch {
      setUser(null);
      await setStoredAuthToken(null);
    } finally {
      setReady(true);
    }
  }, [apiBase]);

  useEffect(() => {
    setReady(false);
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (username, password) => {
      const data = await apiPost(
        apiBase,
        '/api/auth/login',
        { username: (username || '').trim(), password },
        { includeAuth: false },
      );
      if (data.token) await setStoredAuthToken(data.token);
      setUser(data.user ?? null);
      return data;
    },
    [apiBase],
  );

  const register = useCallback(
    async ({ fullName, email, username, password, passwordConfirm }) => {
      const data = await apiPost(
        apiBase,
        '/api/auth/register',
        {
          full_name: fullName,
          email: (email || '').trim(),
          username: (username || '').trim(),
          password,
          password_confirm: passwordConfirm,
        },
        { includeAuth: false },
      );
      if (data.token) await setStoredAuthToken(data.token);
      setUser(data.user ?? null);
      return data;
    },
    [apiBase],
  );

  const logout = useCallback(async () => {
    await setStoredAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, register, logout, refreshUser }),
    [user, ready, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth dentro de AuthProvider');
  return ctx;
}
