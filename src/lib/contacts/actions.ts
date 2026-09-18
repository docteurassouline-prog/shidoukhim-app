'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Contact, ContactCreateInput, ContactUpdateInput } from '@/lib/types'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

export async function getContacts(): Promise<Contact[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('organization_id', ORG_ID)
    .order('last_name', { ascending: true })

  if (error) {
    console.error('Erreur chargement contacts:', error)
    return []
  }

  return (data ?? []) as Contact[]
}

export async function createContact(
  input: ContactCreateInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase.from('contacts').insert({
    organization_id: ORG_ID,
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    role: input.role || null,
    relationship_to: input.relationship_to?.trim() || null,
    notes: input.notes?.trim() || null,
    is_reference: input.is_reference,
  })

  if (error) {
    console.error('Erreur creation contact:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function updateContact(
  id: string,
  input: ContactUpdateInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('contacts')
    .update({
      first_name: input.first_name?.trim(),
      last_name: input.last_name?.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      role: input.role || null,
      relationship_to: input.relationship_to?.trim() || null,
      notes: input.notes?.trim() || null,
      is_reference: input.is_reference,
    })
    .eq('id', id)
    .eq('organization_id', ORG_ID)

  if (error) {
    console.error('Erreur mise a jour contact:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteContact(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)
    .eq('organization_id', ORG_ID)

  if (error) {
    console.error('Erreur suppression contact:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export interface RelatedCandidate {
  id: string
  reference_name: string
  candidate_type: 'woman' | 'man'
  relationship: string | null
  candidate_id: string
  candidate_first_name: string | null
  candidate_last_name: string | null
}

export async function getContactRelatedCandidates(
  contactId: string
): Promise<RelatedCandidate[]> {
  const supabase = createAdminClient()

  const { data: refs } = await supabase
    .from('candidate_references')
    .select('id, candidate_id, candidate_man_id, role, relationship_context')
    .eq('contact_id', contactId)

  if (!refs || refs.length === 0) {
    return []
  }

  const results: RelatedCandidate[] = []

  for (const ref of refs) {
    let candidateFirstName: string | null = null
    let candidateLastName: string | null = null
    const candidateType: 'woman' | 'man' = ref.candidate_man_id ? 'man' : 'woman'
    const candidateId: string = ref.candidate_man_id ?? ref.candidate_id

    if (candidateType === 'woman') {
      const { data: cand } = await supabase
        .from('candidates')
        .select('first_name, last_name')
        .eq('id', candidateId)
        .single()
      if (cand) {
        candidateFirstName = cand.first_name
        candidateLastName = cand.last_name
      }
    } else {
      const { data: cand } = await supabase
        .from('candidates_men')
        .select('first_name, last_name')
        .eq('id', candidateId)
        .single()
      if (cand) {
        candidateFirstName = cand.first_name
        candidateLastName = cand.last_name
      }
    }

    results.push({
      id: ref.id,
      reference_name: ref.role ?? 'Reference',
      candidate_type: candidateType,
      relationship: ref.relationship_context,
      candidate_id: candidateId,
      candidate_first_name: candidateFirstName,
      candidate_last_name: candidateLastName,
    })
  }

  return results
}
