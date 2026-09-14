'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getStatusLabel, formatDate, getStatusColor, calculateAge } from '@/lib/utils'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Calendar, MapPin, MessageCircleHeart, ChevronRight, Heart } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types specific to this page                                       */
/* ------------------------------------------------------------------ */

interface OtherCandidateInfo {
  first_name: string
  city: string | null
  date_of_birth: string | null
  age_estimate: number | null
  is_age_estimate: boolean
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

interface FeedbackRow {
  id: string
  meeting_id: string
  overall_impression: string | null
  wants_next_meeting: string | null
  liked_appearance: boolean
  liked_personality: boolean
  liked_conversation: boolean
  liked_values: boolean
  liked_humor: boolean
  liked_ambition: boolean
  liked_other: string | null
  issue_no_chemistry: boolean
  issue_different_values: boolean
  issue_conversation_difficult: boolean
  issue_appearance: boolean
  issue_different_lifestyle: boolean
  issue_other: string | null
}

interface ProposalRow {
  id: string
  status: string
  candidate_man_id: string
  candidate_woman_id: string
}

interface MeetingDisplay {
  meeting: MeetingRow
  otherCandidate: OtherCandidateInfo | null
  otherLabel: string // "Lui" (women viewing men) or "Elle" (men viewing women)
  proposalStatus: string
  feedback: FeedbackRow | null
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function RencontresPage() {
  const [meetings, setMeetings] = useState<MeetingDisplay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // 1. Current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // 2. Get candidate_id + candidate_type from portal token
      const { data: token } = await supabase
        .from('candidate_portal_tokens')
        .select('candidate_id, candidate_type')
        .eq('auth_user_id', user.id)
        .eq('is_active', true)
        .single()

      if (!token) return

      const candidateType: 'woman' | 'man' = token.candidate_type || 'woman'
      const isWoman = candidateType === 'woman'

      // 3. Fetch all proposals where this candidate appears
      const { data: proposals } = await supabase
        .from('proposals')
        .select('id, status, candidate_man_id, candidate_woman_id')
        .eq(isWoman ? 'candidate_woman_id' : 'candidate_man_id', token.candidate_id)

      if (!proposals || proposals.length === 0) {
        setLoading(false)
        return
      }

      const proposalIds = proposals.map((p: ProposalRow) => p.id)

      // 4. Fetch all meetings for those proposals
      const { data: meetingsData } = await supabase
        .from('meetings')
        .select('id, proposal_id, meeting_number, scheduled_at, location, status, created_at')
        .in('proposal_id', proposalIds)
        .order('scheduled_at', { ascending: false, nullsFirst: false })

      if (!meetingsData || meetingsData.length === 0) {
        setLoading(false)
        return
      }

      // 5. Fetch the OTHER candidate's info (man if we're a woman, woman if we're a man)
      const otherIds = [...new Set(
        proposals.map((p: ProposalRow) => isWoman ? p.candidate_man_id : p.candidate_woman_id)
      )]
      const otherTable = isWoman ? 'candidates_men' : 'candidates'
      const { data: othersData } = await supabase
        .from(otherTable)
        .select('id, first_name, city, date_of_birth, age_estimate, is_age_estimate')
        .in('id', otherIds)

      const othersMap = new Map<string, OtherCandidateInfo>()
      if (othersData) {
        for (const c of othersData) {
          othersMap.set(c.id, {
            first_name: c.first_name,
            city: c.city,
            date_of_birth: c.date_of_birth,
            age_estimate: c.age_estimate,
            is_age_estimate: c.is_age_estimate,
          })
        }
      }

      // 6. Fetch existing feedback for these meetings (only this candidate's type)
      const meetingIds = meetingsData.map((m: MeetingRow) => m.id)
      const { data: feedbackData } = await supabase
        .from('candidate_portal_feedback')
        .select('*')
        .in('meeting_id', meetingIds)
        .eq('candidate_type', candidateType)

      const feedbackMap = new Map<string, FeedbackRow>()
      if (feedbackData) {
        for (const fb of feedbackData) {
          feedbackMap.set(fb.meeting_id, fb as FeedbackRow)
        }
      }

      // Build display objects
      const proposalMap = new Map<string, ProposalRow>()
      for (const p of proposals) {
        proposalMap.set(p.id, p as ProposalRow)
      }

      const otherLabel = isWoman ? 'Lui' : 'Elle'

      const display: MeetingDisplay[] = meetingsData.map((mtg: MeetingRow) => {
        const proposal = proposalMap.get(mtg.proposal_id)!
        const otherId = isWoman ? proposal.candidate_man_id : proposal.candidate_woman_id
        return {
          meeting: mtg,
          otherCandidate: othersMap.get(otherId) || null,
          otherLabel,
          proposalStatus: proposal.status,
          feedback: feedbackMap.get(mtg.id) || null,
        }
      })

      setMeetings(display)
      setLoading(false)
    }

    load()
  }, [])

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  /* ---- Empty state ---- */
  if (meetings.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#6B3A5B]/10">
          <Heart className="w-8 h-8 text-[#6B3A5B]" />
        </div>
        <h2 className="text-xl font-semibold text-[#2D2D2D]">
          Aucune rencontre pour le moment
        </h2>
        <p className="text-[#6B7280] text-sm max-w-md mx-auto">
          Votre chadkhanit travaille pour vous ! Vous serez informee des
          que des rencontres seront organisees.
        </p>
      </div>
    )
  }

  /* ---- Meetings list ---- */
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#6B3A5B]">Mes rencontres</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Retrouvez ici l&apos;historique de vos rencontres et partagez votre ressenti.
        </p>
      </div>

      <div className="space-y-4">
        {meetings.map(({ meeting, otherCandidate, otherLabel, proposalStatus, feedback }) => (
          <MeetingCard
            key={meeting.id}
            meeting={meeting}
            otherCandidate={otherCandidate}
            otherLabel={otherLabel}
            proposalStatus={proposalStatus}
            feedback={feedback}
          />
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Meeting card                                                       */
/* ------------------------------------------------------------------ */

function MeetingCard({
  meeting,
  otherCandidate,
  otherLabel,
  proposalStatus,
  feedback,
}: {
  meeting: MeetingRow
  otherCandidate: OtherCandidateInfo | null
  otherLabel: string
  proposalStatus: string
  feedback: FeedbackRow | null
}) {
  const needsFeedback = meeting.status === 'effectuee' && !feedback
  const hasFeedback = !!feedback

  return (
    <div className="bg-white rounded-xl border border-[#E8E0D4] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header strip */}
      <div className="px-5 py-3 bg-gradient-to-r from-[#6B3A5B]/5 to-[#C5A55A]/5 border-b border-[#E8E0D4] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#6B3A5B]">
            Rencontre n&deg;{meeting.meeting_number}
          </span>
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}
          >
            {getStatusLabel(meeting.status)}
          </span>
        </div>
        <span
          className={`inline-block px-2 py-0.5 rounded text-xs ${getStatusColor(proposalStatus)}`}
        >
          {getStatusLabel(proposalStatus)}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 space-y-3">
        {/* Other candidate info */}
        {otherCandidate && (
          <div className="flex items-center gap-2 text-sm text-[#2D2D2D]">
            <div className="w-8 h-8 rounded-full bg-[#87A878]/15 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-[#87A878]">
                {otherCandidate.first_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-[#9CA3AF] text-xs mr-1">{otherLabel} :</span>
              <span className="font-medium">{otherCandidate.first_name}</span>
              {otherCandidate.city && (
                <span className="text-[#6B7280]"> &middot; {otherCandidate.city}</span>
              )}
              <span className="text-[#6B7280]">
                {' '}
                &middot; {calculateAge(otherCandidate.date_of_birth, otherCandidate.age_estimate, otherCandidate.is_age_estimate)}
              </span>
            </div>
          </div>
        )}

        {/* Date & location */}
        <div className="flex flex-wrap gap-4 text-sm text-[#6B7280]">
          {meeting.scheduled_at && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(meeting.scheduled_at)}</span>
            </div>
          )}
          {meeting.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{meeting.location}</span>
            </div>
          )}
        </div>

        {/* Feedback section */}
        {needsFeedback && (
          <Link
            href={`/espace-candidate/rencontres/${meeting.id}/feedback`}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg
                       bg-[#C5A55A] text-white text-sm font-medium
                       hover:bg-[#B8993F] transition-colors shadow-sm"
          >
            <MessageCircleHeart className="h-4 w-4" />
            Donner mon avis
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}

        {hasFeedback && (
          <div className="mt-2 p-4 bg-[#FFFBF0] rounded-lg border border-[#E8E0D4] space-y-2">
            <p className="text-xs font-semibold text-[#6B3A5B] uppercase tracking-wider">
              Mon retour
            </p>

            {/* What she liked */}
            <FeedbackLikedSummary feedback={feedback!} />

            {/* Issues */}
            <FeedbackIssuesSummary feedback={feedback!} />

            {/* Overall impression */}
            {feedback!.overall_impression && (
              <p className="text-sm text-[#2D2D2D] italic">
                &laquo; {feedback!.overall_impression} &raquo;
              </p>
            )}

            {/* Wants next */}
            {feedback!.wants_next_meeting && (
              <p className="text-xs text-[#6B7280]">
                Prochaine rencontre :{' '}
                <span className="font-medium">
                  {feedback!.wants_next_meeting === 'oui'
                    ? 'Oui'
                    : feedback!.wants_next_meeting === 'non'
                      ? 'Non'
                      : 'Je ne sais pas'}
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Feedback summary helpers                                           */
/* ------------------------------------------------------------------ */

function FeedbackLikedSummary({ feedback }: { feedback: FeedbackRow }) {
  const items: string[] = []
  if (feedback.liked_appearance) items.push('Apparence')
  if (feedback.liked_personality) items.push('Personnalite')
  if (feedback.liked_conversation) items.push('Conversation')
  if (feedback.liked_values) items.push('Valeurs')
  if (feedback.liked_humor) items.push('Humour')
  if (feedback.liked_ambition) items.push('Ambition')
  if (feedback.liked_other) items.push(feedback.liked_other)

  if (items.length === 0) return null

  return (
    <div>
      <p className="text-xs text-[#87A878] font-medium mb-1">Ce qui m&apos;a plu :</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="inline-block px-2 py-0.5 rounded-full bg-[#87A878]/15 text-[#4A7A3B] text-xs"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function FeedbackIssuesSummary({ feedback }: { feedback: FeedbackRow }) {
  const items: string[] = []
  if (feedback.issue_no_chemistry) items.push('Pas de feeling')
  if (feedback.issue_different_values) items.push('Valeurs differentes')
  if (feedback.issue_conversation_difficult) items.push('Conversation difficile')
  if (feedback.issue_appearance) items.push('Physiquement pas mon type')
  if (feedback.issue_different_lifestyle) items.push('Mode de vie different')
  if (feedback.issue_other) items.push(feedback.issue_other)

  if (items.length === 0) return null

  return (
    <div>
      <p className="text-xs text-[#C45B5B] font-medium mb-1">Reservations :</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="inline-block px-2 py-0.5 rounded-full bg-red-50 text-[#C45B5B] text-xs"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
