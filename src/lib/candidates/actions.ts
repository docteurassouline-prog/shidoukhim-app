'use server'

import { createAdminClient } from '@/lib/supabase/admin'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

export interface CandidatesFilter {
  search?: string
  status?: string
  availability?: string
  city?: string
  courant?: string
  community?: string
  marital_status?: string
  gender?: 'F' | 'H'
  sortField?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  perPage?: number
}

export interface CandidatesResult {
  candidates: Record<string, unknown>[]
  totalCount: number
}

export async function getCandidates(filter: CandidatesFilter): Promise<CandidatesResult> {
  const supabase = createAdminClient()

  const perPage = filter.perPage ?? 20
  const page = filter.page ?? 1

  let query = supabase
    .from('candidates')
    .select('*', { count: 'exact' })
    .eq('organization_id', ORG_ID)

  if (filter.search) {
    query = query.or(
      `first_name.ilike.%${filter.search}%,last_name.ilike.%${filter.search}%`
    )
  }
  if (filter.status) {
    query = query.eq('status', filter.status)
  }
  if (filter.availability) {
    query = query.eq('availability', filter.availability)
  }
  if (filter.city) {
    query = query.ilike('city', `%${filter.city}%`)
  }
  if (filter.courant) {
    query = query.eq('courant', filter.courant)
  }
  if (filter.community) {
    query = query.eq('community', filter.community)
  }
  if (filter.marital_status) {
    query = query.eq('marital_status', filter.marital_status)
  }

  const sortField = filter.sortField ?? 'updated_at'
  const sortOrder = filter.sortOrder ?? 'desc'
  query = query.order(sortField, { ascending: sortOrder === 'asc' })

  const from = (page - 1) * perPage
  query = query.range(from, from + perPage - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Erreur chargement candidates:', error)
    return { candidates: [], totalCount: 0 }
  }

  return {
    candidates: (data ?? []) as Record<string, unknown>[],
    totalCount: count ?? 0,
  }
}

export async function getAllCandidates(filter: CandidatesFilter): Promise<CandidatesResult> {
  const supabase = createAdminClient()

  const womenOnly = filter.gender === 'F'
  const menOnly = filter.gender === 'H'

  function applyCommonFilters<T extends { or: Function; eq: Function; ilike: Function }>(q: T, f: CandidatesFilter): T {
    if (f.search) {
      q = q.or(`first_name.ilike.%${f.search}%,last_name.ilike.%${f.search}%`) as T
    }
    if (f.city) {
      q = q.ilike('city', `%${f.city}%`) as T
    }
    if (f.courant) {
      q = q.eq('courant', f.courant) as T
    }
    if (f.community) {
      q = q.eq('community', f.community) as T
    }
    if (f.marital_status) {
      q = q.eq('marital_status', f.marital_status) as T
    }
    return q
  }

  let womenData: Record<string, unknown>[] = []
  let menData: Record<string, unknown>[] = []

  if (!menOnly) {
    let wq = supabase.from('candidates').select('*').eq('organization_id', ORG_ID)
    wq = applyCommonFilters(wq, filter)
    if (filter.status) wq = wq.eq('status', filter.status)
    if (filter.availability) wq = wq.eq('availability', filter.availability)
    const { data } = await wq.order('last_name', { ascending: true })
    womenData = ((data ?? []) as Record<string, unknown>[]).map(r => ({ ...r, _gender: 'F' }))
  }

  if (!womenOnly) {
    let mq = supabase.from('candidates_men').select('*').eq('organization_id', ORG_ID)
    mq = applyCommonFilters(mq, filter)
    if (filter.status) mq = mq.eq('status', filter.status)
    const { data } = await mq.order('last_name', { ascending: true })
    menData = ((data ?? []) as Record<string, unknown>[]).map(r => ({ ...r, _gender: 'H' }))
  }

  let all = [...womenData, ...menData]

  const sortField = filter.sortField ?? 'last_name'
  const asc = (filter.sortOrder ?? 'asc') === 'asc'
  all.sort((a, b) => {
    const va = (a[sortField] as string | number | null) ?? ''
    const vb = (b[sortField] as string | number | null) ?? ''
    if (va < vb) return asc ? -1 : 1
    if (va > vb) return asc ? 1 : -1
    return 0
  })

  const totalCount = all.length
  const perPage = filter.perPage ?? 30
  const page = filter.page ?? 1
  const from = (page - 1) * perPage
  const candidates = all.slice(from, from + perPage)

  return { candidates, totalCount }
}

export async function deleteCandidate(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  // Supprimer les enregistrements liés avant la candidate
  await supabase.from('proposals').delete().eq('candidate_woman_id', id).eq('organization_id', ORG_ID)
  await supabase.from('candidate_assignments').delete().eq('candidate_id', id)
  await supabase.from('candidate_references').delete().eq('candidate_id', id).eq('candidate_type', 'woman')
  await supabase.from('candidate_photos').delete().eq('candidate_id', id)
  await supabase.from('audit_log').delete().eq('entity_id', id).eq('organization_id', ORG_ID)

  const { error } = await supabase
    .from('candidates')
    .delete()
    .eq('id', id)
    .eq('organization_id', ORG_ID)

  if (error) {
    console.error('Erreur suppression candidate:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getMatchmakers(): Promise<{ id: string; full_name: string }[]> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .eq('organization_id', ORG_ID)
    .eq('is_active', true)
    .in('role', ['admin', 'chadkhanit'])
    .order('full_name')

  return (data ?? []) as { id: string; full_name: string }[]
}
