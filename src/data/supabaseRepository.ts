import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type { AiResult, Application, ApplicationEvent, CvVersion } from '../lib/types'
import type { Repository } from './repository'

/** Supabase returns { data, error }; this turns an error into an exception. */
function unwrap<T>(result: { data: T | null; error: PostgrestError | null }): T {
  if (result.error) throw new Error(result.error.message)
  if (result.data === null) throw new Error('Supabase returned no data')
  return result.data
}

/**
 * Data stored in Supabase. Every query runs as the signed-in user, and Row
 * Level Security in the database returns only that user's rows, so the code
 * never filters by user_id itself.
 */
export function createSupabaseRepository(client: SupabaseClient): Repository {
  return {
    async loadAll() {
      const [applications, events, aiResults, cv] = await Promise.all([
        client.from('applications').select('*').order('created_at', { ascending: false }),
        client.from('application_events').select('*').order('happened_at'),
        client.from('ai_results').select('*').order('created_at'),
        client.from('cv_versions').select('*').eq('is_default', true).maybeSingle(),
      ])
      if (cv.error) throw new Error(cv.error.message)
      return {
        applications: unwrap(applications) as Application[],
        events: unwrap(events) as ApplicationEvent[],
        aiResults: unwrap(aiResults) as AiResult[],
        cv: (cv.data as CvVersion | null) ?? null,
      }
    },

    async createApplication(input) {
      return unwrap(await client.from('applications').insert(input).select().single()) as Application
    },

    async updateApplication(id, patch) {
      return unwrap(
        await client.from('applications').update(patch).eq('id', id).select().single(),
      ) as Application
    },

    async deleteApplication(id) {
      const { error } = await client.from('applications').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },

    async listEvents(applicationId) {
      return unwrap(
        await client
          .from('application_events')
          .select('*')
          .eq('application_id', applicationId)
          .order('happened_at'),
      ) as ApplicationEvent[]
    },

    async addNote(applicationId, note) {
      return unwrap(
        await client
          .from('application_events')
          .insert({ application_id: applicationId, type: 'note', note })
          .select()
          .single(),
      ) as ApplicationEvent
    },

    async saveCv(content, existing) {
      const query = existing
        ? client.from('cv_versions').update({ content }).eq('id', existing.id)
        : client.from('cv_versions').insert({ content, title: 'Основное', is_default: true })
      return unwrap(await query.select().single()) as CvVersion
    },

    async saveAiResult(result) {
      const { application_id, kind, content, cv_title } = result
      return unwrap(
        await client.from('ai_results').insert({ application_id, kind, content, cv_title }).select().single(),
      ) as AiResult
    },

    async updateCoverLetter(id, text) {
      return unwrap(
        await client
          .from('ai_results')
          .update({ content: { text } })
          .eq('id', id)
          .select()
          .single(),
      ) as AiResult
    },
  }
}
