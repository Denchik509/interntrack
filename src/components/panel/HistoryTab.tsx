import { useState, type FormEvent } from 'react'
import { formatDateTime, todayISO } from '../../lib/dates'
import { eventsOf } from '../../lib/history'
import { STATUS_META } from '../../lib/statuses'
import type { Application, ApplicationEvent } from '../../lib/types'
import { useTracker } from '../../state/TrackerProvider'
import { useToast } from '../Toaster'
import { Button, TextArea } from '../ui'
import { NextStep } from './NextStep'

function describe(event: ApplicationEvent, isFirst: boolean): string {
  if (event.type === 'note') return 'Заметка'
  const label = STATUS_META[event.type].label
  return isFirst ? `Заявка добавлена · ${label}` : `Статус: ${label}`
}

export function HistoryTab({ application }: { application: Application }) {
  const { events, addNote } = useTracker()
  const { notify } = useToast()
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const today = todayISO()

  const history = eventsOf(application.id, events)
  const firstStatusId = history.find((e) => e.type !== 'note')?.id

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!note.trim()) return
    setSaving(true)
    try {
      await addNote(application.id, note.trim())
      setNote('')
    } catch (e) {
      notify(`Не удалось добавить заметку: ${e instanceof Error ? e.message : e}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <NextStep application={application} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <TextArea
          label="Добавить в историю"
          placeholder="Например: написал рекрутеру в LinkedIn"
          rows={2}
          maxLength={2000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button type="submit" busy={saving} disabled={!note.trim()} className="self-start">
          Добавить
        </Button>
      </form>

      <ol className="flex flex-col">
        {[...history].reverse().map((event, index, list) => {
          const dot = event.type === 'note' ? 'bg-line-strong' : STATUS_META[event.type].dotClass
          return (
            <li key={event.id} className="relative flex gap-3 pb-5">
              {index < list.length - 1 && (
                <span aria-hidden="true" className="absolute top-4 bottom-0 left-[5px] w-px bg-line" />
              )}
              <span aria-hidden="true" className={`relative mt-1.5 size-[11px] flex-none rounded-full ${dot}`} />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{describe(event, event.id === firstStatusId)}</span>
                {event.note && <p className="text-sm whitespace-pre-line text-ink">{event.note}</p>}
                <time dateTime={event.happened_at} className="text-[13px] text-ink-muted">
                  {formatDateTime(event.happened_at, today)}
                </time>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
