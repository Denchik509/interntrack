import type { AnalysisContent, AiKind } from './types'

export interface AiRequestBody {
  kind: AiKind
  company: string
  role: string
  jobDescription: string
  cvText: string
  highlights?: string[]
}

export type AiReply =
  | { kind: 'analysis'; content: AnalysisContent }
  | { kind: 'cover_letter'; content: { text: string } }

function messageForStatus(status: number): string {
  if (status === 404) {
    return 'AI-функция не найдена. Локально она работает только через `netlify dev`, а не `npm run dev`.'
  }
  if (status === 502 || status === 504) return 'Сервер не дождался ответа AI. Попробуй ещё раз.'
  return `Ошибка сервера (код ${status}). Попробуй ещё раз.`
}

/**
 * Sends the job posting and CV to our server function /api/ai.
 * The browser never sees the Claude API key: it only sends the user's
 * login token, and the function checks it before calling Claude.
 */
export async function callAi(body: AiRequestBody, accessToken: string): Promise<AiReply> {
  let response: Response
  try {
    response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Нет связи с сервером. Проверь интернет и попробуй ещё раз.')
  }

  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = (data as { error?: unknown } | null)?.error
    throw new Error(typeof message === 'string' ? message : messageForStatus(response.status))
  }
  if (!data || typeof data !== 'object' || (data as AiReply).kind !== body.kind) {
    throw new Error('Сервер вернул неожиданный ответ.')
  }
  return data as AiReply
}
