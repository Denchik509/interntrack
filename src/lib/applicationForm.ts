import type { Application, ApplicationInput, Status } from './types'

/** Form values are always strings: an empty field is '' here and null in the database. */
export interface FormValues {
  company: string
  role: string
  location: string
  job_url: string
  status: Status
  deadline: string
  job_description: string
  notes: string
}

export function toFormValues(application?: Application): FormValues {
  return {
    company: application?.company ?? '',
    role: application?.role ?? '',
    location: application?.location ?? '',
    job_url: application?.job_url ?? '',
    status: application?.status ?? 'wishlist',
    deadline: application?.deadline ?? '',
    job_description: application?.job_description ?? '',
    notes: application?.notes ?? '',
  }
}

export function toInput(values: FormValues): ApplicationInput {
  const orNull = (value: string) => value.trim() || null
  return {
    company: values.company.trim(),
    role: values.role.trim(),
    location: orNull(values.location),
    job_url: orNull(values.job_url),
    status: values.status,
    deadline: values.deadline || null,
    job_description: orNull(values.job_description),
    notes: orNull(values.notes),
  }
}
