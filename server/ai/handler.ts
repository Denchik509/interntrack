import {
  AiError,
  aiRequestSchema,
  type AiResponse,
  type Analysis,
  type AnalysisRequest,
  type CoverLetterRequest,
} from './schema'

/**
 * What the handler needs from the outside world. The real function passes
 * Supabase and Claude; tests pass simple fakes, so no network is involved.
 */
export interface AiHandlerDeps {
  /** Returns the user's id for a valid login token, or null. */
  verifyUser(token: string): Promise<string | null>
  analyze(request: AnalysisRequest): Promise<Analysis>
  writeCoverLetter(request: CoverLetterRequest): Promise<string>
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

const error = (status: number, message: string) => json(status, { error: message })

/**
 * POST /api/ai — the only place that talks to Claude.
 * 1. Checks the login token, so strangers cannot spend the API key.
 * 2. Validates the body.
 * 3. Asks Claude and returns the result as JSON.
 */
export function createAiHandler(deps: AiHandlerDeps) {
  return async function handle(request: Request): Promise<Response> {
    if (request.method !== 'POST') return error(405, 'Используй POST.')

    const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]
    if (!token) return error(401, 'Нужно войти в аккаунт.')
    const userId = await deps.verifyUser(token).catch(() => null)
    if (!userId) return error(401, 'Сессия истекла. Войди в аккаунт ещё раз.')

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return error(400, 'Тело запроса должно быть JSON.')
    }
    const parsed = aiRequestSchema.safeParse(body)
    if (!parsed.success) {
      return error(400, 'Нужны текст вакансии и текст CV, хотя бы по 50 символов, и не длиннее 30 000.')
    }

    try {
      const input = parsed.data
      const result: AiResponse =
        input.kind === 'analysis'
          ? { kind: 'analysis', content: await deps.analyze(input) }
          : { kind: 'cover_letter', content: { text: await deps.writeCoverLetter(input) } }
      return json(200, result)
    } catch (e) {
      if (e instanceof AiError) return error(e.status, e.message)
      console.error('AI request failed', e)
      return error(500, 'Неожиданная ошибка на сервере.')
    }
  }
}
