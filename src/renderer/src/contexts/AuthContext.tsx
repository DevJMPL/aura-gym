import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase/client'
import type { AppUser, UserRole } from '../types/database'
import { auditService } from '../features/settings/services/audit.service'

interface AuthContextType {
  session: Session | null
  user: User | null
  appUser: AppUser | null
  role: UserRole | null
  isLoading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: UserRole
  ) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loginHistoryId, setLoginHistoryId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchAppUser = useCallback(async (authId: string) => {
    const { data } = await supabase.from('app_users').select('*').eq('auth_id', authId).single()

    if (data) {
      setAppUser(data as AppUser)
      return data as AppUser
    }
    return null
  }, [])

  useEffect(() => {
    console.log('[AuthContext] useEffect mounted, starting getSession')
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      console.log('[AuthContext] getSession resolved', s?.user?.id)
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        console.log('[AuthContext] session has user, fetching appUser')
        fetchAppUser(s.user.id).then(async (u) => {
          console.log('[AuthContext] fetchAppUser resolved', u?.id)
          if (u && !loginHistoryId) {
            console.log('[AuthContext] recording login')
            const hid = await auditService.recordLogin(u.id, u.full_name)
            if (hid) setLoginHistoryId(hid)
          }
        }).catch(err => console.error('[AuthContext] fetchAppUser error', err))
      }
      console.log('[AuthContext] Setting authLoading to false (from getSession)')
      setIsLoading(false)
    }).catch(err => {
      console.error('[AuthContext] getSession error', err)
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        console.log('[AuthContext] onAuthStateChange user detected, fetching appUser')
        fetchAppUser(s.user.id).then(async (u) => {
          console.log('[AuthContext] onAuthStateChange fetchAppUser resolved')
          if (event === 'SIGNED_IN' && u) {
            const hid = await auditService.recordLogin(u.id, u.full_name)
            if (hid) setLoginHistoryId(hid)
          }
        }).catch(err => console.error('[AuthContext] onAuthStateChange fetchAppUser error', err))
      } else {
        setAppUser(null)
      }
      console.log('[AuthContext] Setting authLoading to false (from onAuthStateChange)')
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [fetchAppUser])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole = 'admin'
  ) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        }
      }
    })
    if (error) return { error: error.message }

    return { error: null }
  }

  const signOut = async () => {
    if (loginHistoryId) {
      await auditService.recordLogout(loginHistoryId)
      setLoginHistoryId(null)
    }
    await supabase.auth.signOut()
    setAppUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        appUser,
        role: appUser?.role ?? null,
        isLoading,
        isAdmin: appUser?.role === 'admin',
        signIn,
        signUp,
        signOut,
        refreshUser: async () => {
          if (user) await fetchAppUser(user.id)
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
