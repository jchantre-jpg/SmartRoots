/**
 * Estado de sesión: usuario actual, token en localStorage y llamadas a ``/api/auth/*``.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost, getStoredAuthToken, setStoredAuthToken } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  const refreshUser = useCallback(async () => {
    const token = getStoredAuthToken()
    if (!token) {
      setUser(null)
      setReady(true)
      return
    }
    try {
      const data = await apiGet('/api/auth/me')
      if (data.ok && data.user) setUser(data.user)
      else {
        setUser(null)
        setStoredAuthToken(null)
      }
    } catch {
      setUser(null)
      setStoredAuthToken(null)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = useCallback(async (username, password) => {
    const data = await apiPost(
      '/api/auth/login',
      { username: (username || '').trim(), password },
      { includeAuth: false },
    )
    if (data.token) setStoredAuthToken(data.token)
    setUser(data.user ?? null)
    return data
  }, [])

  const register = useCallback(async ({ fullName, email, username, password, passwordConfirm }) => {
    const data = await apiPost(
      '/api/auth/register',
      {
        full_name: fullName,
        email: (email || '').trim(),
        username: (username || '').trim(),
        password,
        password_confirm: passwordConfirm,
      },
      { includeAuth: false },
    )
    if (data.token) setStoredAuthToken(data.token)
    setUser(data.user ?? null)
    return data
  }, [])

  const logout = useCallback(() => {
    setStoredAuthToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, ready, login, register, logout, refreshUser }),
    [user, ready, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
