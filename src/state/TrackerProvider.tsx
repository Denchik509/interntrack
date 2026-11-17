import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '../auth/AuthProvider'
import { createDemoRepository } from '../data/demoRepository'
import type { NewAiResult, Repository, TrackerData } from '../data/repository'
import { createSupabaseRepository } from '../data/supabaseRepository'
import { statusChangePatch } from '../lib/statuses'
import { safeStorage } from '../lib/storage'
import { supabase } from '../lib/supabase'
import type { AiResult, Application, ApplicationInput, ApplicationPatch, Status } from '../lib/types'

interface TrackerContextValue extends TrackerData {
  status: 'loading' | 'ready' | 'error'
  error: string | null
  isDemo: boolean
  reload(): void
  createApplication(input: ApplicationInput): Promise<Application>
  updateApplication(id: string, patch: ApplicationPatch): Promise<void>
  /** Moves a card to another column. The screen updates before the server answers. */
  moveApplication(id: string, status: Status): Promise<void>
  deleteApplication(id: string): Promise<void>
  addNote(applicationId: string, note: string): Promise<void>
  saveCv(content: string): Promise<void>
  saveAiResult(result: NewAiResult): Promise<AiResult>
  updateCoverLetter(id: string, text: string): Promise<void>
}

const TrackerContext = createContext<TrackerContextValue | null>(null)

const EMPTY: TrackerData = { applications: [], events: [], aiResults: [], cv: null }

/**
 * Keeps all of the user's data in React state and offers the actions that
 * change it. Each action writes through the repository, then updates the
 * state, so every screen re-renders with the new data.
 */
export function TrackerProvider({ session, children }: { session: Session; children: ReactNode }) {
  const repository: Repository = useMemo(
    () =>
      session.mode === 'demo' || !supabase
        ? createDemoRepository(safeStorage)
        : createSupabaseRepository(supabase),
    [session.mode],
  )

  const [data, setData] = useState<TrackerData>(EMPTY)
  const [status, setStatus] = useState<TrackerContextValue['status']>('loading')
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    repository
      .loadAll()
      .then((loaded) => {
        if (cancelled) return
        setData(loaded)
        setStatus('ready')
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : String(e))
        setStatus('error')
      })
    // If the user signs out while data is loading, ignore the late answer.
    return () => {
      cancelled = true
    }
  }, [repository, session.userId, reloadKey])

  const replaceApplication = useCallback((updated: Application) => {
    setData((d) => ({
      ...d,
      applications: d.applications.map((a) => (a.id === updated.id ? updated : a)),
    }))
  }, [])

  /** Re-reads one application's history (the database adds status events itself). */
  const refreshEvents = useCallback(
    async (applicationId: string) => {
      const events = await repository.listEvents(applicationId)
      setData((d) => ({
        ...d,
        events: [...d.events.filter((e) => e.application_id !== applicationId), ...events],
      }))
    },
    [repository],
  )

  const updateApplication = useCallback(
    async (id: string, patch: ApplicationPatch) => {
      const updated = await repository.updateApplication(id, patch)
      replaceApplication(updated)
      if (patch.status !== undefined) await refreshEvents(id)
    },
    [repository, replaceApplication, refreshEvents],
  )

  const moveApplication = useCallback(
    async (id: string, nextStatus: Status) => {
      const before = data.applications.find((a) => a.id === id)
      if (!before || before.status === nextStatus) return
      const patch = statusChangePatch(before, nextStatus)
      // Optimistic update: move the card now, roll back if saving fails.
      replaceApplication({ ...before, ...patch })
      try {
        await updateApplication(id, patch)
      } catch (e) {
        replaceApplication(before)
        throw e
      }
    },
    [data.applications, replaceApplication, updateApplication],
  )

  const value = useMemo<TrackerContextValue>(
    () => ({
      ...data,
      status,
      error,
      isDemo: session.mode === 'demo',
      reload() {
        setStatus('loading')
        setReloadKey((k) => k + 1)
      },

      async createApplication(input) {
        const created = await repository.createApplication(input)
        setData((d) => ({ ...d, applications: [created, ...d.applications] }))
        await refreshEvents(created.id)
        return created
      },

      updateApplication,
      moveApplication,

      async deleteApplication(id) {
        await repository.deleteApplication(id)
        setData((d) => ({
          ...d,
          applications: d.applications.filter((a) => a.id !== id),
          events: d.events.filter((e) => e.application_id !== id),
          aiResults: d.aiResults.filter((r) => r.application_id !== id),
        }))
      },

      async addNote(applicationId, note) {
        const event = await repository.addNote(applicationId, note)
        setData((d) => ({ ...d, events: [...d.events, event] }))
      },

      async saveCv(content) {
        const cv = await repository.saveCv(content, data.cv)
        setData((d) => ({ ...d, cv }))
      },

      async saveAiResult(result) {
        const saved = await repository.saveAiResult(result)
        setData((d) => ({ ...d, aiResults: [...d.aiResults, saved] }))
        return saved
      },

      async updateCoverLetter(id, text) {
        const updated = await repository.updateCoverLetter(id, text)
        setData((d) => ({ ...d, aiResults: d.aiResults.map((r) => (r.id === id ? updated : r)) }))
      },
    }),
    [data, status, error, session.mode, repository, refreshEvents, updateApplication, moveApplication],
  )

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useTracker(): TrackerContextValue {
  const context = useContext(TrackerContext)
  if (!context) throw new Error('useTracker must be used inside <TrackerProvider>')
  return context
}
