import { latestResult } from '../../lib/ai'
import type { Application } from '../../lib/types'
import type { TabId } from '../../pages/ApplicationPanel'
import { useTracker } from '../../state/TrackerProvider'

interface Props {
  application: Application
  onOpenTab(tab: TabId): void
}

export function LetterTab({ application }: Props) {
  const { aiResults } = useTracker()
  const letter = latestResult(aiResults, application.id, 'cover_letter')

  return letter ? (
    <p className="text-sm leading-relaxed whitespace-pre-line">{letter.content.text}</p>
  ) : (
    <p className="text-sm text-ink-muted">Черновика cover letter для этой заявки пока нет.</p>
  )
}
