import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { BarChart } from '../components/BarChart'
import { PageHeader } from '../components/PageHeader'
import { Badge } from '../components/ui'
import { plural, todayISO } from '../lib/dates'
import { getCardBadge } from '../lib/deadlines'
import { STATUS_META } from '../lib/statuses'
import { computeStats } from '../lib/stats'
import { STATUSES } from '../lib/types'
import { useTracker } from '../state/TrackerProvider'

const REJECTION_LABEL: Record<string, string> = {
  wishlist: 'До подачи',
  applied: 'После подачи',
  test: 'После теста',
  interview: 'После интервью',
  offer: 'После оффера',
}

const FUNNEL_DETAIL: Record<string, string> = {
  applied: 'отправлены',
  test: 'дошли до теста или дальше',
  interview: 'дошли до интервью или дальше',
  offer: 'получили оффер',
}

function percent(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—'
}

const applicationsWord = (n: number) => plural(n, ['заявка', 'заявки', 'заявок'])

export function StatsPage() {
  const { applications, events } = useTracker()
  const today = todayISO()
  const stats = computeStats(applications, events, today)

  if (stats.total === 0) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <PageHeader title="Статистика" />
        <p className="rounded-xl border border-dashed border-line-strong bg-surface px-6 py-12 text-center text-sm text-ink-muted">
          Цифры появятся, когда на доске будут заявки.{' '}
          <Link to="/new" className="font-medium text-accent-ink">
            Добавить первую
          </Link>
        </p>
      </main>
    )
  }

  const rejectedTotal = stats.rejections.reduce((sum, r) => sum + r.count, 0)
  const topRejection = [...stats.rejections].sort((a, b) => b.count - a.count)[0]

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Статистика" subtitle={`${stats.total} ${applicationsWord(stats.total)} на доске`} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label="Отправлено" value={String(stats.submitted)} note={`из ${stats.total} на доске`} />
        <Tile
          label="Доля ответов"
          value={stats.responseRate === null ? '—' : percent(stats.responses, stats.submitted)}
          note={
            stats.submitted
              ? `${stats.responses} из ${stats.submitted} компаний ответили: тест, интервью, оффер или отказ`
              : 'Появится после первой отправленной заявки'
          }
        />
        <Tile label="Офферы" value={String(stats.byStatus.offer)} note={stats.byStatus.offer ? 'Ждут твоего ответа' : 'Пока нет'} />
      </div>

      <Card title="По статусам" description="Те же числа, что в колонках доски.">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STATUSES.map((status) => (
            <li key={status}>
              <Link
                to={`/?tab=${status}`}
                className="flex flex-col gap-1 rounded-lg border border-line px-3 py-2.5 no-underline hover:border-line-strong"
              >
                <span className="flex items-center gap-2 text-[13px] font-medium text-ink-muted">
                  <span aria-hidden="true" className={`size-2 rounded-full ${STATUS_META[status].dotClass}`} />
                  {STATUS_META[status].label}
                </span>
                <span className="text-2xl font-bold text-ink tabular-nums">{stats.byStatus[status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Как далеко доходят заявки"
          description="Сколько отправленных заявок дошли до каждого этапа. Процент — от отправленных."
        >
          <BarChart
            caption="Сколько отправленных заявок дошли до каждого этапа"
            rows={stats.funnel.map(({ stage, count }) => ({
              label: STATUS_META[stage].label,
              value: count,
              note: stage === 'applied' ? undefined : percent(count, stats.submitted),
              detail: `${count} ${applicationsWord(count)} ${FUNNEL_DETAIL[stage]}`,
            }))}
          />
        </Card>

        <Card
          title="Где приходит отказ"
          description={
            topRejection
              ? `Чаще всего: ${REJECTION_LABEL[topRejection.stage].toLowerCase()} (${topRejection.count} из ${rejectedTotal}).`
              : 'Отказов пока нет.'
          }
        >
          {stats.rejections.length > 0 && (
            <BarChart
              caption="Количество отказов по этапам"
              rows={stats.rejections.map(({ stage, count }) => ({
                label: REJECTION_LABEL[stage],
                value: count,
                detail: `${count} ${plural(count, ['отказ', 'отказа', 'отказов'])} ${REJECTION_LABEL[stage].toLowerCase()}`,
              }))}
            />
          )}
        </Card>
      </div>

      <Card title="Ближайшие дедлайны" description="На две недели вперёд.">
        {stats.upcoming.length === 0 ? (
          <p className="text-sm text-ink-muted">В ближайшие две недели дедлайнов нет.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {stats.upcoming.map((application) => {
              const badge = getCardBadge(application, today)
              return (
                <li key={application.id}>
                  <Link
                    to={`/applications/${application.id}`}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 no-underline"
                  >
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold text-ink">{application.company}</span>
                      <span className="text-[13px] text-ink-muted">
                        {application.role} · {STATUS_META[application.status].label}
                      </span>
                    </span>
                    {badge && <Badge tone={badge.tone}>{badge.text}</Badge>}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </main>
  )
}

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-5">
      <span className="text-sm font-medium text-ink-muted">{label}</span>
      <span className="text-3xl font-bold text-ink tabular-nums">{value}</span>
      <span className="text-[13px] text-ink-muted">{note}</span>
    </div>
  )
}

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="text-[13px] text-ink-muted">{description}</p>}
      </div>
      {children}
    </section>
  )
}
