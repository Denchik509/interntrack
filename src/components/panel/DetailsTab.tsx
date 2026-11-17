import { useState, type FormEvent } from 'react'
import type { Application } from '../../lib/types'
import { useTracker } from '../../state/TrackerProvider'
import { toFormValues, toInput } from '../../lib/applicationForm'
import { ApplicationFields } from '../ApplicationFields'
import { TrashIcon } from '../icons'
import { useToast } from '../Toaster'
import { Button } from '../ui'
import { NextStep } from './NextStep'

interface Props {
  application: Application
  onDeleted(): void
}

export function DetailsTab({ application, onDeleted }: Props) {
  const { updateApplication, deleteApplication } = useTracker()
  const { notify } = useToast()
  const [values, setValues] = useState(() => toFormValues(application))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const input = toInput(values)
  const original = toInput(toFormValues(application))
  const changed = (['company', 'role', 'location', 'job_url', 'deadline', 'notes'] as const).some(
    (field) => input[field] !== original[field],
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!input.company || !input.role) {
      notify('Заполни компанию и позицию.', 'error')
      return
    }
    setSaving(true)
    try {
      const { company, role, location, job_url, deadline, notes } = input
      await updateApplication(application.id, { company, role, location, job_url, deadline, notes })
      notify('Изменения сохранены')
    } catch (e) {
      notify(`Не удалось сохранить: ${e instanceof Error ? e.message : e}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Удалить заявку в ${application.company}? История и AI-анализ удалятся вместе с ней.`)) return
    setDeleting(true)
    try {
      await deleteApplication(application.id)
      notify('Заявка удалена')
      onDeleted()
    } catch (e) {
      notify(`Не удалось удалить: ${e instanceof Error ? e.message : e}`, 'error')
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <NextStep application={application} />
      <ApplicationFields
        // The deadline label follows the current status ("Дата интервью", ...).
        values={{ ...values, status: application.status }}
        onChange={setValues}
        fields={['company', 'role', 'location', 'deadline', 'job_url', 'notes']}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="submit" variant="primary" busy={saving} disabled={!changed}>
          Сохранить
        </Button>
        <Button variant="danger" busy={deleting} onClick={handleDelete}>
          <TrashIcon />
          Удалить заявку
        </Button>
      </div>
    </form>
  )
}
