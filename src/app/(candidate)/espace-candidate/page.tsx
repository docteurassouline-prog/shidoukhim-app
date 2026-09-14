'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDate, getStatusLabel } from '@/lib/utils'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Badge from '@/components/ui/Badge'
import { Heart, Calendar, MessageCircle, Star } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types locaux (ce que Supabase renvoie via les jointures)
// ---------------------------------------------------------------------------

interface ManBasicInfo {
  first_name: string
  city: string | null
  age_estimate: number | null
}

interface ProposalRow {
  id: string
  status: string
  created_at: string
  candidates_man: ManBasicInfo | ManBasicInfo[] | null
}

interface MeetingRow {
  id: string
  proposal_id: string
  meeting_number: number
  scheduled_at: string | null
  location: string | null
  status: string
  created_at: string
}

interface PortalFeedbackRow {
  id: string
  meeting_id: string
  created_at: string
}

// ---------------------------------------------------------------------------
// Helper : les jointures Supabase retournent parfois un array
// ---------------------------------------------------------------------------

function unwrapJoin<T>(field: T | T[] | null): T | null {
  if (field == null) return null
  if (Array.isArray(field)) return field[0] ?? null
  return field
}

// ---------------------------------------------------------------------------
// Statuts consideres comme "actifs" pour les propositions
// ---------------------------------------------------------------------------

const ACTIVE_STATUSES = [
  'acceptee',
  'rencontre_a_organiser',
  'rencontre_programmee',
  'rencontres_en_cours',
]

// ---------------------------------------------------------------------------
// Composant page
// ---------------------------------------------------------------------------

export default function EspaceCandidatePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState<string>('')
  const [proposals, setProposals] = useState<ProposalRow[]>([])
  const [meetings, setMeetings] = useState<MeetingRow[]>([])
  const [feedbackIds, setFeedbackIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()

        // 1. Utilisateur connecte
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()
        if (userError || !user) {
          setError('Impossible de verifier votre identite. Veuillez vous reconnecter.')
          return
        }

        // 2. Token portail → candidate_id
        const { data: tokenRow, error: tokenError } = await supabase
          .from('candidate_portal_tokens')
          .select('candidate_id')
          .eq('auth_user_id', user.id)
          .eq('is_active', true)
          .single()

        if (tokenError || !tokenRow) {
          setError('Aucun espace candidat associe a votre compte.')
          return
        }

        const candidateId: string = tokenRow.candidate_id

        // 3. Prenom de la candidate
        const { data: candidateRow } = await supabase
          .from('candidates')
          .select('first_name')
          .eq('id', candidateId)
          .single()

        setFirstName(candidateRow?.first_name ?? '')

        // 4. Propositions (avec infos basiques du candidat homme)
        const { data: proposalRows } = await supabase
          .from('proposals')
          .select(
            'id, status, created_at, candidates_man!proposals_candidate_man_id_fkey(first_name, city, age_estimate)'
          )
          .eq('candidate_woman_id', candidateId)
          .order('created_at', { ascending: false })

        const safeProposals: ProposalRow[] = (proposalRows ?? []) as ProposalRow[]
        setProposals(safeProposals)

        // 5. Rencontres liees a ces propositions
        const proposalIds = safeProposals.map((p) => p.id)
        let safeMeetings: MeetingRow[] = []

        if (proposalIds.length > 0) {
          const { data: meetingRows } = await supabase
            .from('meetings')
            .select('id, proposal_id, meeting_number, scheduled_at, location, status, created_at')
            .in('proposal_id', proposalIds)
            .order('scheduled_at', { ascending: false })

          safeMeetings = (meetingRows ?? []) as MeetingRow[]
          setMeetings(safeMeetings)
        }

        // 6. Feedbacks portail existants
        if (safeMeetings.length > 0) {
          const meetingIds = safeMeetings.map((m) => m.id)
          const { data: feedbackRows } = await supabase
            .from('candidate_portal_feedback')
            .select('id, meeting_id, created_at')
            .in('meeting_id', meetingIds)

          const ids = new Set((feedbackRows ?? []).map((f: PortalFeedbackRow) => f.meeting_id))
          setFeedbackIds(ids)
        }
      } catch {
        setError('Une erreur inattendue est survenue.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // -----------------------------------------------------------------------
  // Chargement
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <LoadingSpinner text="Chargement de votre espace..." size="lg" />
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // Erreur
  // -----------------------------------------------------------------------

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-[#E8E0D4] p-8 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#C45B5B]/10 mb-4">
            <Heart className="w-7 h-7 text-[#C45B5B]" />
          </div>
          <p className="text-[#2D2D2D] font-medium mb-2">{error}</p>
          <Link
            href="/candidate-login"
            className="text-sm text-[#6B3A5B] hover:text-[#5A2E4D] underline underline-offset-2"
          >
            Retour a la connexion
          </Link>
        </div>
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // Donnees derivees
  // -----------------------------------------------------------------------

  const activeProposals = proposals.filter((p) => ACTIVE_STATUSES.includes(p.status))
  const completedMeetings = meetings.filter((m) => m.status === 'effectuee')
  const meetingsPendingFeedback = completedMeetings.filter((m) => !feedbackIds.has(m.id))

  // -----------------------------------------------------------------------
  // Rendu
  // -----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#FFFBF0]">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* ── Accueil ─────────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#6B3A5B]/10">
              <Heart className="w-5 h-5 text-[#6B3A5B]" fill="#6B3A5B" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] tracking-tight">
              Bonjour {firstName}
            </h1>
          </div>
          <p className="text-[#6B7280] text-sm ml-14">
            Bienvenue dans votre espace personnel. Vous y trouverez vos propositions de rencontres et les retours a donner.
          </p>
        </section>

        {/* ── Statistiques ────────────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard
            icon={<Heart className="w-5 h-5 text-[#6B3A5B]" />}
            value={proposals.length}
            label="Propositions"
            bgIcon="bg-[#6B3A5B]/10"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5 text-[#87A878]" />}
            value={meetings.length}
            label="Rencontres"
            bgIcon="bg-[#87A878]/15"
          />
          <StatCard
            icon={<MessageCircle className="w-5 h-5 text-[#C5A55A]" />}
            value={meetingsPendingFeedback.length}
            label="Avis a donner"
            bgIcon="bg-[#C5A55A]/15"
          />
        </section>

        {/* ── Propositions actives ─────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-[#6B3A5B] mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-[#C5A55A]" />
            Propositions en cours
          </h2>

          {activeProposals.length === 0 ? (
            <EmptyCard message="Aucune proposition active pour le moment. Nous travaillons a trouver la personne qui vous correspond." />
          ) : (
            <div className="space-y-3">
              {activeProposals.map((proposal) => {
                const man = unwrapJoin(proposal.candidates_man)
                return (
                  <div
                    key={proposal.id}
                    className="bg-white rounded-xl border border-[#E8E0D4] p-4 sm:p-5 flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[#2D2D2D] truncate">
                        {man?.first_name ?? 'Candidat'}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        {[
                          man?.city,
                          man?.age_estimate ? `~${man.age_estimate} ans` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'Informations non renseignees'}
                      </p>
                    </div>
                    <Badge variant={proposal.status as never} dot>
                      {getStatusLabel(proposal.status)}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Rencontres recentes ──────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-[#6B3A5B] mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#87A878]" />
            Rencontres recentes
          </h2>

          {meetings.length === 0 ? (
            <EmptyCard message="Aucune rencontre enregistree. Des qu'une rencontre sera programmee, elle apparaitra ici." />
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting) => {
                const hasFeedback = feedbackIds.has(meeting.id)
                const needsFeedback = meeting.status === 'effectuee' && !hasFeedback

                return (
                  <div
                    key={meeting.id}
                    className="bg-white rounded-xl border border-[#E8E0D4] p-4 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-[#2D2D2D]">
                          Rencontre n&deg;{meeting.meeting_number}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[#6B7280]">
                          {meeting.scheduled_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(meeting.scheduled_at)}
                            </span>
                          )}
                          {meeting.location && (
                            <span className="truncate max-w-[200px]">{meeting.location}</span>
                          )}
                        </div>
                      </div>

                      <Badge variant={meeting.status as never} dot>
                        {getStatusLabel(meeting.status)}
                      </Badge>
                    </div>

                    {/* Bouton feedback */}
                    {needsFeedback && (
                      <div className="mt-3 pt-3 border-t border-[#E8E0D4]">
                        <Link
                          href={`/espace-candidate/rencontres/${meeting.id}/feedback`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#87A878] hover:bg-[#769968] transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Donner mon avis
                        </Link>
                      </div>
                    )}

                    {meeting.status === 'effectuee' && hasFeedback && (
                      <div className="mt-3 pt-3 border-t border-[#E8E0D4]">
                        <span className="inline-flex items-center gap-1.5 text-sm text-[#87A878] font-medium">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Avis donne
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  value,
  label,
  bgIcon,
}: {
  icon: React.ReactNode
  value: number
  label: string
  bgIcon: string
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E0D4] p-4 flex items-center gap-4">
      <div
        className={`shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full ${bgIcon}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#2D2D2D] leading-none">{value}</p>
        <p className="text-xs text-[#6B7280] mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-[#E8E0D4] p-6 text-center">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#C5A55A]/10 mb-3">
        <Heart className="w-5 h-5 text-[#C5A55A]" />
      </div>
      <p className="text-sm text-[#6B7280] leading-relaxed max-w-sm mx-auto">{message}</p>
    </div>
  )
}
