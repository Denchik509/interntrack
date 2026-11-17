// Shapes of the data the app works with. They mirror the database tables
// in supabase/migrations, with dates kept as ISO strings.

export const STATUSES = [
  'wishlist',
  'applied',
  'test',
  'interview',
  'offer',
  'rejected',
] as const

export type Status = (typeof STATUSES)[number]

export interface Application {
  id: string
  company: string
  role: string
  job_url: string | null
  location: string | null
  status: Status
  /** Date of the next step, 'YYYY-MM-DD'. What it means depends on status. */
  deadline: string | null
  /** Day the application was sent, 'YYYY-MM-DD'. */
  applied_at: string | null
  job_description: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

/** Fields the user fills in when creating an application. */
export interface ApplicationInput {
  company: string
  role: string
  job_url: string | null
  location: string | null
  status: Status
  deadline: string | null
  job_description: string | null
  notes: string | null
}

export type ApplicationPatch = Partial<ApplicationInput & { applied_at: string | null }>

/** A status the application moved to, or a note the user wrote. */
export type EventType = Status | 'note'

export interface ApplicationEvent {
  id: string
  application_id: string
  type: EventType
  happened_at: string
  note: string | null
}

export interface CvVersion {
  id: string
  title: string
  content: string
  updated_at: string
}

export interface AnalysisContent {
  /** Requirements of the job that the CV covers. */
  matches: string[]
  /** Requirements the CV does not show. */
  gaps: string[]
  /** What to emphasise in the application. */
  highlights: string[]
}

export interface CoverLetterContent {
  text: string
}

interface AiResultBase {
  id: string
  application_id: string
  cv_title: string | null
  created_at: string
}

export type AiResult =
  | (AiResultBase & { kind: 'analysis'; content: AnalysisContent })
  | (AiResultBase & { kind: 'cover_letter'; content: CoverLetterContent })

export type AiKind = AiResult['kind']
