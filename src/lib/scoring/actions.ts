'use server'

import { createClient } from '@/lib/supabase/server'
import { computeCompatibility } from './engine'
import { DEFAULT_CONFIG } from './config'
import type { Candidate, CandidateMan } from '@/lib/types'
import type { CompatibilityResult } from './types'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

const WOMAN_FIELDS = `
  id, first_name, last_name, date_of_birth, age_estimate, is_age_estimate,
  city, country, languages, marital_status, has_children, courant, hassidout,
  nousah, community, shabbat_practice, kashrut_level, tsniout,
  children_education, age_min, age_max, preferred_cities,
  accepted_marital_status, expected_languages, status, availability
`

const MAN_FIELDS = `
  id, first_name, last_name, date_of_birth, age_estimate, is_age_estimate,
  city, country, languages, marital_status, has_children, courant, hassidout,
  nousah, community, shabbat_practice, kashrut_level, tsniout,
  children_education, age_min, age_max, preferred_cities, status
`

export interface MatchResult {
  woman: { id: string; first_name: string; last_name: string; city: string | null; age_estimate: number | null; courant: string | null }
  man: { id: string; first_name: string; last_name: string; city: string | null; age_estimate: number | null; courant: string | null }
  score: CompatibilityResult
}

export async function getTopMatches(limit: number = 10): Promise<MatchResult[]> {
  const supabase = await createClient()

  const [womenRes, menRes] = await Promise.all([
    supabase
      .from('candidates')
      .select(WOMAN_FIELDS)
      .eq('organization_id', ORG_ID)
      .eq('status', 'validee')
      .eq('availability', 'disponible'),
    supabase
      .from('candidates_men')
      .select(MAN_FIELDS)
      .eq('organization_id', ORG_ID)
      .eq('status', 'actif'),
  ])

  const women = (womenRes.data ?? []) as Candidate[]
  const men = (menRes.data ?? []) as CandidateMan[]

  if (women.length === 0 || men.length === 0) return []

  const allMatches: MatchResult[] = []

  for (const woman of women) {
    for (const man of men) {
      const score = computeCompatibility(woman, man, DEFAULT_CONFIG)
      if (score.dealBreakers.length === 0 && score.total >= 40) {
        allMatches.push({
          woman: {
            id: woman.id,
            first_name: woman.first_name,
            last_name: woman.last_name,
            city: woman.city,
            age_estimate: woman.age_estimate,
            courant: woman.courant,
          },
          man: {
            id: man.id,
            first_name: man.first_name,
            last_name: man.last_name,
            city: man.city,
            age_estimate: man.age_estimate,
            courant: man.courant,
          },
          score,
        })
      }
    }
  }

  allMatches.sort((a, b) => b.score.total - a.score.total)
  return allMatches.slice(0, limit)
}

export async function computePairScore(
  womanId: string,
  manId: string
): Promise<CompatibilityResult | null> {
  const supabase = await createClient()

  const [womanRes, manRes] = await Promise.all([
    supabase
      .from('candidates')
      .select(WOMAN_FIELDS)
      .eq('id', womanId)
      .eq('organization_id', ORG_ID)
      .single(),
    supabase
      .from('candidates_men')
      .select(MAN_FIELDS)
      .eq('id', manId)
      .eq('organization_id', ORG_ID)
      .single(),
  ])

  if (!womanRes.data || !manRes.data) return null

  return computeCompatibility(
    womanRes.data as Candidate,
    manRes.data as CandidateMan,
    DEFAULT_CONFIG
  )
}
