import { describe, expect, it } from 'vitest'
import { createDemoRepository, DEMO_STORAGE_KEY, type KeyValueStorage } from './demoRepository'

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}

function setup() {
  const storage = memoryStorage()
  let counter = 0
  let clock = new Date('2026-11-17T09:00:00Z').getTime()
  const repo = createDemoRepository(storage, {
    newId: () => `id-${++counter}`,
    now: () => new Date((clock += 1000)),
    today: () => '2026-11-17',
  })
  return { storage, repo }
}

const input = {
  company: 'Test Co',
  role: 'Intern',
  job_url: null,
  location: null,
  status: 'wishlist' as const,
  deadline: '2026-11-20',
  job_description: null,
  notes: null,
}

describe('demo repository', () => {
  it('fills an empty browser with sample data and saves it', async () => {
    const { storage, repo } = setup()
    const data = await repo.loadAll()
    expect(data.applications).toHaveLength(12)
    expect(data.cv?.content).toContain('Alex Taylor')
    expect(storage.data.has(DEMO_STORAGE_KEY)).toBe(true)
  })

  it('puts sample deadlines relative to today', async () => {
    const { repo } = setup()
    const { applications } = await repo.loadAll()
    const northwind = applications.find((a) => a.company === 'Northwind Labs')
    expect(northwind?.deadline).toBe('2026-11-19')
  })

  it('logs a history event on create and on a status change, like the database trigger', async () => {
    const { repo } = setup()
    const created = await repo.createApplication(input)
    await repo.updateApplication(created.id, { notes: 'only a note' })
    await repo.updateApplication(created.id, { status: 'applied' })

    const events = await repo.listEvents(created.id)
    expect(events.map((e) => e.type)).toEqual(['wishlist', 'applied'])
  })

  it('deletes the history and AI results together with the application', async () => {
    const { repo } = setup()
    const created = await repo.createApplication(input)
    await repo.addNote(created.id, 'Called the recruiter')
    await repo.saveAiResult({
      application_id: created.id,
      kind: 'cover_letter',
      content: { text: 'Dear team' },
      cv_title: null,
    })

    await repo.deleteApplication(created.id)
    const data = await repo.loadAll()
    expect(data.applications.some((a) => a.id === created.id)).toBe(false)
    expect(data.events.some((e) => e.application_id === created.id)).toBe(false)
    expect(data.aiResults.some((r) => r.application_id === created.id)).toBe(false)
  })

  it('keeps changes between page reloads', async () => {
    const { storage, repo } = setup()
    const created = await repo.createApplication(input)
    const reopened = createDemoRepository(storage)
    const data = await reopened.loadAll()
    expect(data.applications[0].id).toBe(created.id)
  })

  it('updates the text of a saved cover letter', async () => {
    const { repo } = setup()
    const created = await repo.createApplication(input)
    const letter = await repo.saveAiResult({
      application_id: created.id,
      kind: 'cover_letter',
      content: { text: 'Draft' },
      cv_title: 'Основное',
    })
    const edited = await repo.updateCoverLetter(letter.id, 'Edited draft')
    expect(edited.content).toEqual({ text: 'Edited draft' })
  })
})
