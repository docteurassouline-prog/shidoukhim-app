'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Task, TaskCreateInput, TaskStatus, TaskPriority } from '@/lib/types'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

// ---------------------------------------------------------------------------
// Types returned to the client
// ---------------------------------------------------------------------------

export interface TaskWithCandidate extends Task {
  candidateName?: string
}

export interface StaleCandidateRow {
  id: string
  first_name: string
  last_name: string
  status: string
  updated_at: string
  type: 'woman' | 'man'
}

export interface ProposalWithNames {
  id: string
  organization_id: string
  created_by: string | null
  candidate_woman_id: string
  candidate_man_id: string
  status: string
  proposed_at: string | null
  woman_response: string | null
  woman_response_at: string | null
  man_response: string | null
  man_response_at: string | null
  woman_notes: string | null
  man_notes: string | null
  matchmaker_notes: string | null
  decline_reason: string | null
  priority: number
  next_action: string | null
  next_action_date: string | null
  tags: string[]
  created_at: string
  updated_at: string
  woman_name: string
  man_name: string
}

export interface CandidateListItem {
  id: string
  first_name: string
  last_name: string
}

// ---------------------------------------------------------------------------
// Helpers (server-side only)
// ---------------------------------------------------------------------------

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

async function enrichTasks(tasks: Task[]): Promise<TaskWithCandidate[]> {
  if (tasks.length === 0) return []

  const supabase = createAdminClient()

  const womanIds = tasks
    .filter((t) => t.related_candidate_type === 'woman' && t.related_candidate_id)
    .map((t) => t.related_candidate_id!)
  const manIds = tasks
    .filter((t) => t.related_candidate_type === 'man' && t.related_candidate_id)
    .map((t) => t.related_candidate_id!)

  const nameMap = new Map<string, string>()

  if (womanIds.length > 0) {
    const { data } = await supabase
      .from('candidates')
      .select('id, first_name, last_name')
      .in('id', womanIds)
    data?.forEach((c) => nameMap.set(c.id, `${c.first_name} ${c.last_name}`))
  }
  if (manIds.length > 0) {
    const { data } = await supabase
      .from('candidates_men')
      .select('id, first_name, last_name')
      .in('id', manIds)
    data?.forEach((c) => nameMap.set(c.id, `${c.first_name} ${c.last_name}`))
  }

  return tasks.map((t) => ({
    ...t,
    candidateName: t.related_candidate_id
      ? nameMap.get(t.related_candidate_id)
      : undefined,
  }))
}

// ---------------------------------------------------------------------------
// Server actions
// ---------------------------------------------------------------------------

export async function getTodayTasks(): Promise<TaskWithCandidate[]> {
  const supabase = createAdminClient()
  const today = toISODate(new Date())

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', ORG_ID)
    .in('status', ['a_faire', 'en_cours'])
    .lte('due_date', today)
    .order('priority', { ascending: false })
    .order('due_date', { ascending: true })

  if (error) throw new Error(error.message)
  return enrichTasks(data ?? [])
}

export async function getWeekTasks(): Promise<TaskWithCandidate[]> {
  const supabase = createAdminClient()
  const tomorrow = toISODate(new Date(Date.now() + 86_400_000))
  const in7Days = toISODate(new Date(Date.now() + 7 * 86_400_000))

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', ORG_ID)
    .in('status', ['a_faire', 'en_cours'])
    .gte('due_date', tomorrow)
    .lte('due_date', in7Days)
    .order('due_date', { ascending: true })
    .order('priority', { ascending: false })

  if (error) throw new Error(error.message)
  return enrichTasks(data ?? [])
}

export async function getStaleCandidates(): Promise<StaleCandidateRow[]> {
  const supabase = createAdminClient()
  const thirtyDaysAgo = toISODate(new Date(Date.now() - 30 * 86_400_000))

  const [womenRes, menRes] = await Promise.all([
    supabase
      .from('candidates')
      .select('id, first_name, last_name, status, updated_at')
      .eq('organization_id', ORG_ID)
      .eq('status', 'validee')
      .lt('updated_at', thirtyDaysAgo)
      .order('updated_at', { ascending: true })
      .limit(50),
    supabase
      .from('candidates_men')
      .select('id, first_name, last_name, status, updated_at')
      .eq('organization_id', ORG_ID)
      .in('status', ['actif', 'en_rencontre'])
      .lt('updated_at', thirtyDaysAgo)
      .order('updated_at', { ascending: true })
      .limit(50),
  ])

  if (womenRes.error) throw new Error(womenRes.error.message)
  if (menRes.error) throw new Error(menRes.error.message)

  const combined: StaleCandidateRow[] = [
    ...(womenRes.data ?? []).map((c) => ({ ...c, type: 'woman' as const })),
    ...(menRes.data ?? []).map((c) => ({ ...c, type: 'man' as const })),
  ].sort(
    (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
  )

  return combined
}

export async function getDanglingProposals(): Promise<ProposalWithNames[]> {
  const supabase = createAdminClient()
  const excludedStatuses = ['refusee', 'interrompue', 'aboutie']

  const { data, error } = await supabase
    .from('proposals')
    .select(
      '*, candidate_woman:candidates!proposals_candidate_woman_id_fkey(id, first_name, last_name), candidate_man:candidates_men!proposals_candidate_man_id_fkey(id, first_name, last_name)'
    )
    .eq('organization_id', ORG_ID)
    .not('status', 'in', `(${excludedStatuses.join(',')})`)
    .is('next_action_date', null)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)

  return (data ?? []).map((p: Record<string, unknown>) => {
    const woman = p.candidate_woman as { first_name: string; last_name: string } | null
    const man = p.candidate_man as { first_name: string; last_name: string } | null
    const { candidate_woman: _cw, candidate_man: _cm, ...rest } = p
    return {
      ...(rest as unknown as Omit<ProposalWithNames, 'woman_name' | 'man_name'>),
      woman_name: woman ? `${woman.first_name} ${woman.last_name}` : 'Inconnue',
      man_name: man ? `${man.first_name} ${man.last_name}` : 'Inconnu',
    }
  })
}

export async function getCandidateLists(): Promise<{
  women: CandidateListItem[]
  men: CandidateListItem[]
}> {
  const supabase = createAdminClient()

  const [w, m] = await Promise.all([
    supabase
      .from('candidates')
      .select('id, first_name, last_name')
      .eq('organization_id', ORG_ID)
      .eq('status', 'active')
      .order('last_name', { ascending: true })
      .limit(500),
    supabase
      .from('candidates_men')
      .select('id, first_name, last_name')
      .eq('organization_id', ORG_ID)
      .eq('status', 'active')
      .order('last_name', { ascending: true })
      .limit(500),
  ])

  return {
    women: (w.data ?? []) as CandidateListItem[],
    men: (m.data ?? []) as CandidateListItem[],
  }
}

export async function completeTask(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('tasks')
    .update({
      status: 'terminee' as TaskStatus,
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('organization_id', ORG_ID)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function createTask(input: {
  title: string
  description: string | null
  priority: TaskPriority
  due_date: string | null
  related_candidate_type: 'woman' | 'man' | null
  related_candidate_id: string | null
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  const taskInput: TaskCreateInput = {
    title: input.title,
    description: input.description,
    status: 'a_faire',
    priority: input.priority,
    due_date: input.due_date,
    related_candidate_type: input.related_candidate_type,
    related_candidate_id: input.related_candidate_id,
    related_proposal_id: null,
    assigned_to: null,
    completed_at: null,
    tags: [],
  }

  const { error } = await supabase
    .from('tasks')
    .insert({ ...taskInput, organization_id: ORG_ID })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function createRelanceTask(
  candidateId: string,
  candidateType: 'woman' | 'man',
  firstName: string,
  lastName: string,
  updatedAt: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const today = toISODate(new Date())

  // Format date for the description
  const dateStr = new Date(updatedAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const taskInput: TaskCreateInput = {
    title: `Relancer ${firstName} ${lastName}`,
    description: `Fiche sans nouvelles depuis le ${dateStr}. Prendre contact pour mise a jour.`,
    status: 'a_faire',
    priority: 'normale',
    due_date: today,
    related_candidate_id: candidateId,
    related_candidate_type: candidateType,
    assigned_to: null,
    completed_at: null,
    related_proposal_id: null,
    tags: ['relance'],
  }

  const { error } = await supabase.from('tasks').insert({
    ...taskInput,
    organization_id: ORG_ID,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function createActionTask(
  proposalId: string,
  womanId: string,
  womanName: string,
  manName: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const today = toISODate(new Date())

  // We need the status label — inline it here to avoid importing client-side utils
  const statusLabels: Record<string, string> = {
    envisagee: 'Envisagee',
    accord_demande: 'Accord demande',
    attente_retour: 'Attente retour',
    acceptee: 'Acceptee',
    rencontre_a_organiser: 'Rencontre a organiser',
    rencontre_programmee: 'Rencontre programmee',
    rencontres_en_cours: 'Rencontres en cours',
    interrompue: 'Interrompue',
    refusee: 'Refusee',
    aboutie: 'Aboutie',
  }

  const taskInput: TaskCreateInput = {
    title: `Definir prochaine action : ${womanName} / ${manName}`,
    description: `Proposition sans prochaine action definie. Statut actuel : ${statusLabels[status] ?? status}.`,
    status: 'a_faire',
    priority: 'haute',
    due_date: today,
    related_proposal_id: proposalId,
    related_candidate_id: womanId,
    related_candidate_type: 'woman',
    assigned_to: null,
    completed_at: null,
    tags: ['suivi-proposition'],
  }

  const { error } = await supabase.from('tasks').insert({
    ...taskInput,
    organization_id: ORG_ID,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}
