/// <reference types="vite/client" />

// Variables from .env that Vite passes to browser code. Only names starting
// with VITE_ reach the browser, so secrets must never use that prefix.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
