import type { AuthError, Session as SupabaseSession } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEMO_STORAGE_KEY } from '../data/demoRepository'
import { supabase } from '../lib/supabase'
import { safeStorage } from '../lib/storage'

export type Session =
  | { mode: 'supabase'; userId: string; email: string; fullName: string | null }
  | { mode: 'demo'; userId: 'demo'; email: null; fullName: string }

interface AuthContextValue {
  /** null while the saved session is being restored. */
  session: Session | null | undefined
  /** False when .env has no Supabase settings: only demo mode is available. */
  supabaseEnabled: boolean
  signIn(email: string, password: string): Promise<void>
  /** Returns true when Supabase asks the user to confirm their email first. */
  signUp(email: string, password: string, fullName: string): Promise<{ needsConfirmation: boolean }>
  startDemo(): void
  signOut(): Promise<void>
  /** Login token for requests to our own server function. */
  getAccessToken(): Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const DEMO_FLAG_KEY = 'interntrack-demo-active'

const DEMO_SESSION: Session = { mode: 'demo', userId: 'demo', email: null, fullName: 'Демо-пользователь' }

function fromSupabase(session: SupabaseSession | null): Session | null {
  if (!session) return null
  const name = session.user.user_metadata?.full_name
  return {
    mode: 'supabase',
    userId: session.user.id,
    email: session.user.email ?? '',
    fullName: typeof name === 'string' && name ? name : null,
  }
}

/** Supabase error messages are in English; show the common ones in Russian. */
function translateAuthError(error: AuthError): Error {
  const messages: Record<string, string> = {
    invalid_credentials: 'Неверный email или пароль.',
    email_not_confirmed: 'Подтверди email: ссылка пришла на почту после регистрации.',
    user_already_exists: 'Аккаунт с таким email уже есть. Попробуй войти.',
    weak_password: 'Пароль слишком простой. Нужно минимум 8 символов.',
    over_email_send_rate_limit: 'Слишком много писем подряд. Подожди минуту и попробуй снова.',
    over_request_rate_limit: 'Слишком много попыток. Подожди минуту и попробуй снова.',
  }
  return new Error((error.code && messages[error.code]) || `Не получилось: ${error.message}`)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseSession, setSupabaseSession] = useState<Session | null | undefined>(
    supabase ? undefined : null,
  )
  const [demoActive, setDemoActive] = useState(() => safeStorage.getItem(DEMO_FLAG_KEY) === '1')

  useEffect(() => {
    if (!supabase) return
    // Fires once with the saved session (INITIAL_SESSION), then on every
    // sign-in, sign-out and token refresh.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseSession(fromSupabase(session))
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const session: Session | null | undefined =
    supabaseSession === undefined ? undefined : (supabaseSession ?? (demoActive ? DEMO_SESSION : null))

  const startDemo = useCallback(() => {
    safeStorage.setItem(DEMO_FLAG_KEY, '1')
    setDemoActive(true)
  }, [])

  const signOut = useCallback(async () => {
    if (demoActive) {
      safeStorage.removeItem(DEMO_FLAG_KEY)
      safeStorage.removeItem(DEMO_STORAGE_KEY)
      setDemoActive(false)
    }
    if (supabase && supabaseSession) {
      const { error } = await supabase.auth.signOut()
      if (error) throw translateAuthError(error)
    }
  }, [demoActive, supabaseSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      supabaseEnabled: supabase !== null,
      async signIn(email, password) {
        if (!supabase) throw new Error('Supabase не настроен')
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw translateAuthError(error)
      },
      async signUp(email, password, fullName) {
        if (!supabase) throw new Error('Supabase не настроен')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        })
        if (error) throw translateAuthError(error)
        return { needsConfirmation: data.session === null }
      },
      startDemo,
      signOut,
      async getAccessToken() {
        if (!supabase) return null
        const { data } = await supabase.auth.getSession()
        return data.session?.access_token ?? null
      },
    }),
    [session, startDemo, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
