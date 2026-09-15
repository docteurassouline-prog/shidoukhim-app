'use server'

import { createAdminClient } from '@/lib/supabase/admin'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

export interface CandidatesFilter {
  search?: string
  status?: string
  availability?: string
  city?: string
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
