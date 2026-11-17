import { z } from 'zod'

// What the browser may send to /api/ai. Limits keep one request cheap:
// a job posting and a CV are a few thousand words at most.
export const aiRequestSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('analysis'),
    company: z.string().trim().min(1).max(200),
    role: z.string().trim().min(1).max(200),
    jobDescription: z.string().trim().min(50).max(30_000),
    cvText: z.string().trim().min(50).max(30_000),
  }),
  z.object({
    kind: z.literal('cover_letter'),
    company: z.string().trim().min(1).max(200),
    role: z.string().trim().min(1).max(200),
    jobDescription: z.string().trim().min(50).max(30_000),
    cvText: z.string().trim().min(50).max(30_000),
    /** Points from an earlier analysis to build the letter around. */
    highlights: z.array(z.string().max(300)).max(10).optional(),
  }),
])

export type AiRequest = z.infer<typeof aiRequestSchema>
export type AnalysisRequest = Extract<AiRequest, { kind: 'analysis' }>
export type CoverLetterRequest = Extract<AiRequest, { kind: 'cover_letter' }>

// The exact JSON shape Claude must answer with (structured output).
export const analysisSchema = z.object({
  matches: z.array(z.string()),
  gaps: z.array(z.string()),
  highlights: z.array(z.string()),
})

export type Analysis = z.infer<typeof analysisSchema>

export type AiResponse =
  | { kind: 'analysis'; content: Analysis }
  | { kind: 'cover_letter'; content: { text: string } }

/** An error with a message for the user and the HTTP status to answer with. */
export class AiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
