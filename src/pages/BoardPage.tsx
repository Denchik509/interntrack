import { PageHeader } from '../components/PageHeader'
import { STATUS_META } from '../lib/statuses'
import { useTracker } from '../state/TrackerProvider'

/** Temporary list of applications; the kanban board replaces it in stage 3. */
export function BoardPage() {
  const { applications } = useTracker()
  return (
    <main className="flex flex-col gap-4 px-4 py-6 md:px-8">
      <PageHeader title="Мои заявки" subtitle={`Всего: ${applications.length}`} />
      <ul className="flex flex-col gap-2">
        {applications.map((a) => (
          <li key={a.id} className="rounded-lg border border-line bg-surface p-3 text-sm">
            <span className="font-semibold">{a.company}</span> · {a.role} · {STATUS_META[a.status].label}
          </li>
        ))}
      </ul>
    </main>
  )
}
