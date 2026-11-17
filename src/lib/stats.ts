import { daysBetween } from './dates'
import { hasActiveDeadline } from './deadlines'
import { rejectionStages } from './history'
import { isStatus } from './statuses'
import { STATUSES, type Application, type ApplicationEvent, type Status } from './types'

/** Stages in the order an application moves through them ("rejected" is not a stage). */
const STAGE_ORDER: Status[] = ['wishlist', 'applied', 'test', 'interview', 'offer']

export const FUNNEL_STAGES: Status[] = ['applied', 'test', 'interview', 'offer']

export interface Stats {
  total: number
  byStatus: Record<Status, number>
  /** Applications that were actually sent. */
  submitted: number
  /** Sent applications the company answered: a test, an interview, an offer or a rejection. */
  responses: number
  /** responses / submitted, from 0 to 1; null when nothing was sent yet. */
  responseRate: number | null
  /** How many applications got at least as far as each stage. */
  funnel: { stage: Status; count: number }[]
  /** Rejections grouped by the stage they came at. */
  rejections: { stage: Status; count: number }[]
  /** Active deadlines in the next 14 days, nearest first. */
  upcoming: Application[]
}

/**
 * The furthest stage an application reached, from its history and its
 * current status. Skipped stages count as passed: an application that went
 * from "applied" straight to "interview" got past the test stage too.
 */
function furthestStage(application: Application, history: ApplicationEvent[]): number {
  let furthest = STAGE_ORDER.indexOf(application.status)
  for (const event of history) {
    if (isStatus(event.type)) furthest = Math.max(furthest, STAGE_ORDER.indexOf(event.type))
  }
  return furthest
}

export function computeStats(applications: Application[], events: ApplicationEvent[], today: string): Stats {
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>
  const reached = Object.fromEntries(FUNNEL_STAGES.map((s) => [s, 0])) as Record<Status, number>
  const rejectedAt = new Map<Status, number>()
  const stages = rejectionStages(events)
  const historyById = new Map<string, ApplicationEvent[]>()
  for (const event of events) {
    historyById.set(event.application_id, [...(historyById.get(event.application_id) ?? []), event])
  }

  let submitted = 0
  let responses = 0

  for (const application of applications) {
    byStatus[application.status]++
    const furthest = furthestStage(application, historyById.get(application.id) ?? [])
    const wasSent = furthest >= STAGE_ORDER.indexOf('applied')
    if (wasSent) submitted++
    for (const stage of FUNNEL_STAGES) {
      if (furthest >= STAGE_ORDER.indexOf(stage)) reached[stage]++
    }
    const rejected = application.status === 'rejected'
    if (wasSent && (rejected || furthest >= STAGE_ORDER.indexOf('test'))) responses++
    if (rejected) {
      const stage = stages.get(application.id) ?? STAGE_ORDER[Math.max(furthest, 0)]
      rejectedAt.set(stage, (rejectedAt.get(stage) ?? 0) + 1)
    }
  }

  const upcoming = applications
    .filter((a) => hasActiveDeadline(a))
    .filter((a) => {
      const days = daysBetween(today, a.deadline!)
      return days >= 0 && days <= 14
    })
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!))

  return {
    total: applications.length,
    byStatus,
    submitted,
    responses,
    responseRate: submitted > 0 ? responses / submitted : null,
    funnel: FUNNEL_STAGES.map((stage) => ({ stage, count: reached[stage] })),
    rejections: STAGE_ORDER.filter((s) => rejectedAt.has(s)).map((stage) => ({
      stage,
      count: rejectedAt.get(stage)!,
    })),
    upcoming,
  }
}
