import { useMemo } from 'react'
import { Link, Outlet, useLocation, useSearchParams } from 'react-router'
import type { CardData } from '../components/board/ApplicationCard'
import { DesktopBoard } from '../components/board/DesktopBoard'
import { MobileBoard } from '../components/board/MobileBoard'
import { PlusIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../components/Toaster'
import { plural, todayISO } from '../lib/dates'
import { getCardBadge, upcomingDeadlines } from '../lib/deadlines'
import { rejectionStages } from '../lib/history'
import { STATUS_META } from '../lib/statuses'
import { STATUSES, type Application, type Status } from '../lib/types'
import { DESKTOP_QUERY, useMediaQuery } from '../lib/useMediaQuery'
import { useTracker } from '../state/TrackerProvider'

function matches(application: Application, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [application.company, application.role, application.location ?? ''].some((field) =>
    field.toLowerCase().includes(q),
  )
}

/** The main screen. Child routes (new application, application card) open on top of it. */
export function BoardPage() {
  const { applications, events, aiResults, moveApplication } = useTracker()
  const { notify } = useToast()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [params] = useSearchParams()
  const location = useLocation()
  const query = params.get('q') ?? ''
  const today = todayISO()

  // Group the cards by status. useMemo recalculates only when the data changes.
  const columns = useMemo(() => {
    const stages = rejectionStages(events)
    const analysed = new Set(aiResults.filter((r) => r.kind === 'analysis').map((r) => r.application_id))
    const byStatus = Object.fromEntries(STATUSES.map((s) => [s, [] as CardData[]])) as Record<Status, CardData[]>
    const sorted = [...applications].sort(
      (a, b) =>
        (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999') || b.updated_at.localeCompare(a.updated_at),
    )
    for (const application of sorted) {
      if (!matches(application, query)) continue
      byStatus[application.status].push({
        application,
        badge: getCardBadge(application, today, stages.get(application.id) ?? null),
        hasAnalysis: analysed.has(application.id),
      })
    }
    return byStatus
  }, [applications, events, aiResults, query, today])

  async function handleMove(id: string, status: Status) {
    const application = applications.find((a) => a.id === id)
    if (!application || application.status === status) return
    try {
      await moveApplication(id, status)
      notify(`${application.company}: ${STATUS_META[status].label}`)
    } catch (e) {
      notify(`Не удалось сменить статус: ${e instanceof Error ? e.message : e}`, 'error')
    }
  }

  const total = applications.length
  const thisWeek = upcomingDeadlines(applications, today).length
  const shown = STATUSES.reduce((sum, s) => sum + columns[s].length, 0)
  const summary = `${total} ${plural(total, ['заявка', 'заявки', 'заявок'])} · ${
    thisWeek ? `${thisWeek} ${plural(thisWeek, ['дедлайн', 'дедлайна', 'дедлайнов'])} на этой неделе` : 'дедлайнов на этой неделе нет'
  }`

  return (
    <main className="flex flex-1 flex-col">
      <div className="px-4 pt-5 pb-3 md:px-8 md:pt-7">
        <PageHeader
          title="Мои заявки"
          subtitle={total > 0 ? summary : undefined}
          actions={
            <Link
              to={`/new${location.search}`}
              aria-label="Добавить заявку"
              className="flex size-12 flex-none items-center justify-center rounded-full bg-accent text-white md:hidden"
            >
              <PlusIcon width={20} height={20} strokeWidth={2} />
            </Link>
          }
        />
      </div>

      {total === 0 ? (
        <EmptyBoard />
      ) : query && shown === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-ink-muted md:px-8">Ничего не найдено по запросу «{query}».</p>
      ) : isDesktop ? (
        <DesktopBoard columns={columns} onMove={handleMove} />
      ) : (
        <MobileBoard columns={columns} />
      )}

      <Outlet />
    </main>
  )
}

function EmptyBoard() {
  return (
    <div className="mx-4 my-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center md:mx-8">
      <h2 className="text-lg font-semibold">Добавь первую заявку</h2>
      <p className="max-w-md text-sm text-ink-muted">
        Компания, позиция и дедлайн — этого достаточно. Карточки появятся в колонках по статусам:
        от «Хочу податься» до оффера.
      </p>
      <Link
        to="/new"
        className="mt-2 inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white no-underline hover:bg-accent-hover"
      >
        <PlusIcon />
        Добавить заявку
      </Link>
    </div>
  )
}
