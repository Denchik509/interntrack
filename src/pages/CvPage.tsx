import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../components/Toaster'
import { Button, TextArea } from '../components/ui'
import { formatDateTime } from '../lib/dates'
import { useTracker } from '../state/TrackerProvider'

export function CvPage() {
  const { cv, saveCv } = useTracker()
  const { notify } = useToast()
  const [text, setText] = useState(cv?.content ?? '')
  const [saving, setSaving] = useState(false)
  const changed = text !== (cv?.content ?? '')

  async function save() {
    setSaving(true)
    try {
      await saveCv(text.trim())
      setText(text.trim())
      notify('CV сохранено')
    } catch (e) {
      notify(`Не удалось сохранить: ${e instanceof Error ? e.message : e}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Моё CV" subtitle="Текст, с которым AI сравнивает вакансии" />

      <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
        <TextArea
          label={cv ? `Версия «${cv.title}»` : 'Текст CV'}
          hint="Скопируй текст из PDF или Word. Оформление не важно, важны факты: опыт, проекты, навыки, учёба."
          rows={22}
          maxLength={30000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="font-mono text-sm"
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button variant="primary" busy={saving} disabled={!changed || !text.trim()} onClick={save}>
            Сохранить
          </Button>
          {cv && (
            <span className="text-[13px] text-ink-muted">
              {changed ? 'Есть несохранённые изменения' : `Сохранено ${formatDateTime(cv.updated_at)}`}
            </span>
          )}
        </div>
      </div>
    </main>
  )
}
