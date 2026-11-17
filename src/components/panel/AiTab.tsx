import { latestResult } from '../../lib/ai'
import { formatLongDate, todayISO, toISODate } from '../../lib/dates'
import type { AnalysisContent, Application } from '../../lib/types'
import type { TabId } from '../../pages/ApplicationPanel'
import { useTracker } from '../../state/TrackerProvider'
import { AlertIcon, CheckIcon, SparkleIcon } from '../icons'
import { NextStep } from './NextStep'

interface Props {
  application: Application
  onOpenTab(tab: TabId): void
}

export function AiTab({ application }: Props) {
  const { aiResults } = useTracker()
  const analysis = latestResult(aiResults, application.id, 'analysis')

  return (
    <div className="flex flex-col gap-5">
      <NextStep application={application} />
      {analysis ? (
        <>
          <AnalysisView content={analysis.content} />
          <p className="text-[13px] text-ink-muted">
            Анализ сделан {formatLongDate(toISODate(new Date(analysis.created_at)), todayISO())}
            {analysis.cv_title ? ` по версии CV «${analysis.cv_title}»` : ''}.
          </p>
        </>
      ) : (
        <p className="text-sm text-ink-muted">AI-анализа для этой заявки пока нет.</p>
      )}
    </div>
  )
}

const SECTIONS = [
  { key: 'matches', title: 'Совпадает с твоим CV', Icon: CheckIcon, iconClass: 'text-tone-green-fg' },
  { key: 'gaps', title: 'Чего не хватает', Icon: AlertIcon, iconClass: 'text-tone-amber-fg' },
  { key: 'highlights', title: 'Что подчеркнуть в заявке', Icon: SparkleIcon, iconClass: 'text-accent-ink' },
] as const

export function AnalysisView({ content }: { content: AnalysisContent }) {
  return (
    <div className="flex flex-col gap-5">
      {SECTIONS.map(({ key, title, Icon, iconClass }) => (
        <section key={key} className="flex flex-col gap-2.5">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold">
            <Icon className={iconClass} strokeWidth={1.75} />
            {title}
          </h3>
          {content[key].length > 0 ? (
            <ul className="flex list-disc flex-col gap-1.5 pl-6 text-sm leading-relaxed">
              {content[key].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="pl-6 text-sm text-ink-muted">Ничего не нашлось.</p>
          )}
        </section>
      ))}
    </div>
  )
}
