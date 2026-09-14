'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type {
  Task,
  TaskCreateInput,
  TaskStatus,
  TaskPriority,
  Candidate,
  CandidateMan,
  Proposal,
} from '@/lib/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import {
  CalendarCheck,
  CalendarClock,
  UserX,
  LinkIcon,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpCircle,
  ChevronUp,
  Minus,
  ChevronDown,
  PhoneForwarded,
  Target,
  ListTodo,
} from 'lucide-react'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function priorityLabel(p: TaskPriority): string {
  const map: Record<TaskPriority, string> = {
    urgente: 'Urgent',
    haute: 'Haute',
    normale: 'Moyenne',
    basse: 'Basse',
  }
  return map[p] ?? p
}

function priorityColor(p: TaskPriority): string {
  const map: Record<TaskPriority, string> = {
    urgente: 'bg-red-100 text-red-700 border-red-200',
    haute: 'bg-orange-100 text-orange-700 border-orange-200',
    normale: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    basse: 'bg-gray-100 text-gray-500 border-gray-200',
  }
  return map[p] ?? 'bg-gray-100 text-gray-500 border-gray-200'
}

function priorityIcon(p: TaskPriority) {
  switch (p) {
    case 'urgente':
      return <AlertTriangle className="h-3 w-3" />
    case 'haute':
      return <ChevronUp className="h-3 w-3" />
    case 'normale':
      return <Minus className="h-3 w-3" />
    case 'basse':
      return <ChevronDown className="h-3 w-3" />
  }
}

function proposalStatusLabel(s: string): string {
  const map: Record<string, string> = {
    draft: 'Brouillon',
    proposed_woman: 'Propose (elle)',
    proposed_man: 'Propose (lui)',
    proposed_both: 'Propose (les deux)',
    accepted_woman: 'Accepte (elle)',
    accepted_man: 'Accepte (lui)',
    accepted_both: 'Accepte (les deux)',
    meeting_scheduled: 'Rencontre planifiee',
    dating: 'En frequentation',
    engaged: 'Fiances',
    on_hold: 'En pause',
  }
  return map[s] ?? s
}

// ---------------------------------------------------------------------------
// Types for enriched data
// ---------------------------------------------------------------------------

interface TaskWithCandidate extends Task {
  candidateName?: string
}

interface StaleCandidateRow {
  id: string
  first_name: string
  last_name: string
  status: string
  updated_at: string
  type: 'woman' | 'man'
}

interface ProposalWithNames extends Proposal {
  woman_name: string
  man_name: string
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AgendaPage() {
  const supabase = createClient()
  const today = toISODate(new Date())
  const tomorrow = toISODate(new Date(Date.now() + 86_400_000))
  const in7Days = toISODate(new Date(Date.now() + 7 * 86_400_000))
  const thirtyDaysAgo = toISODate(new Date(Date.now() - 30 * 86_400_000))

  // Section 1 – actions du jour
  const [todayTasks, setTodayTasks] = useState<TaskWithCandidate[]>([])
  const [todayLoading, setTodayLoading] = useState(true)
  const [todayError, setTodayError] = useState<string | null>(null)

  // Section 2 – a venir
  const [weekTasks, setWeekTasks] = useState<TaskWithCandidate[]>([])
  const [weekLoading, setWeekLoading] = useState(true)
  const [weekError, setWeekError] = useState<string | null>(null)

  // Section 3 – fiches sans nouvelles
  const [staleCandidates, setStaleCandidates] = useState<StaleCandidateRow[]>([])
  const [staleLoading, setStaleLoading] = useState(true)
  const [staleError, setStaleError] = useState<string | null>(null)

  // Section 4 – propositions sans action
  const [danglingProposals, setDanglingProposals] = useState<ProposalWithNames[]>([])
  const [proposalsLoading, setProposalsLoading] = useState(true)
  const [proposalsError, setProposalsError] = useState<string | null>(null)

  // New task modal
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Completing a task
  const [completingId, setCompletingId] = useState<string | null>(null)

  // Candidate lists for the modal candidate selector
  const [allWomen, setAllWomen] = useState<Pick<Candidate, 'id' | 'first_name' | 'last_name'>[]>([])
  const [allMen, setAllMen] = useState<Pick<CandidateMan, 'id' | 'first_name' | 'last_name'>[]>([])

  // New task form state
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('normale')
  const [newDueDate, setNewDueDate] = useState(today)
  const [newCandidateType, setNewCandidateType] = useState<'woman' | 'man' | ''>('')
  const [newCandidateId, setNewCandidateId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // -----------------------------------------------------------------------
  // Enrichment: resolve candidate names for tasks
  // -----------------------------------------------------------------------
  const enrichTasks = useCallback(
    async (tasks: Task[]): Promise<TaskWithCandidate[]> => {
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
    },
    [supabase]
  )

  // -----------------------------------------------------------------------
  // Fetchers
  // -----------------------------------------------------------------------
  const fetchTodayTasks = useCallback(async () => {
    setTodayLoading(true)
    setTodayError(null)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', ORG_ID)
        .in('status', ['a_faire', 'en_cours'])
        .lte('due_date', today)
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true })

      if (error) throw error
      const enriched = await enrichTasks(data ?? [])
      setTodayTasks(enriched)
    } catch (err: unknown) {
      setTodayError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setTodayLoading(false)
    }
  }, [supabase, today, enrichTasks])

  const fetchWeekTasks = useCallback(async () => {
    setWeekLoading(true)
    setWeekError(null)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', ORG_ID)
        .in('status', ['a_faire', 'en_cours'])
        .gte('due_date', tomorrow)
        .lte('due_date', in7Days)
        .order('due_date', { ascending: true })
        .order('priority', { ascending: false })

      if (error) throw error
      const enriched = await enrichTasks(data ?? [])
      setWeekTasks(enriched)
    } catch (err: unknown) {
      setWeekError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setWeekLoading(false)
    }
  }, [supabase, tomorrow, in7Days, enrichTasks])

  const fetchStaleCandidates = useCallback(async () => {
    setStaleLoading(true)
    setStaleError(null)
    try {
      const [womenRes, menRes] = await Promise.all([
        supabase
          .from('candidates')
          .select('id, first_name, last_name, status, updated_at')
          .eq('organization_id', ORG_ID)
          .eq('status', 'active')
          .lt('updated_at', thirtyDaysAgo)
          .order('updated_at', { ascending: true })
          .limit(50),
        supabase
          .from('candidates_men')
          .select('id, first_name, last_name, status, updated_at')
          .eq('organization_id', ORG_ID)
          .eq('status', 'active')
          .lt('updated_at', thirtyDaysAgo)
          .order('updated_at', { ascending: true })
          .limit(50),
      ])

      if (womenRes.error) throw womenRes.error
      if (menRes.error) throw menRes.error

      const combined: StaleCandidateRow[] = [
        ...(womenRes.data ?? []).map((c) => ({ ...c, type: 'woman' as const })),
        ...(menRes.data ?? []).map((c) => ({ ...c, type: 'man' as const })),
      ].sort(
        (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      )
      setStaleCandidates(combined)
    } catch (err: unknown) {
      setStaleError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setStaleLoading(false)
    }
  }, [supabase, thirtyDaysAgo])

  const fetchDanglingProposals = useCallback(async () => {
    setProposalsLoading(true)
    setProposalsError(null)
    try {
      const excludedStatuses = [
        'cancelled',
        'declined_woman',
        'declined_man',
        'declined_both',
        'married',
      ]
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

      if (error) throw error

      const rows: ProposalWithNames[] = (data ?? []).map((p: Record<string, unknown>) => {
        const woman = p.candidate_woman as { first_name: string; last_name: string } | null
        const man = p.candidate_man as { first_name: string; last_name: string } | null
        return {
          ...(p as unknown as Proposal),
          woman_name: woman ? `${woman.first_name} ${woman.last_name}` : 'Inconnue',
          man_name: man ? `${man.first_name} ${man.last_name}` : 'Inconnu',
        }
      })
      setDanglingProposals(rows)
    } catch (err: unknown) {
      setProposalsError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setProposalsLoading(false)
    }
  }, [supabase])

  // -----------------------------------------------------------------------
  // Load candidate lists for modal
  // -----------------------------------------------------------------------
  const fetchCandidateLists = useCallback(async () => {
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
    setAllWomen(w.data ?? [])
    setAllMen(m.data ?? [])
  }, [supabase])

  // -----------------------------------------------------------------------
  // Initial fetch
  // -----------------------------------------------------------------------
  useEffect(() => {
    fetchTodayTasks()
    fetchWeekTasks()
    fetchStaleCandidates()
    fetchDanglingProposals()
    fetchCandidateLists()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------
  async function completeTask(taskId: string) {
    setCompletingId(taskId)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'terminee' as TaskStatus,
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)

      if (error) throw error

      // Remove from local state
      setTodayTasks((prev) => prev.filter((t) => t.id !== taskId))
      setWeekTasks((prev) => prev.filter((t) => t.id !== taskId))
    } catch {
      // silently ignore – the task stays in the list
    } finally {
      setCompletingId(null)
    }
  }

  async function relancerCandidate(candidate: StaleCandidateRow) {
    // Create a follow-up task
    const taskInput: TaskCreateInput = {
      title: `Relancer ${candidate.first_name} ${candidate.last_name}`,
      description: `Fiche sans nouvelles depuis le ${formatDate(candidate.updated_at)}. Prendre contact pour mise a jour.`,
      status: 'a_faire',
      priority: 'normale',
      due_date: today,
      related_candidate_id: candidate.id,
      related_candidate_type: candidate.type,
      assigned_to: null,
      completed_at: null,
      related_proposal_id: null,
      tags: ['relance'],
    }
    const { error } = await supabase.from('tasks').insert({
      ...taskInput,
      organization_id: ORG_ID,
    })

    if (!error) {
      // Remove from stale list
      setStaleCandidates((prev) => prev.filter((c) => c.id !== candidate.id))
      // Refresh today tasks
      fetchTodayTasks()
    }
  }

  async function definirAction(proposal: ProposalWithNames) {
    // Create a follow-up task linked to the proposal
    const taskInput: TaskCreateInput = {
      title: `Definir prochaine action : ${proposal.woman_name} / ${proposal.man_name}`,
      description: `Proposition sans prochaine action definie. Statut actuel : ${proposalStatusLabel(proposal.status)}.`,
      status: 'a_faire',
      priority: 'haute',
      due_date: today,
      related_proposal_id: proposal.id,
      related_candidate_id: proposal.candidate_woman_id,
      related_candidate_type: 'woman',
      assigned_to: null,
      completed_at: null,
      tags: ['suivi-proposition'],
    }
    const { error } = await supabase.from('tasks').insert({
      ...taskInput,
      organization_id: ORG_ID,
    })

    if (!error) {
      setDanglingProposals((prev) => prev.filter((p) => p.id !== proposal.id))
      fetchTodayTasks()
    }
  }

  // -----------------------------------------------------------------------
  // New task form
  // -----------------------------------------------------------------------
  function resetForm() {
    setNewTitle('')
    setNewDescription('')
    setNewPriority('normale')
    setNewDueDate(today)
    setNewCandidateType('')
    setNewCandidateId('')
    setFormError(null)
  }

  async function handleCreateTask() {
    if (!newTitle.trim()) {
      setFormError('Le titre est obligatoire')
      return
    }

    setSaving(true)
    setFormError(null)

    const input: TaskCreateInput = {
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      status: 'a_faire',
      priority: newPriority,
      due_date: newDueDate || null,
      related_candidate_type: newCandidateType === '' ? null : newCandidateType,
      related_candidate_id: newCandidateId || null,
      related_proposal_id: null,
      assigned_to: null,
      completed_at: null,
      tags: [],
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({ ...input, organization_id: ORG_ID })

      if (error) throw error

      setModalOpen(false)
      resetForm()
      fetchTodayTasks()
      fetchWeekTasks()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la creation')
    } finally {
      setSaving(false)
    }
  }

  // -----------------------------------------------------------------------
  // Candidate options for Select
  // -----------------------------------------------------------------------
  const candidateOptions =
    newCandidateType === 'woman'
      ? allWomen.map((c) => ({
          value: c.id,
          label: `${c.first_name} ${c.last_name}`,
        }))
      : newCandidateType === 'man'
        ? allMen.map((c) => ({
            value: c.id,
            label: `${c.first_name} ${c.last_name}`,
          }))
        : []

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------
  function isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false
    return dueDate < today
  }

  function renderTaskCard(task: TaskWithCandidate, showOverdue: boolean) {
    const overdue = showOverdue && isOverdue(task.due_date)

    return (
      <div
        key={task.id}
        className={[
          'bg-white rounded-lg border p-4 transition-shadow hover:shadow-sm',
          overdue ? 'border-red-300 ring-1 ring-red-200' : 'border-[#E8E0D4]',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="text-sm font-semibold text-[#2D2D2D] truncate">
                {task.title}
              </h4>
              <Badge variant="default" className={priorityColor(task.priority)}>
                <span className="flex items-center gap-1">
                  {priorityIcon(task.priority)}
                  {priorityLabel(task.priority)}
                </span>
              </Badge>
              {overdue && (
                <Badge variant="default" className="bg-red-100 text-red-700 border-red-200">
                  En retard
                </Badge>
              )}
            </div>

            {task.description && (
              <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {task.due_date && (
                <span className="inline-flex items-center gap-1 text-xs text-[#6B7280]">
                  <Clock className="h-3 w-3" />
                  {formatDate(task.due_date)}
                </span>
              )}
              {task.candidateName && (
                <span className="inline-flex items-center gap-1 text-xs text-[#6B3A5B]">
                  <Target className="h-3 w-3" />
                  {task.candidateName}
                </span>
              )}
              {task.tags.length > 0 &&
                task.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="default"
                    className="bg-[#C5A55A]/10 text-[#8B7030] border-[#C5A55A]/20 text-[10px]"
                  >
                    {tag}
                  </Badge>
                ))}
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            loading={completingId === task.id}
            disabled={completingId === task.id}
            icon={<CheckCircle2 className="h-4 w-4" />}
            onClick={() => completeTask(task.id)}
          >
            Terminer
          </Button>
        </div>
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FFFBF0]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D] flex items-center gap-2">
            <ListTodo className="h-7 w-7 text-[#87A878]" />
            Agenda
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Gerez vos taches et suivez vos dossiers en cours
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setModalOpen(true)}
        >
          Nouvelle tache
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* ============================================================ */}
        {/* SECTION 1 – Mes actions du jour                              */}
        {/* ============================================================ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck className="h-5 w-5 text-[#87A878]" />
            <h2 className="text-lg font-semibold text-[#2D2D2D]">
              Mes actions du jour
            </h2>
            {!todayLoading && (
              <Badge variant="default" className="bg-[#87A878]/15 text-[#5A7A4A] border-[#87A878]/30">
                {todayTasks.length}
              </Badge>
            )}
          </div>

          {todayLoading ? (
            <LoadingSpinner text="Chargement des taches..." size="sm" />
          ) : todayError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {todayError}
            </div>
          ) : todayTasks.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-7 w-7" />}
              title="Rien a faire aujourd'hui"
              description="Toutes vos taches sont a jour. Profitez-en pour anticiper la semaine."
            />
          ) : (
            <div className="space-y-3">
              {todayTasks.map((task) => renderTaskCard(task, true))}
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* SECTION 2 – A venir cette semaine                            */}
        {/* ============================================================ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="h-5 w-5 text-[#C5A55A]" />
            <h2 className="text-lg font-semibold text-[#2D2D2D]">
              A venir cette semaine
            </h2>
            {!weekLoading && (
              <Badge variant="default" className="bg-[#C5A55A]/15 text-[#8B7030] border-[#C5A55A]/30">
                {weekTasks.length}
              </Badge>
            )}
          </div>

          {weekLoading ? (
            <LoadingSpinner text="Chargement..." size="sm" />
          ) : weekError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {weekError}
            </div>
          ) : weekTasks.length === 0 ? (
            <EmptyState
              icon={<CalendarClock className="h-7 w-7" />}
              title="Semaine libre"
              description="Aucune tache prevue pour les 7 prochains jours."
            />
          ) : (
            <div className="space-y-3">
              {weekTasks.map((task) => renderTaskCard(task, false))}
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* SECTION 3 – Fiches sans nouvelles                            */}
        {/* ============================================================ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <UserX className="h-5 w-5 text-[#6B3A5B]" />
            <h2 className="text-lg font-semibold text-[#2D2D2D]">
              Fiches sans nouvelles
            </h2>
            {!staleLoading && (
              <Badge variant="default" className="bg-[#6B3A5B]/10 text-[#6B3A5B] border-[#6B3A5B]/20">
                {staleCandidates.length}
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#6B7280] -mt-2 mb-3">
            Candidat(e)s actifs sans mise a jour depuis plus de 30 jours
          </p>

          {staleLoading ? (
            <LoadingSpinner text="Chargement..." size="sm" />
          ) : staleError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {staleError}
            </div>
          ) : staleCandidates.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-7 w-7" />}
              title="Toutes les fiches sont a jour"
              description="Aucun(e) candidat(e) actif sans nouvelles depuis 30 jours."
            />
          ) : (
            <div className="space-y-2">
              {staleCandidates.map((c) => (
                <div
                  key={`${c.type}-${c.id}`}
                  className="bg-white rounded-lg border border-[#E8E0D4] p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#2D2D2D] truncate">
                        {c.first_name} {c.last_name}
                      </span>
                      <Badge
                        variant="default"
                        className={
                          c.type === 'woman'
                            ? 'bg-pink-50 text-pink-600 border-pink-200'
                            : 'bg-blue-50 text-blue-600 border-blue-200'
                        }
                      >
                        {c.type === 'woman' ? 'F' : 'H'}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Derniere mise a jour : {formatDate(c.updated_at)}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<PhoneForwarded className="h-3.5 w-3.5" />}
                    onClick={() => relancerCandidate(c)}
                  >
                    Relancer
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* SECTION 4 – Propositions sans prochaine action               */}
        {/* ============================================================ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon className="h-5 w-5 text-[#C45B5B]" />
            <h2 className="text-lg font-semibold text-[#2D2D2D]">
              Propositions sans prochaine action
            </h2>
            {!proposalsLoading && (
              <Badge variant="default" className="bg-[#C45B5B]/10 text-[#C45B5B] border-[#C45B5B]/20">
                {danglingProposals.length}
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#6B7280] -mt-2 mb-3">
            Propositions actives sans date de prochaine action definie
          </p>

          {proposalsLoading ? (
            <LoadingSpinner text="Chargement..." size="sm" />
          ) : proposalsError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {proposalsError}
            </div>
          ) : danglingProposals.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-7 w-7" />}
              title="Tout est en ordre"
              description="Chaque proposition active a une prochaine action definie."
            />
          ) : (
            <div className="space-y-2">
              {danglingProposals.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-lg border border-[#E8E0D4] p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[#2D2D2D]">
                        {p.woman_name}
                      </span>
                      <ArrowUpCircle className="h-3.5 w-3.5 text-[#C5A55A] rotate-90" />
                      <span className="text-sm font-medium text-[#2D2D2D]">
                        {p.man_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="default" className="bg-[#6B3A5B]/10 text-[#6B3A5B] border-[#6B3A5B]/20">
                        {proposalStatusLabel(p.status)}
                      </Badge>
                      <span className="text-xs text-[#6B7280]">
                        Creee le {formatDate(p.created_at)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="accent"
                    size="sm"
                    icon={<Target className="h-3.5 w-3.5" />}
                    onClick={() => definirAction(p)}
                  >
                    Definir action
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ============================================================== */}
      {/* MODAL — Nouvelle tache                                         */}
      {/* ============================================================== */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          resetForm()
        }}
        title="Nouvelle tache"
        size="lg"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false)
                resetForm()
              }}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              loading={saving}
              onClick={handleCreateTask}
              icon={<Plus className="h-4 w-4" />}
            >
              Creer
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <Input
            label="Titre"
            placeholder="Ex : Appeler Mme Cohen pour retour"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <Input
            label="Description"
            inputType="textarea"
            placeholder="Details supplementaires..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Priorite"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
              options={[
                { value: 'basse', label: 'Basse' },
                { value: 'normale', label: 'Moyenne' },
                { value: 'haute', label: 'Haute' },
                { value: 'urgente', label: 'Urgent' },
              ]}
            />

            <Input
              label="Echeance"
              inputType="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Candidat(e) lie(e)"
              value={newCandidateType}
              onChange={(e) => {
                setNewCandidateType(e.target.value as 'woman' | 'man' | '')
                setNewCandidateId('')
              }}
              placeholder="Aucun lien"
              options={[
                { value: '', label: 'Aucun' },
                { value: 'woman', label: 'Femme' },
                { value: 'man', label: 'Homme' },
              ]}
            />

            {newCandidateType !== '' && (
              <Select
                label={newCandidateType === 'woman' ? 'Choisir la candidate' : 'Choisir le candidat'}
                value={newCandidateId}
                onChange={(e) => setNewCandidateId(e.target.value)}
                placeholder="Selectionner..."
                options={candidateOptions}
              />
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
