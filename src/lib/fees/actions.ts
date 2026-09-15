'use server'

import { createAdminClient } from '@/lib/supabase/admin'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

export interface FeeRow {
  id: string
  organization_id: string
  proposal_id: string
  fee_type: 'rencontre_homme' | 'rencontre_femme' | 'shadkhaniot_homme' | 'shadkhaniot_femme'
  amount: number
  status: 'en_attente' | 'paye' | 'en_retard'
  due_date: string | null
  paid_date: string | null
  meeting_number: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ProposalWithFees {
  proposal_id: string
  woman_name: string
  man_name: string
  proposal_status: string
  meetings_count: number
  total_due: number
  total_paid: number
  total_pending: number
  fees: FeeRow[]
}

export interface FeesSummary {
  total_due: number
  total_paid: number
  total_pending: number
  proposals_count: number
  proposals: ProposalWithFees[]
}

export async function getFeesSummary(): Promise<FeesSummary> {
  const supabase = createAdminClient()

  const { data: fees } = await supabase
    .from('shadkhaniot_fees')
    .select('*')
    .eq('organization_id', ORG_ID)
    .order('created_at', { ascending: false })

  const allFees = (fees ?? []) as FeeRow[]

  const proposalIds = [...new Set(allFees.map((f) => f.proposal_id))]

  const { data: proposals } = await supabase
    .from('proposals')
    .select(`
      id,
      status,
      candidate_woman:candidates!proposals_candidate_woman_id_fkey(first_name, last_name),
      candidate_man:candidates_men!proposals_candidate_man_id_fkey(first_name, last_name)
    `)
    .eq('organization_id', ORG_ID)
    .in('id', proposalIds.length > 0 ? proposalIds : ['00000000-0000-0000-0000-000000000000'])

  const proposalMap = new Map<string, { status: string; woman_name: string; man_name: string }>()
  for (const p of (proposals ?? []) as Record<string, unknown>[]) {
    const wRaw = p.candidate_woman
    const mRaw = p.candidate_man
    const w = (Array.isArray(wRaw) ? wRaw[0] : wRaw) as { first_name: string; last_name: string } | null
    const m = (Array.isArray(mRaw) ? mRaw[0] : mRaw) as { first_name: string; last_name: string } | null
    proposalMap.set(p.id as string, {
      status: p.status as string,
      woman_name: w ? `${w.first_name} ${w.last_name}` : 'Inconnue',
      man_name: m ? `${m.first_name} ${m.last_name}` : 'Inconnu',
    })
  }

  const grouped = new Map<string, FeeRow[]>()
  for (const fee of allFees) {
    const existing = grouped.get(fee.proposal_id) ?? []
    existing.push(fee)
    grouped.set(fee.proposal_id, existing)
  }

  let totalDue = 0
  let totalPaid = 0
  let totalPending = 0

  const proposalsWithFees: ProposalWithFees[] = []

  for (const [proposalId, proposalFees] of grouped) {
    const info = proposalMap.get(proposalId)
    let due = 0
    let paid = 0
    let pending = 0
    let maxMeeting = 0

    for (const f of proposalFees) {
      const amount = Number(f.amount)
      due += amount
      if (f.status === 'paye') paid += amount
      else pending += amount
      if (f.meeting_number && f.meeting_number > maxMeeting) maxMeeting = f.meeting_number
    }

    totalDue += due
    totalPaid += paid
    totalPending += pending

    proposalsWithFees.push({
      proposal_id: proposalId,
      woman_name: info?.woman_name ?? 'Inconnue',
      man_name: info?.man_name ?? 'Inconnu',
      proposal_status: info?.status ?? 'inconnue',
      meetings_count: maxMeeting,
      total_due: due,
      total_paid: paid,
      total_pending: pending,
      fees: proposalFees,
    })
  }

  return {
    total_due: totalDue,
    total_paid: totalPaid,
    total_pending: totalPending,
    proposals_count: proposalsWithFees.length,
    proposals: proposalsWithFees,
  }
}

export async function getProposalsForFees(): Promise<
  { id: string; woman_name: string; man_name: string; status: string }[]
> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('proposals')
    .select(`
      id,
      status,
      candidate_woman:candidates!proposals_candidate_woman_id_fkey(first_name, last_name),
      candidate_man:candidates_men!proposals_candidate_man_id_fkey(first_name, last_name)
    `)
    .eq('organization_id', ORG_ID)
    .not('status', 'in', '("refusee","interrompue")')
    .order('created_at', { ascending: false })

  return ((data ?? []) as Record<string, unknown>[]).map((p) => {
    const wRaw = p.candidate_woman
    const mRaw = p.candidate_man
    const w = (Array.isArray(wRaw) ? wRaw[0] : wRaw) as { first_name: string; last_name: string } | null
    const m = (Array.isArray(mRaw) ? mRaw[0] : mRaw) as { first_name: string; last_name: string } | null
    return {
      id: p.id as string,
      woman_name: w ? `${w.first_name} ${w.last_name}` : 'Inconnue',
      man_name: m ? `${m.first_name} ${m.last_name}` : 'Inconnu',
      status: p.status as string,
    }
  })
}

export async function addMeetingFees(proposalId: string, meetingNumber: number): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase.from('shadkhaniot_fees').insert([
    {
      organization_id: ORG_ID,
      proposal_id: proposalId,
      fee_type: 'rencontre_femme',
      amount: 10,
      status: 'en_attente',
      due_date: today,
      meeting_number: meetingNumber,
    },
    {
      organization_id: ORG_ID,
      proposal_id: proposalId,
      fee_type: 'rencontre_homme',
      amount: 10,
      status: 'en_attente',
      due_date: today,
      meeting_number: meetingNumber,
    },
  ])

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function addShadkhaniotFees(proposalId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase.from('shadkhaniot_fees').insert([
    {
      organization_id: ORG_ID,
      proposal_id: proposalId,
      fee_type: 'shadkhaniot_femme',
      amount: 600,
      status: 'en_attente',
      due_date: today,
    },
    {
      organization_id: ORG_ID,
      proposal_id: proposalId,
      fee_type: 'shadkhaniot_homme',
      amount: 600,
      status: 'en_attente',
      due_date: today,
    },
  ])

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function markFeePaid(feeId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('shadkhaniot_fees')
    .update({ status: 'paye', paid_date: today, updated_at: new Date().toISOString() })
    .eq('id', feeId)
    .eq('organization_id', ORG_ID)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function markFeeOverdue(feeId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('shadkhaniot_fees')
    .update({ status: 'en_retard', updated_at: new Date().toISOString() })
    .eq('id', feeId)
    .eq('organization_id', ORG_ID)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteFee(feeId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('shadkhaniot_fees')
    .delete()
    .eq('id', feeId)
    .eq('organization_id', ORG_ID)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
