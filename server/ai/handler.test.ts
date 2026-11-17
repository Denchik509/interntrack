import { describe, expect, it, vi } from 'vitest'
import { createAiHandler, type AiHandlerDeps } from './handler'
import { AiError } from './schema'

const posting = 'We are looking for an intern who knows TypeScript and React and likes building tools.'
const cv = 'Alex Taylor. Full-stack developer, React and TypeScript, two years at a small studio.'

function setup(overrides: Partial<AiHandlerDeps> = {}) {
  const deps: AiHandlerDeps = {
    verifyUser: vi.fn(async (token: string) => (token === 'good-token' ? 'user-1' : null)),
    analyze: vi.fn(async () => ({ matches: ['TypeScript'], gaps: ['Go'], highlights: ['Studio work'] })),
    writeCoverLetter: vi.fn(async () => 'Dear Hiring Team, ...'),
    ...overrides,
  }
  return { deps, handle: createAiHandler(deps) }
}

function post(body: unknown, token: string | null = 'good-token'): Request {
  return new Request('https://example.com/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

const analysisBody = { kind: 'analysis', company: 'Northwind', role: 'Intern', jobDescription: posting, cvText: cv }

describe('POST /api/ai', () => {
  it('rejects requests without a login token and never calls Claude', async () => {
    const { deps, handle } = setup()
    const response = await handle(post(analysisBody, null))
    expect(response.status).toBe(401)
    expect(deps.analyze).not.toHaveBeenCalled()
  })

  it('rejects an invalid token', async () => {
    const { deps, handle } = setup()
    const response = await handle(post(analysisBody, 'stolen-or-expired'))
    expect(response.status).toBe(401)
    expect(deps.analyze).not.toHaveBeenCalled()
  })

  it('rejects other methods', async () => {
    const { handle } = setup()
    const response = await handle(new Request('https://example.com/api/ai'))
    expect(response.status).toBe(405)
  })

  it('validates the body', async () => {
    const { deps, handle } = setup()
    expect((await handle(post('not json'))).status).toBe(400)
    expect((await handle(post({ ...analysisBody, jobDescription: 'too short' }))).status).toBe(400)
    expect((await handle(post({ ...analysisBody, kind: 'poem' }))).status).toBe(400)
    expect(deps.analyze).not.toHaveBeenCalled()
  })

  it('returns the analysis', async () => {
    const { deps, handle } = setup()
    const response = await handle(post(analysisBody))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      kind: 'analysis',
      content: { matches: ['TypeScript'], gaps: ['Go'], highlights: ['Studio work'] },
    })
    expect(deps.analyze).toHaveBeenCalledWith(expect.objectContaining({ company: 'Northwind', cvText: cv }))
  })

  it('returns a cover letter', async () => {
    const { handle } = setup()
    const response = await handle(post({ ...analysisBody, kind: 'cover_letter', highlights: ['Studio work'] }))
    expect(await response.json()).toEqual({ kind: 'cover_letter', content: { text: 'Dear Hiring Team, ...' } })
  })

  it('passes known AI errors to the user with their status', async () => {
    const { handle } = setup({
      analyze: vi.fn(async () => {
        throw new AiError(429, 'Слишком много запросов к AI.')
      }),
    })
    const response = await handle(post(analysisBody))
    expect(response.status).toBe(429)
    expect(await response.json()).toEqual({ error: 'Слишком много запросов к AI.' })
  })

  it('hides unexpected errors behind a generic message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { handle } = setup({
      analyze: vi.fn(async () => {
        throw new Error('secret internal detail')
      }),
    })
    const response = await handle(post(analysisBody))
    expect(response.status).toBe(500)
    expect(JSON.stringify(await response.json())).not.toContain('secret')
  })
})
