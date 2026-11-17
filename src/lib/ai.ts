import type { AiResult } from './types'

type AnalysisResult = Extract<AiResult, { kind: 'analysis' }>
type LetterResult = Extract<AiResult, { kind: 'cover_letter' }>

/** The newest saved result of one kind for an application. */
export function latestResult(results: AiResult[], applicationId: string, kind: 'analysis'): AnalysisResult | null
export function latestResult(results: AiResult[], applicationId: string, kind: 'cover_letter'): LetterResult | null
export function latestResult(results: AiResult[], applicationId: string, kind: AiResult['kind']): AiResult | null {
  let latest: AiResult | null = null
  for (const result of results) {
    if (result.application_id !== applicationId || result.kind !== kind) continue
    if (!latest || result.created_at > latest.created_at) latest = result
  }
  return latest
}
