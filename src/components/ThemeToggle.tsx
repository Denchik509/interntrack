import { useSyncExternalStore } from 'react'
import { safeStorage } from '../lib/storage'
import { MoonIcon, SunIcon } from './icons'

export type Theme = 'light' | 'dark'

const THEME_KEY = 'interntrack-theme'

// The theme is the "dark" class on <html>. A small script in index.html sets
// it before React starts, so a dark page never flashes white. Every toggle on
// the page reads the same class, so the header switch and the one in the
// profile always agree.

const listeners = new Set<() => void>()

function getTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function setTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  safeStorage.setItem(THEME_KEY, theme)
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// oxlint-disable-next-line react/only-export-components
export function useTheme(): [Theme, (theme: Theme) => void] {
  return [useSyncExternalStore(subscribe, getTheme), setTheme]
}

export function ThemeToggle() {
  const [theme] = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
      className="flex size-11 items-center justify-center rounded-full border border-line-strong text-ink-muted hover:text-ink"
    >
      {isDark ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}
    </button>
  )
}
