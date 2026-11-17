import { isStatus } from './statuses'
import type { ApplicationEvent, Status } from './types'

/** Events of one application, oldest first. */
export function eventsOf(applicationId: string, events: ApplicationEvent[]): ApplicationEvent[] {
  return events
    .filter((e) => e.application_id === applicationId)
    .sort((a, b) => a.happened_at.localeCompare(b.happened_at))
}

/**
 * The stage a rejection came at: the status the application had right
 * before it moved to "rejected". Null if it was never rejected or the
 * history does not say.
 */
export function rejectedAfter(history: ApplicationEvent[]): Status | null {
  const statuses = history.map((e) => e.type).filter(isStatus)
  const index = statuses.lastIndexOf('rejected')
  if (index <= 0) return null
  return statuses[index - 1]
}

/** rejectedAfter for every application at once: application id -> stage. */
export function rejectionStages(events: ApplicationEvent[]): Map<string, Status | null> {
  const byApplication = new Map<string, ApplicationEvent[]>()
  for (const event of events) {
    const list = byApplication.get(event.application_id) ?? []
    list.push(event)
    byApplication.set(event.application_id, list)
  }
  const result = new Map<string, Status | null>()
  for (const [id, list] of byApplication) {
    list.sort((a, b) => a.happened_at.localeCompare(b.happened_at))
    result.set(id, rejectedAfter(list))
  }
  return result
}
