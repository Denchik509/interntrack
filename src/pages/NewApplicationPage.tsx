import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ApplicationFields } from '../components/ApplicationFields'
import { toFormValues, toInput } from '../lib/applicationForm'
import { CloseIcon } from '../components/icons'
import { Sheet } from '../components/Sheet'
import { useToast } from '../components/Toaster'
import { Button } from '../components/ui'
import { useTracker } from '../state/TrackerProvider'

export function NewApplicationPage() {
  const { createApplication } = useTracker()
  const { notify } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState(toFormValues)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => navigate(`/${location.search}`)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const input = toInput(values)
    if (!input.company || !input.role) {
      setError('Заполни компанию и позицию.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const created = await createApplication(input)
      notify(`Заявка в ${created.company} добавлена`)
      close()
    } catch (e) {
      setError(`Не удалось сохранить: ${e instanceof Error ? e.message : e}`)
      setBusy(false)
    }
  }

  return (
    <Sheet labelledBy="new-application-title" onClose={close} placement="center">
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 id="new-application-title" className="text-lg font-bold">
            Новая заявка
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Закрыть форму"
            className="flex size-11 items-center justify-center rounded-lg border border-line text-ink-muted hover:text-ink"
          >
            <CloseIcon />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <ApplicationFields
            values={values}
            onChange={setValues}
            fields={['company', 'role', 'location', 'status', 'deadline', 'job_url', 'job_description']}
          />
          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-tone-red-bg px-3 py-2 text-sm text-tone-red-fg">
              {error}
            </p>
          )}
        </div>
        <footer className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-4">
          <Button onClick={close}>Отмена</Button>
          <Button type="submit" variant="primary" busy={busy}>
            Сохранить
          </Button>
        </footer>
      </form>
    </Sheet>
  )
}
