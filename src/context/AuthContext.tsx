import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import authService from '@/services/all/auth/AuthService'
import { setAuthToken } from '@/libs/axios'
import type { User } from '@/interfaces/all/user'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const TOKEN_KEY = 'token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        if (token) {
          setAuthToken(token)
          const me = await authService.me()
          if (active) setUser(me)
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        setAuthToken(null)
        setTokenState(null)
        setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [token])

  const login = useCallback(async (email: string, password: string) => {
    const { token: nextToken, user: nextUser } = await authService.login(email, password)
    localStorage.setItem(TOKEN_KEY, nextToken)
    setTokenState(nextToken)
    setUser(nextUser)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      localStorage.removeItem(TOKEN_KEY)
      setAuthToken(null)
      setTokenState(null)
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      loading,
      login,
      logout,
    }),
    [user, token, loading, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
