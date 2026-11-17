import { useSyncExternalStore } from 'react'

/** True while the CSS media query matches, e.g. '(min-width: 768px)'. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}

/** Tailwind's `md` breakpoint: tablets and computers get the full board. */
export const DESKTOP_QUERY = '(min-width: 768px)'
