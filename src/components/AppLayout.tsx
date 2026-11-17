import { useEffect, useRef, type ReactNode } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { TrackerProvider, useTracker } from '../state/TrackerProvider'
import { BoardIcon, ChartIcon, CvIcon, LogoMark, PlusIcon, SearchIcon, UserIcon } from './icons'
import { ThemeToggle } from './ThemeToggle'
import { Button, Spinner } from './ui'

/** Pages behind this route need a signed-in user (or demo mode). */
export function RequireAuth() {
  const { session } = useAuth()
  if (session === undefined) return <FullScreenMessage><Spinner className="size-6" /></FullScreenMessage>
  if (session === null) return <Navigate to="/login" replace />
  // key: a new user gets a fresh provider with no data left from the previous one.
  return (
    <TrackerProvider key={session.userId} session={session}>
      <AppLayout />
    </TrackerProvider>
  )
}

function FullScreenMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-canvas px-4 text-center text-ink">
      {children}
    </div>
  )
}

function AppLayout() {
  const { status, error, reload, isDemo } = useTracker()

  return (
    <div className="flex min-h-svh flex-col bg-canvas text-ink">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
      >
        Перейти к содержимому
      </a>
      {isDemo && <DemoBanner />}
      <DesktopHeader />
      <div id="content" className="flex flex-1 flex-col pb-24 md:pb-0">
        {status === 'loading' && (
          <div className="flex flex-1 items-center justify-center" role="status">
            <Spinner className="size-6" />
            <span className="sr-only">Загружаю заявки</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="font-semibold">Не получилось загрузить данные</p>
            <p className="max-w-md text-sm text-ink-muted">{error}</p>
            <Button onClick={reload}>Попробовать ещё раз</Button>
          </div>
        )}
        {status === 'ready' && <Outlet />}
      </div>
      <MobileNav />
    </div>
  )
}

function DemoBanner() {
  const { supabaseEnabled, signOut } = useAuth()
  const navigate = useNavigate()

  async function goToSignup() {
    await signOut()
    navigate('/signup')
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-accent-soft px-4 py-2 text-center text-[13px] text-accent-ink">
      <span>Демо-режим: примеры хранятся только в этом браузере.</span>
      {supabaseEnabled && (
        <button type="button" onClick={() => void goToSignup()} className="font-semibold underline underline-offset-2">
          Создать свой аккаунт
        </button>
      )}
    </div>
  )
}

const NAV_ITEMS = [
  { to: '/', label: 'Доска', mobileLabel: 'Доска', Icon: BoardIcon },
  { to: '/stats', label: 'Статистика', mobileLabel: 'Статистика', Icon: ChartIcon },
  { to: '/cv', label: 'Моё CV', mobileLabel: 'CV', Icon: CvIcon },
]

function DesktopHeader() {
  const navigate = useNavigate()

  return (
    <header className="hidden flex-wrap items-center gap-x-8 gap-y-3 border-b border-line bg-surface px-8 py-3 md:flex">
      <Link to="/" className="flex items-center gap-2.5 text-[17px] font-bold text-ink no-underline">
        <LogoMark />
        InternTrack
      </Link>
      <nav aria-label="Основная навигация" className="flex flex-wrap gap-1">
        {NAV_ITEMS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `rounded-lg px-3.5 py-3 text-sm no-underline ${
                isActive ? 'bg-accent-soft font-semibold text-accent-ink' : 'font-medium text-ink-muted hover:text-ink'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="ml-auto flex flex-wrap items-center gap-3">
        <HeaderSearch />
        <Button variant="primary" onClick={() => navigate('/new')}>
          <PlusIcon />
          Добавить заявку
        </Button>
        <ThemeToggle />
        <NavLink
          to="/profile"
          aria-label="Профиль"
          className={({ isActive }) =>
            `flex size-11 items-center justify-center rounded-full border ${
              isActive ? 'border-accent text-accent-ink' : 'border-line-strong text-ink-muted hover:text-ink'
            }`
          }
        >
          <UserIcon width={18} height={18} />
        </NavLink>
      </div>
    </header>
  )
}

/** Search lives in the URL (?q=…), so the filtered board survives a reload. */
function HeaderSearch() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const query = params.get('q') ?? ''

  // "/" focuses search from anywhere, like on GitHub.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      const typing = target.closest('input, textarea, select, [contenteditable="true"]')
      if (event.key === '/' && !typing) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function update(value: string) {
    if (location.pathname !== '/') {
      navigate(value ? `/?q=${encodeURIComponent(value)}` : '/')
      return
    }
    setParams(value ? { q: value } : {}, { replace: true })
  }

  return (
    <label className="flex h-11 items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 text-ink-muted focus-within:border-accent">
      <SearchIcon />
      <span className="sr-only">Поиск по заявкам</span>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => update(e.target.value)}
        placeholder="Компания или позиция"
        className="w-48 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
      />
    </label>
  )
}

function MobileNav() {
  const items = [...NAV_ITEMS, { to: '/profile', label: 'Профиль', mobileLabel: 'Профиль', Icon: UserIcon }]
  return (
    <nav
      aria-label="Основная навигация"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface px-2 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
    >
      {items.map(({ to, mobileLabel, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex min-h-12 flex-col items-center justify-center gap-1 text-xs no-underline ${
              isActive ? 'font-semibold text-accent-ink' : 'font-medium text-ink-muted'
            }`
          }
        >
          <Icon />
          {mobileLabel}
        </NavLink>
      ))}
    </nav>
  )
}
