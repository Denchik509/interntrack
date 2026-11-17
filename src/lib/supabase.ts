import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * The Supabase client, or null when .env has no Supabase settings.
 * Without Supabase the app still works in demo mode.
 *
 * The anon key is public by design: it only identifies the project.
 * What a request may read is decided by Row Level Security in the database.
 */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null
