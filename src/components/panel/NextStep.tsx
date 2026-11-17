import { todayISO } from '../../lib/dates'
import { getNextStep } from '../../lib/deadlines'
import type { Application } from '../../lib/types'

export function NextStep({ application }: { application: Application }) {
  const step = getNextStep(application, todayISO())
  if (!step) return null
  return (
    <div className="flex flex-col gap-1 rounded-[10px] bg-accent-soft px-4 py-3.5">
      <span className="text-xs font-semibold text-accent-ink">Следующий шаг</span>
      <span className="text-[15px] font-medium text-ink">{step}</span>
    </div>
  )
}
