'use server'

import { createAdminClient } from '@/lib/supabase/admin'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

export async function getProposals(options: {
  status?: string
  page?: number
  perPage?: number
}) {
  const supabase = createAdminClient()
  const { status, page = 1, perPage = 20 } = options

  let query = supabase
    .from('proposals')
    .select(
      `
      id,
      status,
      proposed_at:created_at,
      matchmaker_notes:notes,
      woman_response:agreement_f,
      man_response:agreement_m,
      next_action,
      next_action_date,
      created_at,
      updated_at,
      candidate_woman:candidates!proposals_candidate_woman_id_fkey(id, first_name, last_name, city, age_estimate),
      candidate_man:candidates_men!proposals_candidate_man_id_fkey(id, first_name, last_name, city, age_estimate),
      creator:user_profiles!proposals_created_by_fkey(full_name)
    `,
      { count: 'exact' }
    )
    .eq('organization_id', ORG_ID)

  if (status) {
    query = query.eq('status', status)
  }

  query = query.order('updated_at', { ascending: false })

  const from = (page - 1) * perPage
  query = query.range(from, from + perPage - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Erreur chargement propositions:', error)
    return { data: [], count: 0 }
  }

  return { data: data ?? [], count: count ?? 0 }
}

export async function getProposalById(id: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .eq('organization_id', ORG_ID)
    .single()

  if (error || !data) return null
  return data as Record<string, unknown>
}

export async function getProposalWoman(candidateId: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', candidateId)
    .single()
  return data as Record<string, unknown> | null
}

export async function getProposalMan(candidateId: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('candidates_men')
    .select('*')
    .eq('id', candidateId)
    .single()
  return data as Record<string, unknown> | null
}

export async function getWomanPhotos(candidateId: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('candidate_photos')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('order_index', { ascending: true })
  return (data ?? []) as Record<string, unknown>[]
}

export async function getProposalMeetings(proposalId: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('meetings')
    .select('*')
    .eq('proposal_id', proposalId)
    .order('meeting_number', { ascending: true })
  return (data ?? []) as Record<string, unknown>[]
}

export async function getMeetingFeedback(meetingIds: string[]) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('meeting_feedback')
    .select('*')
    .in('meeting_id', meetingIds)
  return (data ?? []) as Record<string, unknown>[]
}

export async function updateProposalStatus(
  id: string,
  updates: Record<string, unknown>
) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('proposals')
    .update(updates)
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateProposalResponse(
  id: string,
  side: 'woman' | 'man',
  response: string,
  notes: string | null
) {
  const supabase = createAdminClient()
  const updates: Record<string, unknown> = {}
  if (side === 'woman') {
    updates.woman_response = response
    updates.woman_response_at = new Date().toISOString()
    updates.woman_notes = notes
  } else {
    updates.man_response = response
    updates.man_response_at = new Date().toISOString()
    updates.man_notes = notes
  }
  const { error } = await supabase
    .from('proposals')
    .update(updates)
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function createMeeting(data: {
  proposal_id: string
  meeting_number: number
  scheduled_at: string | null
  location: string | null
  location_type: string | null
}) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('meetings').insert({
    ...data,
    status: 'planifiee',
    duration_minutes: null,
    notes: null,
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function createMeetingFeedback(data: {
  meeting_id: string
  from_side: string
  sentiment: string
  wants_next_meeting: boolean
  feedback_text: string | null
  private_notes: string | null
}) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('meeting_feedback').insert({
    ...data,
    collected_at: new Date().toISOString(),
    collected_by: null,
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateProposalNextAction(
  id: string,
  nextAction: string | null,
  nextActionDate: string | null
) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('proposals')
    .update({
      next_action: nextAction,
      next_action_date: nextActionDate,
    })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getCandidatesForProposal() {
  const supabase = createAdminClient()

  const selectFields = `
    id, first_name, last_name, date_of_birth, age_estimate, is_age_estimate,
    city, status, availability, courant, community, profession,
    shabbat_practice, kashrut_level, age_min, age_max, preferred_cities
  `

  const [womenRes, menRes] = await Promise.all([
    supabase
      .from('candidates')
      .select(selectFields)
      .eq('organization_id', ORG_ID)
      .in('status', ['validee', 'a_valider'])
      .order('last_name', { ascending: true }),
    supabase
      .from('candidates_men')
      .select(selectFields)
      .eq('organization_id', ORG_ID)
      .in('status', ['actif', 'en_rencontre'])
      .order('last_name', { ascending: true }),
  ])

  return {
    women: (womenRes.data ?? []) as Record<string, unknown>[],
    men: (menRes.data ?? []) as Record<string, unknown>[],
  }
}

export async function checkProposalConflicts(womanId: string, manId: string) {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('proposals')
    .select('id, status, candidate_woman_id, candidate_man_id')
    .eq('organization_id', ORG_ID)
    .not('status', 'in', '("refusee","interrompue","aboutie")')
    .or(`candidate_woman_id.eq.${womanId},candidate_man_id.eq.${manId}`)

  return (data ?? []) as Record<string, unknown>[]
}

export async function createProposal(data: {
  candidate_woman_id: string
  candidate_man_id: string
  matchmaker_notes: string | null
}) {
  const supabase = createAdminClient()

  const { data: result, error } = await supabase
    .from('proposals')
    .insert({
      organization_id: ORG_ID,
      candidate_woman_id: data.candidate_woman_id,
      candidate_man_id: data.candidate_man_id,
      status: 'envisagee',
      matchmaker_notes: data.matchmaker_notes,
      priority: 0,
      tags: [],
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message, id: null }
  return { success: true, id: result?.id as string }
}

export async function createCandidateWoman(
  payload: Record<string, unknown>
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('candidates')
    .insert({ ...payload, organization_id: ORG_ID })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, id: data?.id as string }
}

export async function assignCandidateToUser(
  candidateId: string,
  candidateType: 'woman' | 'man',
  authUserId: string
) {
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('auth_user_id', authUserId)
    .eq('organization_id', ORG_ID)
    .single()

  if (profile) {
    await supabase.from('candidate_assignments').insert({
      candidate_id: candidateId,
      candidate_type: candidateType,
      user_id: profile.id,
      is_primary: true,
    })
  }
}

export async function createCandidateMan(
  payload: Record<string, unknown>
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('candidates_men')
    .insert({ ...payload, organization_id: ORG_ID })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, id: data?.id as string }
}
