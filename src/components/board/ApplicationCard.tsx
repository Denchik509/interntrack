import { useDraggable } from '@dnd-kit/core'
import { Link, useLocation } from 'react-router'
import type { CardBadge } from '../../lib/deadlines'
import type { Application } from '../../lib/types'
import { SparkleIcon } from '../icons'
import { Badge } from '../ui'

export interface CardData {
  application: Application
  badge: CardBadge | null
  hasAnalysis: boolean
}

interface CardBodyProps extends CardData {
  size: 'compact' | 'large'
}

/** What a card shows: company, role, deadline badge, AI mark. */
export function CardBody({ application, badge, hasAnalysis, size }: CardBodyProps) {
  const large = size === 'large'
  return (
    <>
      <span className={`font-semibold text-ink ${large ? 'text-base' : 'text-sm'}`}>{application.company}</span>
      <span className={`text-ink-muted ${large ? 'text-sm' : 'text-[13px]'}`}>
        {application.role}
        {large && application.location ? ` · ${application.location}` : ''}
      </span>
      {(badge || hasAnalysis) && (
        <span className="mt-1 flex items-center justify-between gap-2">
          {badge ? <Badge tone={badge.tone}>{badge.text}</Badge> : <span />}
          {hasAnalysis && (
            <span title="AI-анализ готов" className="text-accent-ink">
              <SparkleIcon role="img" aria-hidden={false} aria-label="AI-анализ готов" width={large ? 18 : 16} height={large ? 18 : 16} />
            </span>
          )}
        </span>
      )}
    </>
  )
}

const CARD_CLASSES =
  'flex flex-col gap-1.5 rounded-[10px] border border-line bg-surface p-3 text-left no-underline transition-colors hover:border-line-strong'

/** A card on the desktop board: a link to the application that can be dragged. */
export function DraggableCard(props: CardData) {
  const location = useLocation()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: props.application.id })

  return (
    <Link
      ref={setNodeRef}
      to={`/applications/${props.application.id}${location.search}`}
      {...listeners}
      {...attributes}
      // dnd-kit marks draggables as buttons; this one is a link to the card.
      role={undefined}
      aria-roledescription="перетаскиваемая карточка"
      className={`${CARD_CLASSES} ${isDragging ? 'opacity-40' : ''}`}
    >
      <CardBody {...props} size="compact" />
    </Link>
  )
}

/** The copy that follows the pointer while dragging: the only card with a shadow. */
export function DragPreview(props: CardData) {
  return (
    <div className={`${CARD_CLASSES} w-[240px] rotate-1 cursor-grabbing shadow-xl`}>
      <CardBody {...props} size="compact" />
    </div>
  )
}

/** A card on the phone board: a plain link, bigger text and padding. */
export function MobileCard(props: CardData) {
  const location = useLocation()
  return (
    <Link
      to={`/applications/${props.application.id}${location.search}`}
      className={`${CARD_CLASSES} gap-1.5 rounded-xl p-4`}
    >
      <CardBody {...props} size="large" />
    </Link>
  )
}
