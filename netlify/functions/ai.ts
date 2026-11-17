import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createClaude, DEFAULT_MODEL, type Claude } from '../../server/ai/claude'
import { createAiHandler } from '../../server/ai/handler'

// Netlify runs this file as a serverless function at /api/ai.
// Secrets come from the environment variables set in the Netlify dashboard
// (Site configuration -> Environment variables), never from the code.

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
const apiKey = process.env.ANTHROPIC_API_KEY

function build(supabase: SupabaseClient, claude: Claude) {
  return createAiHandler({
    async verifyUser(token) {
      // Supabase checks the token's signature and expiry and returns its user.
      const { data, error } = await supabase.auth.getUser(token)
      return error ? null : (data.user?.id ?? null)
    },
    analyze: (request) => claude.analyze(request),
    writeCoverLetter: (request) => claude.writeCoverLetter(request),
  })
}

const handle =
  supabaseUrl && supabaseAnonKey && apiKey
    ? build(
        createClient(supabaseUrl, supabaseAnonKey),
        createClaude({ apiKey, model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL }),
      )
    : null

export default async (request: Request): Promise<Response> => {
  if (!handle) {
    return Response.json(
      { error: 'AI не настроен на сервере: в Netlify нужны ANTHROPIC_API_KEY и настройки Supabase.' },
      { status: 503 },
    )
  }
  return handle(request)
}

export const config = { path: '/api/ai' }
