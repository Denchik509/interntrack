import { describe, expect, it } from 'vitest'
import { createDemoData } from '../data/demoSeed'
import { computeStats } from './stats'
import type { Application, ApplicationEvent, EventType, Status } from './types'

const TODAY = '2026-11-16'

let n = 0
function app(status: Status, deadline: string | null = null): Application {
  n++
  return {
    id: `a${n}`,
    company: `Company ${n}`,
    role: 'Intern',
    job_url: null,
    location: null,
    status,
    deadline,
    applied_at: null,
    job_description: null,
    notes: null,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
  }
}

function history(application: Application, types: EventType[]): ApplicationEvent[] {
  return types.map((type, i) => ({
    id: `${application.id}-${i}`,
    application_id: application.id,
    type,
    happened_at: `2026-10-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
    note: null,
  }))
}

describe('computeStats', () => {
  const wish = app('wishlist', '2026-11-18')
  const sent = app('applied')
  const skippedTest = app('interview', '2026-11-25')
  const offer = app('offer', '2026-12-20')
  const rejectedAfterTest = app('rejected')
  const droppedBeforeSending = app('rejected')
  const applications = [wish, sent, skippedTest, offer, rejectedAfterTest, droppedBeforeSending]
  const events = [
    ...history(wish, ['wishlist']),
    ...history(sent, ['wishlist', 'applied']),
    ...history(skippedTest, ['wishlist', 'applied', 'interview']),
    ...history(offer, ['wishlist', 'applied', 'test', 'note', 'interview', 'offer']),
    ...history(rejectedAfterTest, ['wishlist', 'applied', 'test', 'rejected']),
    ...history(droppedBeforeSending, ['wishlist', 'rejected']),
  ]
  const stats = computeStats(applications, events, TODAY)

  it('counts applications by current status, matching the board', () => {
    expect(stats.total).toBe(6)
    expect(stats.byStatus).toEqual({ wishlist: 1, applied: 1, test: 0, interview: 1, offer: 1, rejected: 2 })
  })

  it('counts sent applications and replies', () => {
    // Sent: applied, interview, offer, rejected after test. Not sent: wishlist, dropped.
    expect(stats.submitted).toBe(4)
    // Replies: interview, offer, rejection.
    expect(stats.responses).toBe(3)
    expect(stats.responseRate).toBe(0.75)
  })

  it('builds the funnel, counting skipped stages as passed', () => {
    expect(stats.funnel).toEqual([
      { stage: 'applied', count: 4 },
      { stage: 'test', count: 3 },
      { stage: 'interview', count: 2 },
      { stage: 'offer', count: 1 },
    ])
  })

  it('groups rejections by the stage they came at', () => {
    expect(stats.rejections).toEqual([
      { stage: 'wishlist', count: 1 },
      { stage: 'test', count: 1 },
    ])
  })

  it('lists deadlines of the next two weeks, nearest first', () => {
    expect(stats.upcoming.map((a) => a.id)).toEqual([wish.id, skippedTest.id])
  })

  it('has no response rate before anything is sent', () => {
    expect(computeStats([app('wishlist')], [], TODAY).responseRate).toBeNull()
  })

  it('agrees with the demo board', () => {
    let id = 0
    const demo = createDemoData(TODAY, () => `demo-${++id}`)
    const demoStats = computeStats(demo.applications, demo.events, TODAY)
    expect(Object.values(demoStats.byStatus).reduce((a, b) => a + b, 0)).toBe(demo.applications.length)
    expect(demoStats.rejections).toEqual([{ stage: 'test', count: 1 }])
  })
})
