import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { latestResult } from '../lib/ai'
import { callAi } from '../lib/aiClient'
import type { AiKind, Application } from '../lib/types'
import { useTracker } from './TrackerProvider'

/** Why AI cannot run yet: demo mode, no job posting, or no CV. */
export type AiBlocker = 'demo' | 'vacancy' | 'cv' | null

const MIN_TEXT = 50

/**
 * Runs the AI analysis or the cover letter for one application and saves
 * the answer, so the same request is not paid for twice. The panel keeps one
 * instance, so a request keeps running while the user switches tabs.
 */
export function useAiActions(application: Application) {
  const { cv, aiResults, isDemo, saveAiResult } = useTracker()
  const { getAccessToken } = useAuth()
  const [running, setRunning] = useState<AiKind | null>(null)
  const [error, setError] = useState<{ kind: AiKind; message: string } | null>(null)

  const blocker: AiBlocker = isDemo
    ? 'demo'
    : (application.job_description ?? '').trim().length < MIN_TEXT
      ? 'vacancy'
      : (cv?.content ?? '').trim().length < MIN_TEXT
        ? 'cv'
        : null

  async function run(kind: AiKind) {
    if (blocker || running || !cv) return
    setRunning(kind)
    setError(null)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Сессия истекла. Войди в аккаунт ещё раз.')
      const analysis = latestResult(aiResults, application.id, 'analysis')
      const reply = await callAi(
        {
          kind,
          company: application.company,
          role: application.role,
          jobDescription: application.job_description ?? '',
          cvText: cv.content,
          highlights: kind === 'cover_letter' ? analysis?.content.highlights : undefined,
        },
        token,
      )
      await saveAiResult({ application_id: application.id, cv_title: cv.title, ...reply })
    } catch (e) {
      setError({ kind, message: e instanceof Error ? e.message : String(e) })
    } finally {
      setRunning(null)
    }
  }

  return { blocker, running, error, run }
}

export type AiActions = ReturnType<typeof useAiActions>
