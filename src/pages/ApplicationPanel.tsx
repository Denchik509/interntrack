import { useRef, useState, type KeyboardEvent } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { CloseIcon, ExternalIcon } from '../components/icons'
import { AiTab } from '../components/panel/AiTab'
import { DetailsTab } from '../components/panel/DetailsTab'
import { HistoryTab } from '../components/panel/HistoryTab'
import { LetterTab } from '../components/panel/LetterTab'
import { VacancyTab } from '../components/panel/VacancyTab'
import { Sheet } from '../components/Sheet'
import { useToast } from '../components/Toaster'
import { Badge } from '../components/ui'
import { formatLongDate, formatShortDate, todayISO } from '../lib/dates'
import { getCardBadge, hasActiveDeadline } from '../lib/deadlines'
import { eventsOf, rejectedAfter } from '../lib/history'
import { isStatus, STATUS_META } from '../lib/statuses'
import { STATUSES, type Application } from '../lib/types'
import { useTracker } from '../state/TrackerProvider'
import { useAiActions } from '../state/useAiActions'

const TABS = [
  { id: 'details', label: 'Детали' },
  { id: 'vacancy', label: 'Вакансия' },
  { id: 'ai', label: 'AI-анализ' },
  { id: 'letter', label: 'Письмо' },
  { id: 'history', label: 'История' },
] as const

type TabId = (typeof TABS)[number]['id']

/** The application card: a side panel on a computer, a full screen on a phone. */
export function ApplicationPanel() {
  const { id } = useParams()
  const { applications } = useTracker()
  const navigate = useNavigate()
  const location = useLocation()
  const application = applications.find((a) => a.id === id)

  const close = () => navigate(`/${location.search}`)

  // Unknown id (deleted, or a stale link): back to the board.
  if (!application) return <Navigate to={`/${location.search}`} replace />

  return (
    <Sheet labelledBy="application-title" onClose={close} placement="side">
      <PanelContent key={application.id} application={application} onClose={close} />
    </Sheet>
  )
}

function PanelContent({ application, onClose }: { application: Application; onClose(): void }) {
  const { events, moveApplication } = useTracker()
  const { notify } = useToast()
  const [tab, setTab] = useState<TabId>('details')
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({})
  // Lives here, above the tabs, so an AI request survives switching tabs.
  const ai = useAiActions(application)
  const today = todayISO()

  const badge = getCardBadge(application, today, rejectedAfter(eventsOf(application.id, events)))
  const meta = STATUS_META[application.status]

  async function changeStatus(value: string) {
    if (!isStatus(value)) return
    try {
      await moveApplication(application.id, value)
      notify(`Статус: ${STATUS_META[value].label}`)
    } catch (e) {
      notify(`Не удалось сменить статус: ${e instanceof Error ? e.message : e}`, 'error')
    }
  }

  // Arrow keys move between tabs, as screen reader users expect from a tablist.
  function onTabKeyDown(event: KeyboardEvent) {
    const index = TABS.findIndex((t) => t.id === tab)
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = TABS[(index + step + TABS.length) % TABS.length].id
    setTab(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <>
      <header className="flex flex-col gap-3 px-4 pt-5 pb-4 md:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id="application-title" className="text-[22px] font-bold break-words">
              {application.company}
            </h2>
            <p className="text-[15px] text-ink-muted">
              {application.role}
              {application.location ? ` · ${application.location}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть карточку"
            className="flex size-11 flex-none items-center justify-center rounded-lg border border-line text-ink-muted hover:text-ink"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative flex h-11 items-center rounded-lg border border-line-strong bg-surface pl-3 focus-within:border-accent">
            <span className="sr-only">Статус</span>
            <span aria-hidden="true" className={`size-2 flex-none rounded-full ${meta.dotClass}`} />
            <select
              value={application.status}
              onChange={(e) => void changeStatus(e.target.value)}
              className="h-full appearance-none bg-transparent pr-8 pl-2 text-sm font-medium text-ink outline-none"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_META[status].label}
                </option>
              ))}
            </select>
            <svg aria-hidden="true" className="pointer-events-none absolute right-3 size-3 text-ink-muted" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 4.5l3 3 3-3" />
            </svg>
          </label>
          {badge && (
            <Badge tone={badge.tone} className="px-2.5 py-1 text-[13px]">
              {badge.text}
              {/* Add the exact date when the badge says it only in words ("через 2 дня"). */}
              {application.deadline &&
              hasActiveDeadline(application) &&
              !badge.text.includes(formatShortDate(application.deadline, today))
                ? ` · ${formatLongDate(application.deadline, today)}`
                : ''}
            </Badge>
          )}
          {application.job_url && (
            <a
              href={application.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1.5 px-1 py-3 text-sm font-medium text-accent-ink"
            >
              Открыть вакансию
              <ExternalIcon />
              <span className="sr-only">(в новой вкладке)</span>
            </a>
          )}
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Разделы карточки"
        onKeyDown={onTabKeyDown}
        className="flex gap-1 overflow-x-auto border-b border-line px-4 [scrollbar-width:none] md:px-6"
      >
        {TABS.map(({ id, label }) => {
          const selected = id === tab
          return (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[id] = el
              }}
              id={`tab-${id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(id)}
              className={`h-11 flex-none border-b-2 px-3 text-sm ${
                selected
                  ? 'border-accent font-semibold text-accent-ink'
                  : 'border-transparent font-medium text-ink-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div
        id={`panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6"
      >
        {/* key={status}: a status change clears the deadline, so the form starts fresh. */}
        {tab === 'details' && <DetailsTab key={application.status} application={application} onDeleted={onClose} />}
        {tab === 'vacancy' && <VacancyTab application={application} />}
        {tab === 'ai' && <AiTab application={application} ai={ai} onOpenTab={setTab} />}
        {tab === 'letter' && <LetterTab application={application} ai={ai} onOpenTab={setTab} />}
        {tab === 'history' && <HistoryTab application={application} />}
      </div>
    </>
  )
}

export type { TabId }
