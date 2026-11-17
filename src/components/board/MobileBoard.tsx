import { useRef, type TouchEvent } from 'react'
import { useSearchParams } from 'react-router'
import { isStatus, nextStatus, previousStatus, STATUS_META } from '../../lib/statuses'
import { STATUSES, type Status } from '../../lib/types'
import { MobileCard, type CardData } from './ApplicationCard'

/**
 * On a phone six columns do not fit, so each status becomes a tab.
 * The open tab is kept in the address (?tab=test), so "back" from a card
 * returns to the same tab. A horizontal swipe switches tabs.
 */
export function MobileBoard({ columns }: { columns: Record<Status, CardData[]> }) {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab')
  const current: Status = isStatus(tab) ? tab : 'wishlist'
  const swipeStart = useRef<{ x: number; y: number } | null>(null)

  function select(status: Status) {
    const next = new URLSearchParams(params)
    next.set('tab', status)
    setParams(next, { replace: true })
    document.getElementById(`tab-${status}`)?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    swipeStart.current = { x: touch.clientX, y: touch.clientY }
  }

  function onTouchEnd(event: TouchEvent) {
    const start = swipeStart.current
    swipeStart.current = null
    if (!start) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    // Only a clearly horizontal swipe counts; vertical moves are scrolling.
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.6) return
    const target = dx < 0 ? nextStatus(current) : previousStatus(current)
    if (target) select(target)
  }

  const cards = columns[current]

  return (
    <div className="flex flex-1 flex-col">
      <div role="tablist" aria-label="Статусы" className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
        {STATUSES.map((status) => {
          const selected = status === current
          return (
            <button
              key={status}
              id={`tab-${status}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="status-panel"
              onClick={() => select(status)}
              className={`h-11 flex-none rounded-full px-3.5 text-sm ${
                selected
                  ? 'bg-ink font-semibold text-canvas'
                  : 'border border-line-strong bg-surface font-medium text-ink-muted'
              }`}
            >
              {STATUS_META[status].label} · {columns[status].length}
            </button>
          )
        })}
      </div>

      <div
        id="status-panel"
        role="tabpanel"
        aria-labelledby={`tab-${current}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="flex flex-1 flex-col gap-3 px-4 pt-1 pb-4"
      >
        {cards.map((card) => (
          <MobileCard key={card.application.id} {...card} />
        ))}
        {cards.length === 0 && (
          <p className="rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-muted">
            В «{STATUS_META[current].label}» пока ничего нет.
          </p>
        )}
        <p className="mt-2 text-center text-[13px] text-ink-muted">Свайп влево — следующий статус</p>
      </div>
    </div>
  )
}
