import { describe, expect, it } from 'vitest'
import { getCardBadge, getNextStep, getUrgency, upcomingDeadlines } from './deadlines'
import { rejectedAfter } from './history'
import { statusChangePatch } from './statuses'
import type { Application, ApplicationEvent } from './types'

const TODAY = '2026-11-16'

function app(overrides: Partial<Application>): Application {
  return {
    id: 'a1',
    company: 'Northwind Labs',
    role: 'AI Engineer Intern',
    job_url: null,
    location: null,
    status: 'wishlist',
    deadline: null,
    applied_at: null,
    job_description: null,
    notes: null,
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-01T10:00:00Z',
    ...overrides,
  }
}

describe('getUrgency: red within 3 days, yellow within a week', () => {
  it.each([
    ['2026-11-15', 'overdue'],
    ['2026-11-16', 'urgent'],
    ['2026-11-19', 'urgent'],
    ['2026-11-20', 'soon'],
    ['2026-11-23', 'soon'],
    ['2026-11-24', 'later'],
  ])('deadline %s -> %s', (deadline, urgency) => {
    expect(getUrgency(deadline, TODAY)).toBe(urgency)
  })
})

describe('getCardBadge', () => {
  it('matches the board mockup', () => {
    expect(getCardBadge(app({ deadline: '2026-11-18' }), TODAY)).toEqual({ text: 'Дедлайн через 2 дня', tone: 'red' })
    expect(getCardBadge(app({ deadline: '2026-11-22' }), TODAY)).toEqual({ text: 'Дедлайн через 6 дней', tone: 'amber' })
    expect(getCardBadge(app({ deadline: '2026-12-07' }), TODAY)).toEqual({ text: 'Дедлайн через 3 недели', tone: 'gray' })
    expect(getCardBadge(app({ status: 'applied', applied_at: '2026-11-10' }), TODAY)).toEqual({ text: 'Подано 10 ноя', tone: 'blue' })
    expect(getCardBadge(app({ status: 'interview', deadline: '2026-11-24' }), TODAY)).toEqual({ text: 'Интервью 24 ноя', tone: 'gray' })
    expect(getCardBadge(app({ status: 'offer', deadline: '2026-11-30' }), TODAY)).toEqual({ text: 'Ответить до 30 ноя', tone: 'green' })
    expect(getCardBadge(app({ status: 'rejected' }), TODAY, 'test')).toEqual({ text: 'Отказ после теста', tone: 'red' })
  })

  it('says today and tomorrow in words', () => {
    expect(getCardBadge(app({ deadline: TODAY }), TODAY)?.text).toBe('Дедлайн сегодня')
    expect(getCardBadge(app({ status: 'test', deadline: '2026-11-17' }), TODAY)?.text).toBe('Тест завтра')
  })

  it('marks missed deadlines red but a past interview gray', () => {
    expect(getCardBadge(app({ deadline: '2026-11-10' }), TODAY)).toEqual({ text: 'Дедлайн прошёл', tone: 'red' })
    expect(getCardBadge(app({ status: 'interview', deadline: '2026-11-10' }), TODAY)?.tone).toBe('gray')
  })

  it('shows nothing when there is no date to show', () => {
    expect(getCardBadge(app({ status: 'test' }), TODAY)).toBeNull()
  })
})

describe('getNextStep', () => {
  it('describes the next step with the date', () => {
    expect(getNextStep(app({ deadline: '2026-11-18' }), TODAY)).toBe('Подать заявку до 18 ноября')
    expect(getNextStep(app({ status: 'rejected' }), TODAY)).toBeNull()
  })
})

describe('upcomingDeadlines', () => {
  it('keeps the next 7 days of active deadlines, nearest first', () => {
    const list = [
      app({ id: 'later', deadline: '2026-11-30' }),
      app({ id: 'past', deadline: '2026-11-01' }),
      app({ id: 'soon', deadline: '2026-11-20' }),
      app({ id: 'today', deadline: TODAY }),
      app({ id: 'applied', status: 'applied', deadline: '2026-11-18' }),
    ]
    expect(upcomingDeadlines(list, TODAY).map((a) => a.id)).toEqual(['today', 'soon'])
  })
})

describe('statusChangePatch', () => {
  it('fills the application date on "Подано" and clears the old deadline', () => {
    expect(statusChangePatch(app({ deadline: '2026-11-18' }), 'applied', TODAY)).toEqual({
      status: 'applied',
      deadline: null,
      applied_at: TODAY,
    })
  })

  it('keeps an existing application date', () => {
    expect(statusChangePatch(app({ applied_at: '2026-11-01' }), 'applied', TODAY)).toEqual({
      status: 'applied',
      deadline: null,
    })
  })
})

describe('rejectedAfter', () => {
  const event = (type: ApplicationEvent['type'], day: number): ApplicationEvent => ({
    id: `${type}-${day}`,
    application_id: 'a1',
    type,
    happened_at: `2026-11-${String(day).padStart(2, '0')}T10:00:00Z`,
    note: null,
  })

  it('returns the stage right before the rejection, ignoring notes', () => {
    expect(rejectedAfter([event('wishlist', 1), event('applied', 2), event('test', 5), event('note', 6), event('rejected', 8)])).toBe('test')
  })

  it('returns null when there was no rejection', () => {
    expect(rejectedAfter([event('wishlist', 1), event('applied', 2)])).toBeNull()
  })
})
