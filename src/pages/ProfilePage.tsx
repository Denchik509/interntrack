import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { useTheme } from '../components/ThemeToggle'
import { useToast } from '../components/Toaster'
import { Button } from '../components/ui'
import { PageHeader } from '../components/PageHeader'

export function ProfilePage() {
  const { session, signOut } = useAuth()
  const [theme, setTheme] = useTheme()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  if (!session) return null
  const isDemo = session.mode === 'demo'

  async function handleSignOut() {
    setBusy(true)
    try {
      await signOut()
      navigate('/login')
    } catch (e) {
      notify(e instanceof Error ? e.message : String(e), 'error')
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Профиль" />

      <section className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink-muted">Аккаунт</h2>
        <p className="text-lg font-semibold">{session.fullName ?? 'Без имени'}</p>
        <p className="text-sm text-ink-muted">
          {isDemo ? 'Демо-режим: данные хранятся только в этом браузере.' : session.email}
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink-muted">Оформление</h2>
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Тема</legend>
          {(['light', 'dark'] as const).map((value) => (
            <label
              key={value}
              className={`flex h-11 cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm font-medium ${
                theme === value ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line-strong'
              }`}
            >
              <input
                type="radio"
                name="theme"
                value={value}
                checked={theme === value}
                onChange={() => setTheme(value)}
                className="accent-accent"
              />
              {value === 'light' ? 'Светлая тема' : 'Тёмная тема'}
            </label>
          ))}
        </fieldset>
      </section>

      <div className="flex flex-col gap-2">
        <Button variant="secondary" busy={busy} onClick={handleSignOut} className="self-start">
          {isDemo ? 'Выйти из демо' : 'Выйти'}
        </Button>
        {isDemo && (
          <p className="text-[13px] text-ink-muted">
            При выходе демо-данные удалятся. В следующий раз демо откроется с исходными примерами.
          </p>
        )}
      </div>
    </main>
  )
}
