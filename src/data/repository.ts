import type {
  AiResult,
  AnalysisContent,
  Application,
  ApplicationEvent,
  ApplicationInput,
  ApplicationPatch,
  CoverLetterContent,
  CvVersion,
} from '../lib/types'

/** Everything the app shows, loaded once after sign-in. */
export interface TrackerData {
  applications: Application[]
  events: ApplicationEvent[]
  aiResults: AiResult[]
  cv: CvVersion | null
}

export type NewAiResult =
  | { application_id: string; kind: 'analysis'; content: AnalysisContent; cv_title: string | null }
  | { application_id: string; kind: 'cover_letter'; content: CoverLetterContent; cv_title: string | null }

/**
 * Where the data lives. The app talks only to this interface, so the same
 * screens work with Supabase (a real account) and with the browser's
 * localStorage (demo mode).
 */
export interface Repository {
  loadAll(): Promise<TrackerData>
  createApplication(input: ApplicationInput): Promise<Application>
  updateApplication(id: string, patch: ApplicationPatch): Promise<Application>
  deleteApplication(id: string): Promise<void>
  /** History of one application, oldest first. */
  listEvents(applicationId: string): Promise<ApplicationEvent[]>
  addNote(applicationId: string, note: string): Promise<ApplicationEvent>
  /** Creates the CV on first save, updates it afterwards. */
  saveCv(content: string, existing: CvVersion | null): Promise<CvVersion>
  saveAiResult(result: NewAiResult): Promise<AiResult>
  updateCoverLetter(id: string, text: string): Promise<AiResult>
}
