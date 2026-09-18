'use client'

import { useEffect, useState, useCallback } from 'react'
import { formatDate, getStatusLabel } from '@/lib/utils'
import type {
  TaskPriority,
} from '@/lib/types'
import type {
  TaskWithCandidate,
  StaleCandidateRow,
  ProposalWithNames,
  CandidateListItem,
} from '@/lib/agenda/actions'
import {
  getTodayTasks,
  getWeekTasks,
  getStaleCandidates,
  getDanglingProposals,
  getCandidateLists,
  completeTask as completeTaskAction,
  createTask,
  createRelanceTask,
  createActionTask,
} from '@/lib/agenda/actions'
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
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message
  }
  return 'Erreur de chargement'
}

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
    urgente: 'bg-danger-light text-danger-deep border-danger/25',
    haute: 'bg-gold-light text-gold-deep border-gold/30',
    normale: 'bg-gold-light text-gold-deep border-gold/30',
    basse: 'bg-stone-100 text-stone-500 border-stone-200',
  }
  return map[p] ?? 'bg-stone-100 text-stone-500 border-stone-200'
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
  return getStatusLabel(s)
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AgendaPage() {
  const today = toISODate(new Date())

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
  const [allWomen, setAllWomen] = useState<CandidateListItem[]>([])
  const [allMen, setAllMen] = useState<CandidateListItem[]>([])

  // New task form state
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('normale')
  const [newDueDate, setNewDueDate] = useState(today)
  const [newCandidateType, setNewCandidateType] = useState<'woman' | 'man' | ''>('')
  const [newCandidateId, setNewCandidateId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // -----------------------------------------------------------------------
  // Fetchers
  // -----------------------------------------------------------------------
  const fetchTodayTasks = useCallback(async () => {
    setTodayLoading(true)
    setTodayError(null)
    try {
      const data = await getTodayTasks()
      setTodayTasks(data)
    } catch (err: unknown) {
      setTodayError(errorMessage(err))
    } finally {
      setTodayLoading(false)
    }
  }, [])

  const fetchWeekTasks = useCallback(async () => {
    setWeekLoading(true)
    setWeekError(null)
    try {
      const data = await getWeekTasks()
      setWeekTasks(data)
    } catch (err: unknown) {
      setWeekError(errorMessage(err))
    } finally {
      setWeekLoading(false)
    }
  }, [])

  const fetchStaleCandidates = useCallback(async () => {
    setStaleLoading(true)
    setStaleError(null)
    try {
      const data = await getStaleCandidates()
      setStaleCandidates(data)
    } catch (err: unknown) {
      setStaleError(errorMessage(err))
    } finally {
      setStaleLoading(false)
    }
  }, [])

  const fetchDanglingProposals = useCallback(async () => {
    setProposalsLoading(true)
    setProposalsError(null)
    try {
      const data = await getDanglingProposals()
      setDanglingProposals(data)
    } catch (err: unknown) {
      setProposalsError(errorMessage(err))
    } finally {
      setProposalsLoading(false)
    }
  }, [])

  const fetchCandidateLists = useCallback(async () => {
    try {
      const { women, men } = await getCandidateLists()
      setAllWomen(women)
      setAllMen(men)
    } catch {
      // silently ignore – modal will show empty lists
    }
  }, [])

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
  async function handleCompleteTask(taskId: string) {
    setCompletingId(taskId)
    try {
      const result = await completeTaskAction(taskId)
      if (result.success) {
        // Remove from local state
        setTodayTasks((prev) => prev.filter((t) => t.id !== taskId))
        setWeekTasks((prev) => prev.filter((t) => t.id !== taskId))
      }
    } catch {
      // silently ignore – the task stays in the list
    } finally {
      setCompletingId(null)
    }
  }

  async function relancerCandidate(candidate: StaleCandidateRow) {
    const result = await createRelanceTask(
      candidate.id,
      candidate.type,
      candidate.first_name,
      candidate.last_name,
      candidate.updated_at
    )

    if (result.success) {
      // Remove from stale list
      setStaleCandidates((prev) => prev.filter((c) => c.id !== candidate.id))
      // Refresh today tasks
      fetchTodayTasks()
    }
  }

  async function definirAction(proposal: ProposalWithNames) {
    const result = await createActionTask(
      proposal.id,
      proposal.candidate_woman_id,
      proposal.woman_name,
      proposal.man_name,
      proposal.status
    )

    if (result.success) {
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

    try {
      const result = await createTask({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        priority: newPriority,
        due_date: newDueDate || null,
        related_candidate_type: newCandidateType === '' ? null : newCandidateType,
        related_candidate_id: newCandidateId || null,
      })

      if (!result.success) throw new Error(result.error ?? 'Erreur lors de la creation')

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
          'bg-surface rounded-lg border p-4 transition-shadow hover:shadow-card',
          overdue ? 'border-danger/25 ring-1 ring-red-200' : 'border-line',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="text-sm font-semibold text-ink truncate">
                {task.title}
              </h4>
              <Badge variant="default" className={priorityColor(task.priority)}>
                <span className="flex items-center gap-1">
                  {priorityIcon(task.priority)}
                  {priorityLabel(task.priority)}
                </span>
              </Badge>
              {overdue && (
                <Badge variant="default" className="bg-danger-light text-danger-deep border-danger/25">
                  En retard
                </Badge>
              )}
            </div>

            {task.description && (
              <p className="text-xs text-ink-soft mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {task.due_date && (
                <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
                  <Clock className="h-3 w-3" />
                  {formatDate(task.due_date)}
                </span>
              )}
              {task.candidateName && (
                <span className="inline-flex items-center gap-1 text-xs text-plum">
                  <Target className="h-3 w-3" />
                  {task.candidateName}
                </span>
              )}
              {task.tags.length > 0 &&
                task.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="default"
                    className="bg-gold/10 text-gold-deep border-gold/20 text-[10px]"
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
            onClick={() => handleCompleteTask(task.id)}
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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[30px] font-semibold text-ink">Agenda</h1>
          <p className="text-sm text-ink-soft mt-1">
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ============================================================ */}
        {/* SECTION 1 – Mes actions du jour                              */}
        {/* ============================================================ */}
        <section className="rounded-[14px] border border-line bg-surface shadow-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <CalendarCheck className="h-5 w-5 text-sage" />
            <h2 className="font-display text-[22px] font-semibold text-ink">
              Mes actions du jour
            </h2>
            {!todayLoading && (
              <Badge variant="default" className="bg-sage/15 text-sage-deep border-sage/30">
                {todayTasks.length}
              </Badge>
            )}
          </div>

          {todayLoading ? (
            <LoadingSpinner text="Chargement des taches..." size="sm" />
          ) : todayError ? (
            <div className="bg-danger-light border border-danger/25 rounded-lg p-4 text-sm text-danger-deep">
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
        <section className="rounded-[14px] border border-line bg-surface shadow-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <CalendarClock className="h-5 w-5 text-gold" />
            <h2 className="font-display text-[22px] font-semibold text-ink">
              A venir cette semaine
            </h2>
            {!weekLoading && (
              <Badge variant="default" className="bg-gold/15 text-gold-deep border-gold/30">
                {weekTasks.length}
              </Badge>
            )}
          </div>

          {weekLoading ? (
            <LoadingSpinner text="Chargement..." size="sm" />
          ) : weekError ? (
            <div className="bg-danger-light border border-danger/25 rounded-lg p-4 text-sm text-danger-deep">
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
        <section className="rounded-[14px] border border-line bg-surface shadow-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <UserX className="h-5 w-5 text-plum" />
            <h2 className="font-display text-[22px] font-semibold text-ink">
              Fiches sans nouvelles
            </h2>
            {!staleLoading && (
              <Badge variant="default" className="bg-plum/10 text-plum border-plum/20">
                {staleCandidates.length}
              </Badge>
            )}
          </div>
          <p className="text-xs text-ink-soft -mt-2 mb-3">
            Candidat(e)s actifs sans mise a jour depuis plus de 30 jours
          </p>

          {staleLoading ? (
            <LoadingSpinner text="Chargement..." size="sm" />
          ) : staleError ? (
            <div className="bg-danger-light border border-danger/25 rounded-lg p-4 text-sm text-danger-deep">
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
                  className="bg-surface rounded-lg border border-line p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink truncate">
                        {c.first_name} {c.last_name}
                      </span>
                      <Badge
                        variant="default"
                        className={
                          c.type === 'woman'
                            ? 'bg-plum-light text-plum border-plum/20'
                            : 'bg-plum-light text-plum border-plum/20'
                        }
                      >
                        {c.type === 'woman' ? 'F' : 'H'}
                      </Badge>
                    </div>
                    <p className="text-xs text-ink-soft mt-0.5">
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
        <section className="rounded-[14px] border border-line bg-surface shadow-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <LinkIcon className="h-5 w-5 text-danger" />
            <h2 className="font-display text-[22px] font-semibold text-ink">
              Propositions sans prochaine action
            </h2>
            {!proposalsLoading && (
              <Badge variant="default" className="bg-danger/10 text-danger border-danger/20">
                {danglingProposals.length}
              </Badge>
            )}
          </div>
          <p className="text-xs text-ink-soft -mt-2 mb-3">
            Propositions actives sans date de prochaine action definie
          </p>

          {proposalsLoading ? (
            <LoadingSpinner text="Chargement..." size="sm" />
          ) : proposalsError ? (
            <div className="bg-danger-light border border-danger/25 rounded-lg p-4 text-sm text-danger-deep">
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
                  className="bg-surface rounded-lg border border-line p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-ink">
                        {p.woman_name}
                      </span>
                      <ArrowUpCircle className="h-3.5 w-3.5 text-gold rotate-90" />
                      <span className="text-sm font-medium text-ink">
                        {p.man_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="default" className="bg-plum/10 text-plum border-plum/20">
                        {proposalStatusLabel(p.status)}
                      </Badge>
                      <span className="text-xs text-ink-soft">
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
            <div className="bg-danger-light border border-danger/25 rounded-lg p-3 text-sm text-danger-deep">
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
