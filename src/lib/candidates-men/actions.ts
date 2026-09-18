'use server'

import { createAdminClient } from '@/lib/supabase/admin'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

export async function deleteCandidateMan(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  await supabase.from('proposals').delete().eq('candidate_man_id', id).eq('organization_id', ORG_ID)
  await supabase.from('candidate_references').delete().eq('candidate_id', id).eq('candidate_type', 'man')
  await supabase.from('audit_log').delete().eq('entity_id', id).eq('organization_id', ORG_ID)

  const { error } = await supabase
    .from('candidates_men')
    .delete()
    .eq('id', id)
    .eq('organization_id', ORG_ID)

  if (error) {
    console.error('Erreur suppression candidat homme:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getManCandidate(id: string): Promise<Record<string, unknown> | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('candidates_men')
    .select('*')
    .eq('id', id)
    .eq('organization_id', ORG_ID)
    .single()

  if (error || !data) return null
  return data as Record<string, unknown>
}

export async function getManProposals(id: string): Promise<Record<string, unknown>[]> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('proposals')
    .select(`
      *,
      candidate_woman:candidates!candidate_woman_id(id, first_name, last_name, age_estimate, city, status),
      candidate_man:candidates_men!candidate_man_id(id, first_name, last_name, age_estimate, city, status)
    `)
    .eq('candidate_man_id', id)
    .eq('organization_id', ORG_ID)
    .order('updated_at', { ascending: false })

  return (data ?? []) as Record<string, unknown>[]
}

export async function updateManCandidate(
  id: string,
  updates: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  const { id: _id, organization_id: _org, created_by: _cb, created_at: _ca, updated_at: _ua, ...cleanUpdates } = updates

  const { error } = await supabase
    .from('candidates_men')
    .update(cleanUpdates)
    .eq('id', id)
    .eq('organization_id', ORG_ID)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateManStatus(
  id: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('candidates_men')
    .update({ status })
    .eq('id', id)
    .eq('organization_id', ORG_ID)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getMenCandidates(): Promise<Record<string, unknown>[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('candidates_men')
    .select('*')
    .eq('organization_id', ORG_ID)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Erreur chargement fiches hommes:', error)
    return []
  }

  return (data ?? []) as Record<string, unknown>[]
}
