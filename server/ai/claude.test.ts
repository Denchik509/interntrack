import { describe, expect, it } from 'vitest'
import { createClaude } from './claude'
import { AiError, type AnalysisRequest } from './schema'

// A fake fetch: records what the SDK sends and answers like the Claude API,
// so these tests check the real request without network or costs.
function fakeApi(reply: { content: unknown[]; stop_reason: string }) {
  const calls: { url: string; headers: Headers; body: Record<string, unknown> }[] = []
  const fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      headers: new Headers(init?.headers),
      body: JSON.parse(String(init?.body)),
    })
    return Response.json({
      id: 'msg_test',
      type: 'message',
      role: 'assistant',
      model: 'claude-opus-5-5',
      stop_sequence: null,
      usage: { input_tokens: 100, output_tokens: 50 },
      ...reply,
    })
  }) as typeof globalThis.fetch
  return { calls, fetch }
}

const request: AnalysisRequest = {
  kind: 'analysis',
  company: 'Northwind Labs',
  role: 'AI Engineer Intern',
  jobDescription: 'Build internal tools in TypeScript and React. PyTorch experience is a plus.',
  cvText: 'Alex Taylor. Full-stack developer: React, TypeScript, Node.js. Projects with LLM APIs.',
}

const analysisJson = JSON.stringify({
  matches: ['React и TypeScript: опыт в студии', ' '],
  gaps: ['PyTorch'],
  highlights: ['Проекты с LLM API'],
})

describe('createClaude', () => {
  it('asks for a structured analysis with low effort and server-side fallbacks', async () => {
    const api = fakeApi({ content: [{ type: 'text', text: analysisJson }], stop_reason: 'end_turn' })
    const claude = createClaude({ apiKey: 'test-key', fetch: api.fetch })

    const result = await claude.analyze(request)

    expect(result).toEqual({
      matches: ['React и TypeScript: опыт в студии'],
      gaps: ['PyTorch'],
      highlights: ['Проекты с LLM API'],
    })
    const [call] = api.calls
    expect(call.url).toContain('/v1/messages')
    expect(call.headers.get('anthropic-beta')).toContain('server-side-fallback-2026-07-01')
    expect(call.body).toMatchObject({
      model: 'claude-opus-5-5',
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema' } },
    })
    // The posting and the CV travel inside tags in the user message.
    const message = (call.body.messages as { content: string }[])[0].content
    expect(message).toContain('<job_posting company="Northwind Labs"')
    expect(message).toContain('<cv>')
  })

  it('leaves out fallbacks for a model that does not support them', async () => {
    const api = fakeApi({ content: [{ type: 'text', text: analysisJson }], stop_reason: 'end_turn' })
    const claude = createClaude({ apiKey: 'test-key', model: 'claude-haiku-5-5', fetch: api.fetch })
    await claude.analyze(request)
    expect(api.calls[0].body.fallbacks).toBeUndefined()
    expect(api.calls[0].headers.get('anthropic-beta') ?? '').not.toContain('server-side-fallback')
  })

  it('returns the cover letter text', async () => {
    const api = fakeApi({ content: [{ type: 'text', text: 'Dear Hiring Team,\n\nI am...' }], stop_reason: 'end_turn' })
    const claude = createClaude({ apiKey: 'test-key', fetch: api.fetch })
    const text = await claude.writeCoverLetter({ ...request, kind: 'cover_letter', highlights: ['LLM projects'] })
    expect(text).toBe('Dear Hiring Team,\n\nI am...')
    const message = (api.calls[0].body.messages as { content: string }[])[0].content
    expect(message).toContain('<points_to_emphasise>')
  })

  it('turns a refusal into a clear error', async () => {
    const api = fakeApi({ content: [], stop_reason: 'refusal' })
    const claude = createClaude({ apiKey: 'test-key', fetch: api.fetch })
    await expect(claude.writeCoverLetter({ ...request, kind: 'cover_letter' })).rejects.toMatchObject({
      status: 422,
    })
    await expect(claude.analyze(request)).rejects.toBeInstanceOf(AiError)
  })
})
