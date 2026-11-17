// Dates without time ('YYYY-MM-DD') are compared as calendar days in the
// user's own time zone, so "deadline tomorrow" means tomorrow on their clock.

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const MONTHS_LONG = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

const DAY_MS = 24 * 60 * 60 * 1000

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** A Date as 'YYYY-MM-DD' in the local time zone. */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

function parts(isoDate: string): [number, number, number] {
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number)
  return [y, m, d]
}

/** Whole calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = parts(from)
  const [ty, tm, td] = parts(to)
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / DAY_MS)
}

/** Shifts a 'YYYY-MM-DD' date by a number of days. */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = parts(isoDate)
  return toISODate(new Date(y, m - 1, d + days))
}

/** '2026-11-10' -> '10 ноя' (the year is added when it is not the current one). */
export function formatShortDate(isoDate: string, today: string = todayISO()): string {
  const [y, m, d] = parts(isoDate)
  const year = y === parts(today)[0] ? '' : ` ${y}`
  return `${d} ${MONTHS_SHORT[m - 1]}${year}`
}

/** '2026-11-10' -> '10 ноября'. */
export function formatLongDate(isoDate: string, today: string = todayISO()): string {
  const [y, m, d] = parts(isoDate)
  const year = y === parts(today)[0] ? '' : ` ${y}`
  return `${d} ${MONTHS_LONG[m - 1]}${year}`
}

/** A timestamp from the database -> '10 ноября, 14:05' in local time. */
export function formatDateTime(timestamp: string, today: string = todayISO()): string {
  const date = new Date(timestamp)
  return `${formatLongDate(toISODate(date), today)}, ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Picks the Russian word form for a number: plural(5, ['день', 'дня', 'дней']). */
export function plural(n: number, forms: [one: string, few: string, many: string]): string {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return forms[2]
  if (last === 1) return forms[0]
  if (last >= 2 && last <= 4) return forms[1]
  return forms[2]
}

/** 0 -> 'сегодня', 1 -> 'завтра', 5 -> 'через 5 дней', 21 -> 'через 3 недели'. */
export function describeDaysAhead(days: number): string {
  if (days === 0) return 'сегодня'
  if (days === 1) return 'завтра'
  if (days < 14) return `через ${days} ${plural(days, ['день', 'дня', 'дней'])}`
  const weeks = Math.round(days / 7)
  return `через ${weeks} ${plural(weeks, ['неделю', 'недели', 'недель'])}`
}
