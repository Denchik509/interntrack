import { todayISO } from './dates'
import { STATUSES, type Application, type ApplicationPatch, type Status } from './types'

interface StatusMeta {
  /** Column title on the board. */
  label: string
  /** Tailwind class for the colored dot next to the status. */
  dotClass: string
  /** "Отказ после …": the stage a rejection came at. */
  rejectedAfter: string
  /** Label of the deadline field while the application has this status. */
  deadlineLabel: string
}

export const STATUS_META: Record<Status, StatusMeta> = {
  wishlist: {
    label: 'Хочу податься',
    dotClass: 'bg-status-wishlist',
    rejectedAfter: 'до подачи',
    deadlineLabel: 'Дедлайн подачи',
  },
  applied: {
    label: 'Подано',
    dotClass: 'bg-status-applied',
    rejectedAfter: 'после подачи',
    deadlineLabel: 'Дата следующего шага',
  },
  test: {
    label: 'Тест',
    dotClass: 'bg-status-test',
    rejectedAfter: 'после теста',
    deadlineLabel: 'Пройти тест до',
  },
  interview: {
    label: 'Интервью',
    dotClass: 'bg-status-interview',
    rejectedAfter: 'после интервью',
    deadlineLabel: 'Дата интервью',
  },
  offer: {
    label: 'Оффер',
    dotClass: 'bg-status-offer',
    rejectedAfter: 'после оффера',
    deadlineLabel: 'Ответить на оффер до',
  },
  rejected: {
    label: 'Отказ',
    dotClass: 'bg-status-rejected',
    rejectedAfter: '',
    deadlineLabel: 'Дата',
  },
}

export function isStatus(value: unknown): value is Status {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value)
}

/** The status after this one on the board, or null for the last column. */
export function nextStatus(status: Status): Status | null {
  const index = STATUSES.indexOf(status)
  return STATUSES[index + 1] ?? null
}

export function previousStatus(status: Status): Status | null {
  const index = STATUSES.indexOf(status)
  return index > 0 ? STATUSES[index - 1] : null
}

/**
 * What changes together with a status: the application date is filled in
 * on "Подано", and the old deadline is cleared because the next step has
 * its own date (a test deadline, an interview date, ...).
 */
export function statusChangePatch(
  application: Application,
  status: Status,
  today: string = todayISO(),
): ApplicationPatch {
  const patch: ApplicationPatch = { status, deadline: null }
  if (status === 'applied' && !application.applied_at) patch.applied_at = today
  return patch
}
