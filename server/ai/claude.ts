import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import {
  ANALYSIS_SYSTEM_PROMPT,
  analysisUserMessage,
  COVER_LETTER_SYSTEM_PROMPT,
  coverLetterUserMessage,
} from './prompts'
import { AiError, analysisSchema, type Analysis, type AnalysisRequest, type CoverLetterRequest } from './schema'

export const DEFAULT_MODEL = 'claude-opus-5-5'

// Models that accept server-side fallbacks: if a safety check declines the
// request, the API retries it on a suitable model inside the same call.
const MODELS_WITH_FALLBACKS = new Set([
  'claude-opus-5-5',
  'claude-opus-5',
  'claude-sonnet-5-5',
  'claude-fable-5-2',
  'claude-fable-5-1',
])

interface ClaudeOptions {
  apiKey: string
  /** ANTHROPIC_MODEL in the environment, or the default above. */
  model?: string
  /** Tests pass a fake fetch to see the request without calling the API. */
  fetch?: typeof fetch
}

/** Turns SDK errors into messages a user can act on. */
function toAiError(error: unknown): AiError {
  if (error instanceof AiError) return error
  if (error instanceof Anthropic.AuthenticationError) {
    return new AiError(500, 'Сервер не может войти в Claude API: проверь ANTHROPIC_API_KEY в настройках Netlify.')
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new AiError(429, 'Слишком много запросов к AI. Подожди минуту и попробуй снова.')
  }
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return new AiError(504, 'AI отвечал слишком долго. Попробуй ещё раз.')
  }
  if (error instanceof Anthropic.APIError) {
    return new AiError(502, `Claude API вернул ошибку ${error.status ?? ''}. Попробуй ещё раз позже.`.trim())
  }
  return new AiError(500, 'Неожиданная ошибка на сервере.')
}

function checkStop(stopReason: string | null): void {
  if (stopReason === 'refusal') {
    throw new AiError(422, 'AI отказался обрабатывать этот текст. Проверь текст вакансии и CV.')
  }
  if (stopReason === 'max_tokens') {
    throw new AiError(502, 'Ответ AI оборвался на середине. Попробуй ещё раз.')
  }
}

export function createClaude({ apiKey, model = DEFAULT_MODEL, fetch }: ClaudeOptions) {
  // One attempt with a 25 s limit: a serverless function cannot wait long.
  const client = new Anthropic({ apiKey, timeout: 25_000, maxRetries: 0, fetch })
  const fallback = MODELS_WITH_FALLBACKS.has(model)
    ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }
    : {}

  return {
    async analyze(request: AnalysisRequest): Promise<Analysis> {
      try {
        const response = await client.beta.messages.parse({
          model,
          max_tokens: 8000,
          ...fallback,
          // Low effort: a quick comparison does not need long reasoning,
          // and a fast answer fits the function's time limit.
          output_config: { effort: 'low', format: betaZodOutputFormat(analysisSchema) },
          system: ANALYSIS_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: analysisUserMessage(request) }],
        })
        checkStop(response.stop_reason)
        const parsed = response.parsed_output
        if (!parsed) throw new AiError(502, 'AI вернул ответ в неожиданном виде. Попробуй ещё раз.')
        const trim = (items: string[]) => items.map((i) => i.trim()).filter(Boolean).slice(0, 6)
        return { matches: trim(parsed.matches), gaps: trim(parsed.gaps), highlights: trim(parsed.highlights) }
      } catch (error) {
        throw toAiError(error)
      }
    },

    async writeCoverLetter(request: CoverLetterRequest): Promise<string> {
      try {
        const response = await client.beta.messages.create({
          model,
          max_tokens: 8000,
          ...fallback,
          output_config: { effort: 'low' },
          system: COVER_LETTER_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: coverLetterUserMessage(request) }],
        })
        checkStop(response.stop_reason)
        const text = response.content
          .flatMap((block) => (block.type === 'text' ? [block.text] : []))
          .join('')
          .trim()
        if (!text) throw new AiError(502, 'AI вернул пустой ответ. Попробуй ещё раз.')
        return text
      } catch (error) {
        throw toAiError(error)
      }
    },
  }
}

export type Claude = ReturnType<typeof createClaude>
