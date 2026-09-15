'use server'

import { createAdminClient } from '@/lib/supabase/admin'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

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
