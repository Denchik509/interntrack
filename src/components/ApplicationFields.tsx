import { STATUS_META } from '../lib/statuses'
import type { FormValues } from '../lib/applicationForm'
import { STATUSES } from '../lib/types'
import { SelectField, TextArea, TextField } from './ui'

type Field = keyof FormValues

interface Props {
  values: FormValues
  onChange(values: FormValues): void
  fields: Field[]
}

/**
 * The application fields, shared by the "new application" form and the
 * "Детали" tab. `fields` says which of them to show.
 */
export function ApplicationFields({ values, onChange, fields }: Props) {
  const show = (field: Field) => fields.includes(field)
  const set = (field: Field) => (event: { target: { value: string } }) =>
    onChange({ ...values, [field]: event.target.value })

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {show('company') && (
          <TextField label="Компания" required maxLength={200} value={values.company} onChange={set('company')} />
        )}
        {show('role') && (
          <TextField label="Позиция" required maxLength={200} value={values.role} onChange={set('role')} />
        )}
        {show('location') && (
          <TextField
            label="Локация"
            maxLength={200}
            placeholder="Лондон, удалённо…"
            value={values.location}
            onChange={set('location')}
          />
        )}
        {show('status') && (
          <SelectField label="Статус" value={values.status} onChange={set('status')}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_META[status].label}
              </option>
            ))}
          </SelectField>
        )}
        {show('deadline') && (
          <TextField
            label={STATUS_META[values.status].deadlineLabel}
            type="date"
            value={values.deadline}
            onChange={set('deadline')}
          />
        )}
      </div>
      {show('job_url') && (
        <TextField
          label="Ссылка на вакансию"
          type="url"
          inputMode="url"
          placeholder="https://"
          maxLength={2000}
          value={values.job_url}
          onChange={set('job_url')}
        />
      )}
      {show('job_description') && (
        <TextArea
          label="Текст вакансии"
          hint="Скопируй описание со страницы вакансии: по нему AI сравнит вакансию с твоим CV."
          rows={6}
          maxLength={50000}
          value={values.job_description}
          onChange={set('job_description')}
        />
      )}
      {show('notes') && (
        <TextArea label="Заметки" rows={4} maxLength={10000} value={values.notes} onChange={set('notes')} />
      )}
    </div>
  )
}
