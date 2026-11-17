import { useState } from 'react'
import type { Application } from '../../lib/types'
import { useTracker } from '../../state/TrackerProvider'
import { useToast } from '../Toaster'
import { Button, TextArea } from '../ui'

export function VacancyTab({ application }: { application: Application }) {
  const { updateApplication } = useTracker()
  const { notify } = useToast()
  const [text, setText] = useState(application.job_description ?? '')
  const [saving, setSaving] = useState(false)
  const changed = (text.trim() || null) !== application.job_description

  async function save() {
    setSaving(true)
    try {
      await updateApplication(application.id, { job_description: text.trim() || null })
      notify('Текст вакансии сохранён')
    } catch (e) {
      notify(`Не удалось сохранить: ${e instanceof Error ? e.message : e}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <TextArea
        label="Текст вакансии"
        hint="Требования, обязанности, что предлагают. По этому тексту AI сравнит вакансию с твоим CV."
        rows={16}
        maxLength={50000}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button variant="primary" busy={saving} disabled={!changed} onClick={save} className="self-start">
        Сохранить
      </Button>
    </div>
  )
}
