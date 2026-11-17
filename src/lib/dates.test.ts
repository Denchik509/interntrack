import { describe, expect, it } from 'vitest'
import {
  addDays,
  daysBetween,
  describeDaysAhead,
  formatLongDate,
  formatShortDate,
  plural,
} from './dates'

describe('daysBetween', () => {
  it('counts calendar days', () => {
    expect(daysBetween('2026-11-17', '2026-11-19')).toBe(2)
    expect(daysBetween('2026-11-17', '2026-11-17')).toBe(0)
    expect(daysBetween('2026-11-17', '2026-11-10')).toBe(-7)
  })

  it('works across months, years and daylight saving changes', () => {
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
    expect(daysBetween('2026-12-30', '2027-01-02')).toBe(3)
  })
})

describe('addDays', () => {
  it('moves across month ends', () => {
    expect(addDays('2026-11-29', 3)).toBe('2026-12-02')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('formatting', () => {
  it('writes short and long Russian dates', () => {
    expect(formatShortDate('2026-11-10', '2026-11-17')).toBe('10 ноя')
    expect(formatLongDate('2026-05-03', '2026-11-17')).toBe('3 мая')
  })

  it('adds the year only when it differs from this year', () => {
    expect(formatShortDate('2027-01-15', '2026-11-17')).toBe('15 янв 2027')
  })
})

describe('plural', () => {
  const days: [string, string, string] = ['день', 'дня', 'дней']
  it.each([
    [1, 'день'],
    [2, 'дня'],
    [5, 'дней'],
    [11, 'дней'],
    [21, 'день'],
    [24, 'дня'],
    [112, 'дней'],
  ])('%i -> %s', (n, word) => {
    expect(plural(n, days)).toBe(word)
  })
})

describe('describeDaysAhead', () => {
  it.each([
    [0, 'сегодня'],
    [1, 'завтра'],
    [2, 'через 2 дня'],
    [6, 'через 6 дней'],
    [21, 'через 3 недели'],
    [35, 'через 5 недель'],
  ])('%i -> %s', (days, text) => {
    expect(describeDaysAhead(days)).toBe(text)
  })
})
