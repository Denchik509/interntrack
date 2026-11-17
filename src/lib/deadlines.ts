import { daysBetween, describeDaysAhead, formatLongDate, formatShortDate } from './dates'
import { STATUS_META } from './statuses'
import type { Application, BadgeTone, Status } from './types'

// Deadline rules from the plan: red within 3 days, yellow within a week.
// The `deadline` field is "the date of the next step", so its wording
// depends on the status: an application deadline, a test, an interview…

export type Urgency = 'overdue' | 'urgent' | 'soon' | 'later'

export function getUrgency(deadline: string, today: string): Urgency {
  const days = daysBetween(today, deadline)
  if (days < 0) return 'overdue'
  if (days <= 3) return 'urgent'
  if (days <= 7) return 'soon'
  return 'later'
}

const URGENCY_TONE: Record<Urgency, BadgeTone> = {
  overdue: 'red',
  urgent: 'red',
  soon: 'amber',
  later: 'gray',
}

/** Statuses where the deadline field is in use. */
const DEADLINE_STATUSES: Status[] = ['wishlist', 'test', 'interview', 'offer']

export function hasActiveDeadline(application: Application): boolean {
  return application.deadline !== null && DEADLINE_STATUSES.includes(application.status)
}

export interface CardBadge {
  text: string
  tone: BadgeTone
}

/**
 * The colored label at the bottom of a card.
 * @param rejectedAfter for rejected applications: the stage the rejection came at.
 */
export function getCardBadge(
  application: Application,
  today: string,
  rejectedAfter: Status | null = null,
): CardBadge | null {
  if (application.status === 'applied') {
    const date = application.applied_at ? ` ${formatShortDate(application.applied_at, today)}` : ''
    return { text: `Подано${date}`, tone: 'blue' }
  }
  if (application.status === 'rejected') {
    const stage = rejectedAfter ? STATUS_META[rejectedAfter].rejectedAfter : ''
    return { text: stage ? `Отказ ${stage}` : 'Отказ', tone: 'red' }
  }
  if (!application.deadline) return null

  const days = daysBetween(today, application.deadline)
  const tone = URGENCY_TONE[getUrgency(application.deadline, today)]
  const date = formatShortDate(application.deadline, today)
  const soon = days <= 1 ? describeDaysAhead(days) : null // 'сегодня' or 'завтра'

  switch (application.status) {
    case 'wishlist':
      if (days < 0) return { text: 'Дедлайн прошёл', tone }
      return { text: days > 60 ? `Дедлайн ${date}` : `Дедлайн ${describeDaysAhead(days)}`, tone }
    case 'test':
      if (days < 0) return { text: 'Срок теста прошёл', tone }
      return { text: soon ? `Тест ${soon}` : `Тест до ${date}`, tone }
    case 'interview':
      // A past interview is not urgent: it simply happened.
      if (days < 0) return { text: `Интервью было ${date}`, tone: 'gray' }
      return { text: soon ? `Интервью ${soon}` : `Интервью ${date}`, tone }
    case 'offer':
      if (days < 0) return { text: 'Срок ответа прошёл', tone }
      return { text: soon ? `Ответить ${soon}` : `Ответить до ${date}`, tone: tone === 'gray' ? 'green' : tone }
  }
}

/** "Следующий шаг" in the application card, or null when nothing is left to do. */
export function getNextStep(application: Application, today: string): string | null {
  const date = application.deadline ? formatLongDate(application.deadline, today) : null
  switch (application.status) {
    case 'wishlist':
      return date ? `Подать заявку до ${date}` : 'Подать заявку'
    case 'applied':
      return 'Дождаться ответа компании'
    case 'test':
      return date ? `Пройти тест до ${date}` : 'Пройти тест'
    case 'interview':
      return date ? `Подготовиться к интервью ${date}` : 'Подготовиться к интервью'
    case 'offer':
      return date ? `Ответить на оффер до ${date}` : 'Ответить на оффер'
    case 'rejected':
      return null
  }
}

/** Active deadlines from today up to `days` days ahead, nearest first. */
export function upcomingDeadlines(applications: Application[], today: string, days = 7): Application[] {
  return applications
    .filter((a) => hasActiveDeadline(a))
    .filter((a) => {
      const left = daysBetween(today, a.deadline!)
      return left >= 0 && left <= days
    })
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!))
}
