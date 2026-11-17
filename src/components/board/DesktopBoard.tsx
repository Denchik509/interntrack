import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useState } from 'react'
import { STATUS_META } from '../../lib/statuses'
import { STATUSES, type Status } from '../../lib/types'
import { DraggableCard, DragPreview, type CardData } from './ApplicationCard'

interface BoardProps {
  columns: Record<Status, CardData[]>
  onMove(applicationId: string, status: Status): void
}

function companyOf(columns: BoardProps['columns'], id: string | number): string {
  for (const status of STATUSES) {
    const card = columns[status].find((c) => c.application.id === id)
    if (card) return card.application.company
  }
  return 'Карточка'
}

/**
 * Six columns, one per status. Dragging a card to another column changes
 * its status. dnd-kit tracks the pointer; we only react to "drag started"
 * and "dropped over column X".
 */
export function DesktopBoard({ columns, onMove }: BoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    // Mouse: a drag starts after moving 6 px, so a plain click still opens the card.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Touch: press and hold 200 ms, so a normal swipe still scrolls the board.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  )

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Взята карточка ${companyOf(columns, active.id)}.`,
    onDragOver: ({ over }) => (over ? `Над колонкой «${STATUS_META[over.id as Status].label}».` : 'Вне колонок.'),
    onDragEnd: ({ active, over }) =>
      over
        ? `Карточка ${companyOf(columns, active.id)} перенесена в «${STATUS_META[over.id as Status].label}».`
        : 'Карточка возвращена на место.',
    onDragCancel: () => 'Перетаскивание отменено.',
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    if (event.over) onMove(String(event.active.id), event.over.id as Status)
  }

  const activeCard = activeId
    ? STATUSES.flatMap((s) => columns[s]).find((c) => c.application.id === activeId)
    : undefined

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: 'Чтобы сменить статус, открой карточку и выбери статус в списке.',
        },
      }}
    >
      <div className="overflow-x-auto px-8 pt-3 pb-8">
        <div className="grid grid-cols-[repeat(6,minmax(210px,1fr))] items-start gap-4">
          {STATUSES.map((status) => (
            <Column key={status} status={status} cards={columns[status]} />
          ))}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>{activeCard ? <DragPreview {...activeCard} /> : null}</DragOverlay>
    </DndContext>
  )
}

function Column({ status, cards }: { status: Status; cards: CardData[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const meta = STATUS_META[status]
  const headingId = `column-${status}`

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2.5">
      <h2 id={headingId} className="flex items-center gap-2 px-0.5 py-1 text-[13px] font-semibold text-ink">
        <span aria-hidden="true" className={`size-2 rounded-full ${meta.dotClass}`} />
        {meta.label}
        <span className="ml-auto font-medium text-ink-muted">
          <span className="sr-only">: </span>
          {cards.length}
        </span>
      </h2>
      <div
        ref={setNodeRef}
        className={`flex min-h-24 flex-col gap-2.5 rounded-xl transition-colors ${
          isOver ? 'bg-accent-soft outline-2 outline-offset-4 outline-accent/40 outline-dashed' : ''
        }`}
      >
        {cards.map((card) => (
          <DraggableCard key={card.application.id} {...card} />
        ))}
        {cards.length === 0 && (
          <p className="rounded-[10px] border border-dashed border-line-strong px-3 py-6 text-center text-[13px] text-ink-muted">
            Пусто
          </p>
        )}
      </div>
    </section>
  )
}
