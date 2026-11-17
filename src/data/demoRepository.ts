import { todayISO } from '../lib/dates'
import type { AiResult, Application, ApplicationEvent, CvVersion } from '../lib/types'
import { createDemoData } from './demoSeed'
import type { Repository, TrackerData } from './repository'

/** The part of localStorage the demo needs; tests pass an in-memory copy. */
export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const DEMO_STORAGE_KEY = 'interntrack-demo-data-v1'

interface Options {
  newId?: () => string
  now?: () => Date
  today?: () => string
}

/**
 * Demo mode: the same Repository interface, but the data lives in the
 * browser's localStorage. On first use it is filled with sample applications.
 * It also does what the database triggers do in Supabase: writes a history
 * event when an application is created or changes status.
 */
export function createDemoRepository(storage: KeyValueStorage, options: Options = {}): Repository {
  const newId = options.newId ?? (() => crypto.randomUUID())
  const now = options.now ?? (() => new Date())
  const today = options.today ?? todayISO

  function read(): TrackerData {
    const saved = storage.getItem(DEMO_STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved) as TrackerData
      } catch {
        // Broken data: start again from the sample.
      }
    }
    const data = createDemoData(today(), newId)
    write(data)
    return data
  }

  function write(data: TrackerData): void {
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data))
  }

  /** Reads the data, lets `change` modify it, saves it and returns the result. */
  function update<T>(change: (data: TrackerData) => T): T {
    const data = read()
    const result = change(data)
    write(data)
    return result
  }

  function statusEvent(applicationId: string, type: Application['status']): ApplicationEvent {
    return { id: newId(), application_id: applicationId, type, happened_at: now().toISOString(), note: null }
  }

  function findApplication(data: TrackerData, id: string): Application {
    const application = data.applications.find((a) => a.id === id)
    if (!application) throw new Error('Заявка не найдена')
    return application
  }

  return {
    async loadAll() {
      return read()
    },

    async createApplication(input) {
      return update((data) => {
        const timestamp = now().toISOString()
        const application: Application = {
          ...input,
          id: newId(),
          applied_at: null,
          created_at: timestamp,
          updated_at: timestamp,
        }
        data.applications.unshift(application)
        data.events.push(statusEvent(application.id, application.status))
        return application
      })
    },

    async updateApplication(id, patch) {
      return update((data) => {
        const application = findApplication(data, id)
        const statusChanged = patch.status !== undefined && patch.status !== application.status
        Object.assign(application, patch, { updated_at: now().toISOString() })
        if (statusChanged) data.events.push(statusEvent(id, application.status))
        return { ...application }
      })
    },

    async deleteApplication(id) {
      update((data) => {
        data.applications = data.applications.filter((a) => a.id !== id)
        data.events = data.events.filter((e) => e.application_id !== id)
        data.aiResults = data.aiResults.filter((r) => r.application_id !== id)
      })
    },

    async listEvents(applicationId) {
      return read()
        .events.filter((e) => e.application_id === applicationId)
        .sort((a, b) => a.happened_at.localeCompare(b.happened_at))
    },

    async addNote(applicationId, note) {
      return update((data) => {
        findApplication(data, applicationId)
        const event: ApplicationEvent = {
          id: newId(),
          application_id: applicationId,
          type: 'note',
          happened_at: now().toISOString(),
          note,
        }
        data.events.push(event)
        return event
      })
    },

    async saveCv(content, existing) {
      return update((data) => {
        const cv: CvVersion = {
          id: existing?.id ?? newId(),
          title: existing?.title ?? 'Основное',
          content,
          updated_at: now().toISOString(),
        }
        data.cv = cv
        return cv
      })
    },

    async saveAiResult(result) {
      return update((data) => {
        findApplication(data, result.application_id)
        const saved = { ...result, id: newId(), created_at: now().toISOString() } as AiResult
        data.aiResults.push(saved)
        return saved
      })
    },

    async updateCoverLetter(id, text) {
      return update((data) => {
        const result = data.aiResults.find((r) => r.id === id)
        if (!result || result.kind !== 'cover_letter') throw new Error('Письмо не найдено')
        result.content = { text }
        return { ...result }
      })
    },
  }
}
