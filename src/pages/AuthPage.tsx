import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { LogoMark } from '../components/icons'
import { Button, TextField } from '../components/ui'

/** Sign-in and sign-up share one screen: only the fields and texts differ. */
export function AuthPage({ mode }: { mode: 'signin' | 'signup' }) {
  const { session, supabaseEnabled, signIn, signUp, startDemo } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)

  if (session) return <Navigate to="/" replace />

  const isSignup = mode === 'signup'

  async function handleSubmit(event: FormEvent) {
    // Without preventDefault the browser would reload the page on submit.
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (isSignup) {
        const { needsConfirmation } = await signUp(email.trim(), password, fullName.trim())
        if (needsConfirmation) setConfirmationSent(true)
      } else {
        await signIn(email.trim(), password)
      }
      // On success AuthProvider gets the new session and this page redirects.
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-canvas px-4 py-10">
      <main className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <LogoMark size={40} />
          <h1 className="text-2xl font-bold text-ink">{isSignup ? 'Регистрация' : 'Вход в InternTrack'}</h1>
          <p className="text-sm text-ink-muted">Все заявки на стажировки и дедлайны в одном месте.</p>
        </div>

        <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-6">
          {confirmationSent ? (
            <div role="status" className="flex flex-col gap-2 text-sm text-ink">
              <p className="font-semibold">Проверь почту</p>
              <p className="text-ink-muted">
                Мы отправили письмо на {email}. Открой ссылку из письма, чтобы подтвердить адрес, и
                войди.
              </p>
              <Link to="/login" className="mt-2 font-medium text-accent-ink">
                Перейти ко входу
              </Link>
            </div>
          ) : supabaseEnabled ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {isSignup && (
                <TextField
                  label="Имя"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              )}
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label="Пароль"
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                required
                minLength={8}
                hint={isSignup ? 'Минимум 8 символов.' : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && (
                <p role="alert" className="rounded-lg bg-tone-red-bg px-3 py-2 text-sm text-tone-red-fg">
                  {error}
                </p>
              )}
              <Button type="submit" variant="primary" busy={busy}>
                {isSignup ? 'Создать аккаунт' : 'Войти'}
              </Button>
              <p className="text-center text-sm text-ink-muted">
                {isSignup ? 'Уже есть аккаунт? ' : 'Нет аккаунта? '}
                <Link to={isSignup ? '/login' : '/signup'} className="font-medium text-accent-ink">
                  {isSignup ? 'Войти' : 'Зарегистрироваться'}
                </Link>
              </p>
            </form>
          ) : (
            <p className="text-sm text-ink-muted">
              Вход по email появится, когда в файле <code className="font-mono">.env</code> будут
              настройки Supabase. Пока можно открыть демо.
            </p>
          )}

          <div className="flex flex-col gap-2 border-t border-line pt-5">
            <Button onClick={startDemo}>Открыть демо без регистрации</Button>
            <p className="text-center text-[13px] text-ink-muted">
              Примеры заявок хранятся только в этом браузере.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
