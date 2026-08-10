import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService } from '../services/authService'
import type { LoginResult, SafeUser } from '../types/auth'

interface AuthContextValue {
  user: SafeUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  loginWithTwoFactor: (pendingId: string, code: string) => Promise<SafeUser>
  register: (username: string, email: string, password: string) => Promise<{ user: SafeUser; devVerifyUrl?: string }>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  updateProfile: (patch: Partial<Pick<SafeUser, 'bio' | 'avatarUrl' | 'username'>>) => Promise<void>
  toggleFavorite: (modId: string) => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authService
      .currentUser()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  const refresh = useCallback(async () => {
    try {
      setUser(await authService.me())
    } catch {
      setUser(null)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await authService.login(email, password)
    if (!result.requires2FA) setUser(result.user)
    return result
  }, [])

  const loginWithTwoFactor = useCallback(async (pendingId: string, code: string) => {
    const u = await authService.loginWithTwoFactor(pendingId, code)
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (username: string, email: string, password: string) => {
    const result = await authService.register({ username, email, password })
    setUser(result.user)
    return result
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  const logoutAll = useCallback(async () => {
    await authService.logoutAll()
    setUser(null)
  }, [])

  const updateProfile = useCallback(
    async (patch: Partial<Pick<SafeUser, 'bio' | 'avatarUrl' | 'username'>>) => {
      const u = await authService.updateProfile(patch)
      setUser(u)
    },
    []
  )

  const toggleFavorite = useCallback(async (modId: string) => {
    const u = await authService.toggleFavorite(modId)
    setUser(u)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      loginWithTwoFactor,
      register,
      logout,
      logoutAll,
      updateProfile,
      toggleFavorite,
      refresh,
    }),
    [user, loading, login, loginWithTwoFactor, register, logout, logoutAll, updateProfile, toggleFavorite, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
