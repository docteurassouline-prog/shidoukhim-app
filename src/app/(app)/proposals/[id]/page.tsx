'use client'

import { use, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type {
  Proposal,
  ProposalStatus,
  Candidate,
  CandidateMan,
  CandidatePhoto,
  Meeting,
  MeetingFeedback,
  MeetingStatus,
  FeedbackSentiment,
} from '@/lib/types'
import {
  calculateAge,
  formatDate,
  formatDateTime,
  getStatusLabel,
  getStatusColor,
  cn,
} from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Heart,
  Users,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Plus,
  Edit3,
  MessageSquare,
  User,
  Briefcase,
  Book,
  Baby,
  Home,
  Target,
  X,
  Save,
  CircleDot,
  Minus,
} from 'lucide-react'
import {
  getCourantLabel,
  getShabbatPracticeLabel,
  getKashrutLevelLabel,
  getCommunityEthnicLabel,
} from '@/lib/constants/orthodox'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

// ============================================================
// Labels
// ============================================================

const proposalStatusOptions: { value: ProposalStatus; label: string }[] = [
  { value: 'envisagee', label: 'Envisagee' },
  { value: 'accord_demande', label: 'Accord demande' },
  { value: 'attente_retour', label: 'Attente retour' },
  { value: 'acceptee', label: 'Acceptee' },
  { value: 'rencontre_a_organiser', label: 'Rencontre a organiser' },
  { value: 'rencontre_programmee', label: 'Rencontre programmee' },
  { value: 'rencontres_en_cours', label: 'Rencontres en cours' },
  { value: 'interrompue', label: 'Interrompue' },
  { value: 'refusee', label: 'Refusee' },
  { value: 'aboutie', label: 'Aboutie' },
]

const meetingStatusOptions: { value: MeetingStatus; label: string }[] = [
  { value: 'a_planifier', label: 'A planifier' },
  { value: 'planifiee', label: 'Planifiee' },
  { value: 'confirmee', label: 'Confirmee' },
  { value: 'effectuee', label: 'Effectuee' },
  { value: 'annulee', label: 'Annulee' },
  { value: 'absent', label: 'Absent' },
]

const locationTypeOptions = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'hotel_lobby', label: 'Hall d\'hotel' },
  { value: 'park', label: 'Parc' },
  { value: 'synagogue', label: 'Synagogue' },
  { value: 'phone', label: 'Telephone' },
  { value: 'video', label: 'Visio' },
  { value: 'other', label: 'Autre' },
]

const sentimentOptions: { value: FeedbackSentiment; label: string }[] = [
  { value: 'positif', label: 'Positif' },
  { value: 'neutre', label: 'Neutre' },
  { value: 'negatif', label: 'Negatif' },
  { value: 'mitige', label: 'Mitige' },
]

const locationTypeLabels: Record<string, string> = {
  restaurant: 'Restaurant',
  hotel_lobby: 'Hall d\'hotel',
  park: 'Parc',
  synagogue: 'Synagogue',
  phone: 'Telephone',
  video: 'Visio',
  other: 'Autre',
}

// ============================================================
// Helper: initials
// ============================================================

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

// ============================================================
// Helper: age as number for comparison
// ============================================================

function getAgeNumber(
  dateOfBirth: string | null,
  ageEstimate: number | null,
  isEstimate: boolean
): number | null {
  if (dateOfBirth && !isEstimate) {
    const diff = Date.now() - new Date(dateOfBirth).getTime()
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
  }
  return ageEstimate
}

// ============================================================
// Compatibility indicators
// ============================================================

type CompatLevel = 'green' | 'orange' | 'gray'

interface CompatItem {
  label: string
  level: CompatLevel
  detail: string
  icon: React.ReactNode
}

function computeCompatibility(
  woman: Candidate,
  man: CandidateMan
): CompatItem[] {
  const items: CompatItem[] = []

  // 1. Age
  const womanAge = getAgeNumber(woman.date_of_birth, woman.age_estimate, woman.is_age_estimate)
  const manAge = getAgeNumber(man.date_of_birth, man.age_estimate, man.is_age_estimate)

  if (womanAge !== null && manAge !== null) {
    const womanInManRange =
      man.age_min !== null && man.age_max !== null
        ? womanAge >= man.age_min && womanAge <= man.age_max
        : null
    const manInWomanRange =
      woman.age_min !== null && woman.age_max !== null
        ? manAge >= woman.age_min && manAge <= woman.age_max
        : null

    if (womanInManRange === null && manInWomanRange === null) {
      items.push({
        label: 'Age',
        level: 'gray',
        detail: `Elle ${womanAge} ans, Lui ${manAge} ans — pas de preference renseignee`,
        icon: <Calendar className="h-4 w-4" />,
      })
    } else if (womanInManRange !== false && manInWomanRange !== false) {
      items.push({
        label: 'Age',
        level: 'green',
        detail: `Elle ${womanAge} ans, Lui ${manAge} ans — compatible`,
        icon: <Calendar className="h-4 w-4" />,
      })
    } else {
      items.push({
        label: 'Age',
        level: 'orange',
        detail: `Elle ${womanAge} ans, Lui ${manAge} ans — hors preference`,
        icon: <Calendar className="h-4 w-4" />,
      })
    }
  } else {
    items.push({
      label: 'Age',
      level: 'gray',
      detail: 'Age non renseigne',
      icon: <Calendar className="h-4 w-4" />,
    })
  }

  // 2. Location
  const wCity = woman.city?.toLowerCase().trim()
  const mCity = man.city?.toLowerCase().trim()
  if (wCity && mCity) {
    if (wCity === mCity) {
      items.push({
        label: 'Localisation',
        level: 'green',
        detail: `Meme ville : ${woman.city}`,
        icon: <MapPin className="h-4 w-4" />,
      })
    } else {
      items.push({
        label: 'Localisation',
        level: 'orange',
        detail: `${woman.city} / ${man.city}`,
        icon: <MapPin className="h-4 w-4" />,
      })
    }
  } else {
    items.push({
      label: 'Localisation',
      level: 'gray',
      detail: 'Ville non renseignee',
      icon: <MapPin className="h-4 w-4" />,
    })
  }

  // 3. Courant religieux
  if (woman.courant && man.courant) {
    if (woman.courant === man.courant) {
      items.push({
        label: 'Courant',
        level: 'green',
        detail: getCourantLabel(woman.courant),
        icon: <Book className="h-4 w-4" />,
      })
    } else {
      items.push({
        label: 'Courant',
        level: 'orange',
        detail: `${getCourantLabel(woman.courant)} / ${getCourantLabel(man.courant)}`,
        icon: <Book className="h-4 w-4" />,
      })
    }
  } else {
    items.push({
      label: 'Courant',
      level: 'gray',
      detail: 'Non renseigné',
      icon: <Book className="h-4 w-4" />,
    })
  }

  // 4. Communauté
  if (woman.community && man.community) {
    if (woman.community === man.community) {
      items.push({
        label: 'Communauté',
        level: 'green',
        detail: getCommunityEthnicLabel(woman.community),
        icon: <Star className="h-4 w-4" />,
      })
    } else {
      items.push({
        label: 'Communauté',
        level: 'orange',
        detail: `${getCommunityEthnicLabel(woman.community)} / ${getCommunityEthnicLabel(man.community)}`,
        icon: <Star className="h-4 w-4" />,
      })
    }
  } else {
    items.push({
      label: 'Communauté',
      level: 'gray',
      detail: 'Non renseigné',
      icon: <Star className="h-4 w-4" />,
    })
  }

  // 5. Enfants
  items.push({
    label: 'Enfants',
    level: 'gray',
    detail: 'Non renseigné',
    icon: <Baby className="h-4 w-4" />,
  })

  return items
}

// ============================================================
// Modal wrapper
// ============================================================

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E0D4]">
          <h2 className="text-lg font-semibold text-[#2D2D2D]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5 text-[#6B7280]" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ============================================================
// Timeline event
// ============================================================

interface TimelineEvent {
  date: string
  label: string
  detail?: string | null
  color: string
}

function buildTimeline(proposal: Proposal): TimelineEvent[] {
  const events: TimelineEvent[] = []

  events.push({
    date: proposal.created_at,
    label: 'Proposition creee',
    detail: null,
    color: 'bg-gray-400',
  })

  if (proposal.proposed_at) {
    events.push({
      date: proposal.proposed_at,
      label: 'Proposition envoyee',
      detail: null,
      color: 'bg-[#C5A55A]',
    })
  }

  if (proposal.woman_response_at) {
    const accepted = proposal.woman_response === 'accepted'
    events.push({
      date: proposal.woman_response_at,
      label: accepted ? 'Elle a accepte' : `Elle a repondu : ${proposal.woman_response || 'inconnu'}`,
      detail: proposal.woman_notes,
      color: accepted ? 'bg-[#87A878]' : 'bg-[#C45B5B]',
    })
  }

  if (proposal.man_response_at) {
    const accepted = proposal.man_response === 'accepted'
    events.push({
      date: proposal.man_response_at,
      label: accepted ? 'Il a accepte' : `Il a repondu : ${proposal.man_response || 'inconnu'}`,
      detail: proposal.man_notes,
      color: accepted ? 'bg-[#87A878]' : 'bg-[#C45B5B]',
    })
  }

  if (proposal.matchmaker_notes) {
    events.push({
      date: proposal.updated_at,
      label: 'Notes du shadkhan',
      detail: proposal.matchmaker_notes,
      color: 'bg-[#6B3A5B]',
    })
  }

  // Sort by date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return events
}

// ============================================================
// Main page component
// ============================================================

export default function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const supabase = createClient()

  // --- State ---
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [woman, setWoman] = useState<Candidate | null>(null)
  const [man, setMan] = useState<CandidateMan | null>(null)
  const [womanPhotos, setWomanPhotos] = useState<CandidatePhoto[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [feedbackMap, setFeedbackMap] = useState<Record<string, MeetingFeedback[]>>({})

  // --- Modals ---
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showResponseModal, setShowResponseModal] = useState<'woman' | 'man' | null>(null)
  const [editingNextAction, setEditingNextAction] = useState(false)

  // --- Form state ---
  const [statusForm, setStatusForm] = useState<ProposalStatus>('envisagee')
  const [meetingForm, setMeetingForm] = useState({
    scheduled_at: '',
    location: '',
    location_type: 'restaurant',
  })
  const [feedbackForm, setFeedbackForm] = useState({
    meeting_id: '',
    from_side: 'woman' as 'woman' | 'man',
    sentiment: 'positif' as FeedbackSentiment,
    wants_next_meeting: false,
    feedback_text: '',
    private_notes: '',
  })
  const [responseForm, setResponseForm] = useState({
    response: 'accepted',
    notes: '',
  })
  const [nextActionForm, setNextActionForm] = useState({
    next_action: '',
    next_action_date: '',
  })

  const [saving, setSaving] = useState(false)

  // --- Data fetch ---
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch proposal
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', id)
        .eq('organization_id', ORG_ID)
        .single()

      if (proposalError || !proposalData) {
        setError('Proposition introuvable')
        setLoading(false)
        return
      }
      setProposal(proposalData as Proposal)
      setStatusForm(proposalData.status)
      setNextActionForm({
        next_action: proposalData.next_action || '',
        next_action_date: proposalData.next_action_date || '',
      })

      // Parallel fetches
      const [womanRes, manRes, photosRes, meetingsRes] = await Promise.all([
        supabase
          .from('candidates')
          .select('*')
          .eq('id', proposalData.candidate_woman_id)
          .single(),
        supabase
          .from('candidates_men')
          .select('*')
          .eq('id', proposalData.candidate_man_id)
          .single(),
        supabase
          .from('candidate_photos')
          .select('*')
          .eq('candidate_id', proposalData.candidate_woman_id)
          .order('order_index', { ascending: true }),
        supabase
          .from('meetings')
          .select('*')
          .eq('proposal_id', id)
          .order('meeting_number', { ascending: true }),
      ])

      if (womanRes.data) setWoman(womanRes.data as Candidate)
      if (manRes.data) setMan(manRes.data as CandidateMan)
      if (photosRes.data) setWomanPhotos(photosRes.data as CandidatePhoto[])

      const meetingsList = (meetingsRes.data || []) as Meeting[]
      setMeetings(meetingsList)

      // Fetch feedback for all meetings
      if (meetingsList.length > 0) {
        const meetingIds = meetingsList.map((m) => m.id)
        const { data: feedbackData } = await supabase
          .from('meeting_feedback')
          .select('*')
          .in('meeting_id', meetingIds)

        const fbMap: Record<string, MeetingFeedback[]> = {}
        for (const fb of (feedbackData || []) as MeetingFeedback[]) {
          if (!fbMap[fb.meeting_id]) fbMap[fb.meeting_id] = []
          fbMap[fb.meeting_id].push(fb)
        }
        setFeedbackMap(fbMap)
      }
    } catch {
      setError('Erreur lors du chargement des donnees')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- Actions ---

  async function handleStatusUpdate() {
    if (!proposal) return
    setSaving(true)
    try {
      const updates: Record<string, unknown> = { status: statusForm }

      // Set timestamps based on status
      if (statusForm === 'accord_demande' && !proposal.proposed_at) {
        updates.proposed_at = new Date().toISOString()
      }

      await supabase
        .from('proposals')
        .update(updates)
        .eq('id', proposal.id)

      setShowStatusModal(false)
      await fetchData()
    } finally {
      setSaving(false)
    }
  }

  async function handleResponseUpdate(side: 'woman' | 'man') {
    if (!proposal) return
    setSaving(true)
    try {
      const updates: Record<string, unknown> = {}
      if (side === 'woman') {
        updates.woman_response = responseForm.response
        updates.woman_response_at = new Date().toISOString()
        updates.woman_notes = responseForm.notes || null
      } else {
        updates.man_response = responseForm.response
        updates.man_response_at = new Date().toISOString()
        updates.man_notes = responseForm.notes || null
      }

      await supabase
        .from('proposals')
        .update(updates)
        .eq('id', proposal.id)

      setShowResponseModal(null)
      setResponseForm({ response: 'accepted', notes: '' })
      await fetchData()
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateMeeting() {
    if (!proposal) return
    setSaving(true)
    try {
      const nextNumber = meetings.length > 0
        ? Math.max(...meetings.map((m) => m.meeting_number)) + 1
        : 1

      await supabase.from('meetings').insert({
        proposal_id: proposal.id,
        meeting_number: nextNumber,
        scheduled_at: meetingForm.scheduled_at || null,
        location: meetingForm.location || null,
        location_type: meetingForm.location_type || null,
        status: 'planifiee' as MeetingStatus,
        duration_minutes: null,
        notes: null,
      })

      setShowMeetingModal(false)
      setMeetingForm({ scheduled_at: '', location: '', location_type: 'restaurant' })
      await fetchData()
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateFeedback() {
    if (!feedbackForm.meeting_id) return
    setSaving(true)
    try {
      await supabase.from('meeting_feedback').insert({
        meeting_id: feedbackForm.meeting_id,
        from_side: feedbackForm.from_side,
        sentiment: feedbackForm.sentiment,
        wants_next_meeting: feedbackForm.wants_next_meeting,
        feedback_text: feedbackForm.feedback_text || null,
        private_notes: feedbackForm.private_notes || null,
        collected_at: new Date().toISOString(),
        collected_by: null,
      })

      setShowFeedbackModal(false)
      setFeedbackForm({
        meeting_id: '',
        from_side: 'woman',
        sentiment: 'positif',
        wants_next_meeting: false,
        feedback_text: '',
        private_notes: '',
      })
      await fetchData()
    } finally {
      setSaving(false)
    }
  }

  async function handleNextActionUpdate() {
    if (!proposal) return
    setSaving(true)
    try {
      await supabase
        .from('proposals')
        .update({
          next_action: nextActionForm.next_action || null,
          next_action_date: nextActionForm.next_action_date || null,
        })
        .eq('id', proposal.id)

      setEditingNextAction(false)
      await fetchData()
    } finally {
      setSaving(false)
    }
  }

  // --- Loading / Error / 404 ---

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#87A878] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[#6B7280]">Chargement de la proposition...</p>
        </div>
      </div>
    )
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-[#C45B5B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-[#C45B5B]" />
          </div>
          <h1 className="text-xl font-semibold text-[#2D2D2D] mb-2">
            {error || 'Proposition introuvable'}
          </h1>
          <p className="text-[#6B7280] mb-6">
            Cette proposition n&apos;existe pas ou vous n&apos;y avez pas acces.
          </p>
          <Link href="/proposals">
            <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4" />}>
              Retour aux propositions
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const timeline = buildTimeline(proposal)
  const compatibility = woman && man ? computeCompatibility(woman, man) : []

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-[#FFFBF0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ============================== */}
        {/* A) HEADER */}
        {/* ============================== */}

        <div className="mb-8">
          {/* Back link */}
          <Link
            href="/proposals"
            className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#2D2D2D] transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux propositions
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-[#2D2D2D]">
                  {woman ? `${woman.first_name} ${woman.last_name}` : '...'}
                  {' & '}
                  {man ? `${man.first_name} ${man.last_name}` : '...'}
                </h1>
                <Badge
                  variant="default"
                  className={cn(getStatusColor(proposal.status), 'text-sm px-3 py-1')}
                >
                  {getStatusLabel(proposal.status)}
                </Badge>
              </div>
              <p className="text-sm text-[#6B7280]">
                Creee le {formatDate(proposal.created_at)}
                {proposal.proposed_at && ` — Proposee le ${formatDate(proposal.proposed_at)}`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Edit3 className="h-4 w-4" />}
                onClick={() => setShowStatusModal(true)}
              >
                Modifier le statut
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setShowMeetingModal(true)}
              >
                Planifier une rencontre
              </Button>
            </div>
          </div>
        </div>

        {/* ============================== */}
        {/* B) SIDE-BY-SIDE COMPARISON */}
        {/* ============================== */}

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 mb-8">
          {/* LEFT - Elle */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-[#E8E0D4] shadow-sm overflow-hidden">
              <div className="bg-[#6B3A5B]/5 px-6 py-3 border-b border-[#E8E0D4]">
                <h2 className="font-semibold text-[#6B3A5B] flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Elle
                </h2>
              </div>

              <div className="p-6">
                {/* Photo + basic info */}
                <div className="flex items-start gap-4 mb-6">
                  {womanPhotos.length > 0 ? (
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      <img
                        src={womanPhotos[0].url}
                        alt={woman ? `${woman.first_name} ${woman.last_name}` : ''}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-[#6B3A5B]/10 flex items-center justify-center shrink-0">
                      <span className="text-xl font-bold text-[#6B3A5B]">
                        {woman ? getInitials(woman.first_name, woman.last_name) : '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-[#2D2D2D]">
                      {woman ? `${woman.first_name} ${woman.last_name}` : 'Inconnue'}
                    </h3>
                    {woman && (
                      <>
                        <p className="text-sm text-[#6B7280]">
                          {calculateAge(woman.date_of_birth, woman.age_estimate, woman.is_age_estimate)}
                        </p>
                        {woman.city && (
                          <p className="text-sm text-[#6B7280] flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {woman.city}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {woman && (
                  <>
                    {/* Key info */}
                    <div className="space-y-3 mb-6">
                      {woman.courant && (
                        <InfoRow icon={<Book className="h-4 w-4" />} label="Courant" value={getCourantLabel(woman.courant)} />
                      )}
                      {woman.community && (
                        <InfoRow icon={<Users className="h-4 w-4" />} label="Communauté" value={getCommunityEthnicLabel(woman.community)} />
                      )}
                      {woman.shabbat_practice && (
                        <InfoRow icon={<Star className="h-4 w-4" />} label="Chabbat" value={getShabbatPracticeLabel(woman.shabbat_practice)} />
                      )}
                      {woman.profession && (
                        <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Profession" value={woman.profession} />
                      )}
                      {woman.marital_status && (
                        <InfoRow icon={<User className="h-4 w-4" />} label="Situation" value={woman.marital_status} />
                      )}
                      <InfoRow
                        icon={<Baby className="h-4 w-4" />}
                        label="Enfants"
                        value={woman.has_children ? 'Oui' : 'Non'}
                      />
                    </div>

                    {/* What she's looking for */}
                    <div className="border-t border-[#E8E0D4] pt-4 mb-4">
                      <h4 className="text-sm font-semibold text-[#2D2D2D] mb-3 flex items-center gap-1.5">
                        <Target className="h-4 w-4 text-[#6B3A5B]" />
                        Ce qu&apos;elle recherche
                      </h4>
                      {woman.ideal_husband && (
                        <p className="text-sm text-[#6B7280] mb-2">{woman.ideal_husband}</p>
                      )}
                      <div className="space-y-1.5 text-sm text-[#6B7280]">
                        {(woman.age_min || woman.age_max) && (
                          <p>
                            Âge : {woman.age_min || '?'} – {woman.age_max || '?'} ans
                          </p>
                        )}
                        {woman.preferred_cities && (
                          <p>Villes : {woman.preferred_cities}</p>
                        )}
                      </div>
                    </div>

                    {/* Link to profile */}
                    <Link
                      href={`/candidates/${woman.id}`}
                      className="inline-flex items-center gap-1.5 text-sm text-[#6B3A5B] hover:text-[#5A2E4D] font-medium transition-colors"
                    >
                      Voir la fiche complete
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* MIDDLE - Compatibility */}
          <div className="lg:col-span-1 flex items-center justify-center">
            <div className="bg-white rounded-xl border border-[#E8E0D4] shadow-sm p-4 w-full">
              <h3 className="text-xs font-semibold text-[#2D2D2D] text-center mb-3 uppercase tracking-wider">
                Compatibilite
              </h3>
              <div className="space-y-3">
                {compatibility.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        item.level === 'green' && 'bg-[#87A878]/15 text-[#87A878]',
                        item.level === 'orange' && 'bg-orange-100 text-orange-600',
                        item.level === 'gray' && 'bg-gray-100 text-gray-400'
                      )}
                    >
                      {item.level === 'green' && <CheckCircle2 className="h-4 w-4" />}
                      {item.level === 'orange' && <AlertCircle className="h-4 w-4" />}
                      {item.level === 'gray' && <Minus className="h-4 w-4" />}
                    </div>
                    <span className="text-[10px] text-[#6B7280] text-center leading-tight">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT - Lui */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-[#E8E0D4] shadow-sm overflow-hidden">
              <div className="bg-[#87A878]/5 px-6 py-3 border-b border-[#E8E0D4]">
                <h2 className="font-semibold text-[#5A7A4A] flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Lui
                </h2>
              </div>

              <div className="p-6">
                {/* Avatar + basic info */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-20 h-20 rounded-xl bg-[#87A878]/10 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-[#5A7A4A]">
                      {man ? getInitials(man.first_name, man.last_name) : '?'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#2D2D2D]">
                      {man ? `${man.first_name} ${man.last_name}` : 'Inconnu'}
                    </h3>
                    {man && (
                      <>
                        <p className="text-sm text-[#6B7280]">
                          {calculateAge(man.date_of_birth, man.age_estimate, man.is_age_estimate)}
                        </p>
                        {man.city && (
                          <p className="text-sm text-[#6B7280] flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {man.city}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {man && (
                  <>
                    {/* Key info */}
                    <div className="space-y-3 mb-6">
                      {man.courant && (
                        <InfoRow icon={<Book className="h-4 w-4" />} label="Courant" value={getCourantLabel(man.courant)} />
                      )}
                      {man.community && (
                        <InfoRow icon={<Users className="h-4 w-4" />} label="Communauté" value={getCommunityEthnicLabel(man.community)} />
                      )}
                      {man.shabbat_practice && (
                        <InfoRow icon={<Star className="h-4 w-4" />} label="Chabbat" value={getShabbatPracticeLabel(man.shabbat_practice)} />
                      )}
                      {man.profession && (
                        <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Profession" value={man.profession} />
                      )}
                      {man.marital_status && (
                        <InfoRow icon={<User className="h-4 w-4" />} label="Situation matrimoniale" value={man.marital_status} />
                      )}
                      <InfoRow
                        icon={<Baby className="h-4 w-4" />}
                        label="Enfants"
                        value={man.has_children ? 'Oui' : 'Non'}
                      />
                    </div>

                    {/* What he's looking for */}
                    <div className="border-t border-[#E8E0D4] pt-4 mb-4">
                      <h4 className="text-sm font-semibold text-[#2D2D2D] mb-3 flex items-center gap-1.5">
                        <Target className="h-4 w-4 text-[#5A7A4A]" />
                        Ce qu&apos;il recherche
                      </h4>
                      {man.expected_qualities && (
                        <p className="text-sm text-[#6B7280] mb-2">{man.expected_qualities}</p>
                      )}
                      <div className="space-y-1.5 text-sm text-[#6B7280]">
                        {(man.age_min || man.age_max) && (
                          <p>
                            Âge : {man.age_min || '?'} - {man.age_max || '?'} ans
                          </p>
                        )}
                        {man.preferred_cities && (
                          <p>Villes : {man.preferred_cities}</p>
                        )}
                      </div>
                    </div>

                    {/* Link to profile */}
                    <Link
                      href={`/men/${man.id}`}
                      className="inline-flex items-center gap-1.5 text-sm text-[#5A7A4A] hover:text-[#4A6A3A] font-medium transition-colors"
                    >
                      Voir la fiche complete
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Compatibility detail (full width below on mobile, hidden on desktop since shown in middle) */}
        <div className="lg:hidden mb-8">
          <div className="bg-white rounded-xl border border-[#E8E0D4] shadow-sm p-6">
            <h3 className="text-sm font-semibold text-[#2D2D2D] mb-4 uppercase tracking-wider">
              Compatibilite
            </h3>
            <div className="space-y-3">
              {compatibility.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 py-2 border-b border-[#E8E0D4] last:border-b-0"
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                      item.level === 'green' && 'bg-[#87A878]/15 text-[#87A878]',
                      item.level === 'orange' && 'bg-orange-100 text-orange-600',
                      item.level === 'gray' && 'bg-gray-100 text-gray-400'
                    )}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2D2D2D]">{item.label}</p>
                    <p className="text-xs text-[#6B7280] truncate">{item.detail}</p>
                  </div>
                  <div>
                    {item.level === 'green' && <CheckCircle2 className="h-5 w-5 text-[#87A878]" />}
                    {item.level === 'orange' && <AlertCircle className="h-5 w-5 text-orange-500" />}
                    {item.level === 'gray' && <Minus className="h-5 w-5 text-gray-300" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================== */}
        {/* E) RESPONSE BUTTONS */}
        {/* ============================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Woman response */}
          <div className="bg-white rounded-xl border border-[#E8E0D4] shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#2D2D2D]">Reponse d&apos;elle</p>
                {proposal.woman_response ? (
                  <p className="text-sm text-[#6B7280] mt-1">
                    {proposal.woman_response === 'accepted' ? 'Accepte' : proposal.woman_response}
                    {proposal.woman_response_at && ` — ${formatDate(proposal.woman_response_at)}`}
                  </p>
                ) : (
                  <p className="text-sm text-[#6B7280] mt-1">Pas encore de reponse</p>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setResponseForm({ response: 'accepted', notes: '' })
                  setShowResponseModal('woman')
                }}
              >
                Enregistrer
              </Button>
            </div>
          </div>

          {/* Man response */}
          <div className="bg-white rounded-xl border border-[#E8E0D4] shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#2D2D2D]">Reponse de lui</p>
                {proposal.man_response ? (
                  <p className="text-sm text-[#6B7280] mt-1">
                    {proposal.man_response === 'accepted' ? 'Accepte' : proposal.man_response}
                    {proposal.man_response_at && ` — ${formatDate(proposal.man_response_at)}`}
                  </p>
                ) : (
                  <p className="text-sm text-[#6B7280] mt-1">Pas encore de reponse</p>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setResponseForm({ response: 'accepted', notes: '' })
                  setShowResponseModal('man')
                }}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </div>

        {/* ============================== */}
        {/* F) NEXT ACTION */}
        {/* ============================== */}

        <div className="bg-white rounded-xl border border-[#E8E0D4] shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[#2D2D2D] flex items-center gap-2">
              <Target className="h-5 w-5 text-[#C5A55A]" />
              Prochaine action
            </h2>
            {!editingNextAction && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Edit3 className="h-4 w-4" />}
                onClick={() => setEditingNextAction(true)}
              >
                Modifier
              </Button>
            )}
          </div>

          {editingNextAction ? (
            <div className="space-y-4">
              <Input
                label="Action"
                value={nextActionForm.next_action}
                onChange={(e) =>
                  setNextActionForm((f) => ({
                    ...f,
                    next_action: (e.target as HTMLInputElement).value,
                  }))
                }
                placeholder="Ex: Appeler la famille, Organiser la 2eme rencontre..."
              />
              <Input
                label="Date prevue"
                inputType="date"
                value={nextActionForm.next_action_date}
                onChange={(e) =>
                  setNextActionForm((f) => ({
                    ...f,
                    next_action_date: (e.target as HTMLInputElement).value,
                  }))
                }
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Save className="h-4 w-4" />}
                  loading={saving}
                  onClick={handleNextActionUpdate}
                >
                  Enregistrer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingNextAction(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {proposal.next_action ? (
                <div>
                  <p className="text-sm text-[#2D2D2D]">{proposal.next_action}</p>
                  {proposal.next_action_date && (
                    <p className="text-sm text-[#6B7280] mt-1">
                      Prevue le {formatDate(proposal.next_action_date)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#6B7280] italic">Aucune action prevue</p>
              )}
            </div>
          )}
        </div>

        {/* ============================== */}
        {/* C) PROPOSAL TIMELINE */}
        {/* ============================== */}

        <div className="bg-white rounded-xl border border-[#E8E0D4] shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-[#2D2D2D] mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#6B3A5B]" />
            Chronologie
          </h2>

          {timeline.length === 0 ? (
            <p className="text-sm text-[#6B7280] italic">Aucun evenement</p>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-[#E8E0D4]" />

              <div className="space-y-6">
                {timeline.map((event, idx) => (
                  <div key={idx} className="relative flex gap-4">
                    {/* Dot */}
                    <div className={cn('w-6 h-6 rounded-full shrink-0 flex items-center justify-center z-10', event.color)}>
                      <CircleDot className="h-3 w-3 text-white" />
                    </div>

                    <div className="flex-1 pb-2">
                      <p className="text-sm font-medium text-[#2D2D2D]">{event.label}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        {formatDateTime(event.date)}
                      </p>
                      {event.detail && (
                        <p className="text-sm text-[#6B7280] mt-1 bg-gray-50 rounded-lg p-3 border border-[#E8E0D4]">
                          {event.detail}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ============================== */}
        {/* D) MEETINGS SECTION */}
        {/* ============================== */}

        <div className="bg-white rounded-xl border border-[#E8E0D4] shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#2D2D2D] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#87A878]" />
              Rencontres
              {meetings.length > 0 && (
                <span className="text-sm font-normal text-[#6B7280]">
                  ({meetings.length})
                </span>
              )}
            </h2>
            <div className="flex gap-2">
              {meetings.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<MessageSquare className="h-4 w-4" />}
                  onClick={() => {
                    setFeedbackForm((f) => ({ ...f, meeting_id: meetings[meetings.length - 1].id }))
                    setShowFeedbackModal(true)
                  }}
                >
                  Ajouter un retour
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setShowMeetingModal(true)}
              >
                Nouvelle rencontre
              </Button>
            </div>
          </div>

          {meetings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#87A878]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-[#87A878]" />
              </div>
              <p className="text-[#6B7280] mb-2">Aucune rencontre planifiee</p>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setShowMeetingModal(true)}
              >
                Planifier la premiere rencontre
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {meetings.map((meeting) => {
                const fb = feedbackMap[meeting.id] || []
                const womanFb = fb.filter((f) => f.from_side === 'woman')
                const manFb = fb.filter((f) => f.from_side === 'man')

                return (
                  <div
                    key={meeting.id}
                    className="border border-[#E8E0D4] rounded-lg overflow-hidden"
                  >
                    {/* Meeting header */}
                    <div className="bg-gray-50 px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[#2D2D2D]">
                          Rencontre n{'°'}{meeting.meeting_number}
                        </span>
                        <Badge
                          variant="default"
                          className={getStatusColor(meeting.status)}
                        >
                          {getStatusLabel(meeting.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                        {meeting.scheduled_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDateTime(meeting.scheduled_at)}
                          </span>
                        )}
                        {meeting.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {meeting.location}
                            {meeting.location_type && ` (${locationTypeLabels[meeting.location_type] || meeting.location_type})`}
                          </span>
                        )}
                        {meeting.duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {meeting.duration_minutes} min
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meeting notes */}
                    {meeting.notes && (
                      <div className="px-5 py-3 border-t border-[#E8E0D4] bg-white">
                        <p className="text-sm text-[#6B7280]">{meeting.notes}</p>
                      </div>
                    )}

                    {/* Feedback */}
                    {fb.length > 0 && (
                      <div className="border-t border-[#E8E0D4]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#E8E0D4]">
                          {/* Woman feedback */}
                          <div className="p-5">
                            <p className="text-xs font-semibold text-[#6B3A5B] uppercase tracking-wider mb-3">
                              Retour d&apos;elle
                            </p>
                            {womanFb.length === 0 ? (
                              <p className="text-sm text-[#6B7280] italic">Aucun retour</p>
                            ) : (
                              womanFb.map((f) => (
                                <FeedbackCard key={f.id} feedback={f} />
                              ))
                            )}
                          </div>

                          {/* Man feedback */}
                          <div className="p-5">
                            <p className="text-xs font-semibold text-[#5A7A4A] uppercase tracking-wider mb-3">
                              Retour de lui
                            </p>
                            {manFb.length === 0 ? (
                              <p className="text-sm text-[#6B7280] italic">Aucun retour</p>
                            ) : (
                              manFb.map((f) => (
                                <FeedbackCard key={f.id} feedback={f} />
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* No feedback yet */}
                    {fb.length === 0 && (
                      <div className="px-5 py-3 border-t border-[#E8E0D4] bg-white">
                        <p className="text-sm text-[#6B7280] italic">Aucun retour enregistre pour cette rencontre</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ============================== */}
        {/* MODALS */}
        {/* ============================== */}

        {/* Status update modal */}
        <Modal
          open={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          title="Modifier le statut"
        >
          <div className="space-y-4">
            <Select
              label="Nouveau statut"
              options={proposalStatusOptions}
              value={statusForm}
              onChange={(e) => setStatusForm(e.target.value as ProposalStatus)}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStatusModal(false)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={saving}
                onClick={handleStatusUpdate}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </Modal>

        {/* Schedule meeting modal */}
        <Modal
          open={showMeetingModal}
          onClose={() => setShowMeetingModal(false)}
          title="Planifier une rencontre"
        >
          <div className="space-y-4">
            <div className="bg-[#87A878]/10 rounded-lg px-4 py-3 text-sm text-[#5A7A4A]">
              Rencontre n{'°'}
              {meetings.length > 0
                ? Math.max(...meetings.map((m) => m.meeting_number)) + 1
                : 1}
            </div>
            <Input
              label="Date et heure"
              inputType="date"
              value={meetingForm.scheduled_at}
              onChange={(e) =>
                setMeetingForm((f) => ({
                  ...f,
                  scheduled_at: (e.target as HTMLInputElement).value,
                }))
              }
            />
            <Input
              label="Lieu"
              value={meetingForm.location}
              onChange={(e) =>
                setMeetingForm((f) => ({
                  ...f,
                  location: (e.target as HTMLInputElement).value,
                }))
              }
              placeholder="Ex: Cafe David, rue de Passy..."
            />
            <Select
              label="Type de lieu"
              options={locationTypeOptions}
              value={meetingForm.location_type}
              onChange={(e) =>
                setMeetingForm((f) => ({
                  ...f,
                  location_type: e.target.value,
                }))
              }
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMeetingModal(false)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={saving}
                onClick={handleCreateMeeting}
              >
                Planifier
              </Button>
            </div>
          </div>
        </Modal>

        {/* Add feedback modal */}
        <Modal
          open={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          title="Ajouter un retour"
        >
          <div className="space-y-4">
            <Select
              label="Rencontre"
              options={meetings.map((m) => ({
                value: m.id,
                label: `Rencontre n°${m.meeting_number}${m.scheduled_at ? ` — ${formatDate(m.scheduled_at)}` : ''}`,
              }))}
              value={feedbackForm.meeting_id}
              onChange={(e) =>
                setFeedbackForm((f) => ({ ...f, meeting_id: e.target.value }))
              }
              placeholder="Choisir une rencontre"
            />
            <Select
              label="De la part de"
              options={[
                { value: 'woman', label: 'Elle' },
                { value: 'man', label: 'Lui' },
              ]}
              value={feedbackForm.from_side}
              onChange={(e) =>
                setFeedbackForm((f) => ({
                  ...f,
                  from_side: e.target.value as 'woman' | 'man',
                }))
              }
            />
            <Select
              label="Sentiment general"
              options={sentimentOptions}
              value={feedbackForm.sentiment}
              onChange={(e) =>
                setFeedbackForm((f) => ({
                  ...f,
                  sentiment: e.target.value as FeedbackSentiment,
                }))
              }
            />
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={feedbackForm.wants_next_meeting}
                  onChange={(e) =>
                    setFeedbackForm((f) => ({
                      ...f,
                      wants_next_meeting: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-[#E8E0D4] text-[#87A878] focus:ring-[#87A878]"
                />
                <span className="text-sm text-[#2D2D2D]">
                  Souhaite une prochaine rencontre
                </span>
              </label>
            </div>
            <Input
              label="Commentaire"
              inputType="textarea"
              value={feedbackForm.feedback_text}
              onChange={(e) =>
                setFeedbackForm((f) => ({
                  ...f,
                  feedback_text: (e.target as HTMLTextAreaElement).value,
                }))
              }
              placeholder="Impressions, ressenti..."
            />
            <Input
              label="Notes privees (non partagees)"
              inputType="textarea"
              value={feedbackForm.private_notes}
              onChange={(e) =>
                setFeedbackForm((f) => ({
                  ...f,
                  private_notes: (e.target as HTMLTextAreaElement).value,
                }))
              }
              placeholder="Notes reservees au shadkhan..."
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFeedbackModal(false)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={saving}
                onClick={handleCreateFeedback}
                disabled={!feedbackForm.meeting_id}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </Modal>

        {/* Response modal (woman or man) */}
        <Modal
          open={showResponseModal !== null}
          onClose={() => setShowResponseModal(null)}
          title={
            showResponseModal === 'woman'
              ? 'Enregistrer l\'accord (elle)'
              : 'Enregistrer l\'accord (lui)'
          }
        >
          <div className="space-y-4">
            <Select
              label="Reponse"
              options={[
                { value: 'accepted', label: 'Accepte' },
                { value: 'declined', label: 'Refuse' },
                { value: 'thinking', label: 'En reflexion' },
                { value: 'conditions', label: 'Accepte sous conditions' },
              ]}
              value={responseForm.response}
              onChange={(e) =>
                setResponseForm((f) => ({ ...f, response: e.target.value }))
              }
            />
            <Input
              label="Notes"
              inputType="textarea"
              value={responseForm.notes}
              onChange={(e) =>
                setResponseForm((f) => ({
                  ...f,
                  notes: (e.target as HTMLTextAreaElement).value,
                }))
              }
              placeholder="Commentaire, raison du refus, conditions..."
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResponseModal(null)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={saving}
                onClick={() => {
                  if (showResponseModal) handleResponseUpdate(showResponseModal)
                }}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-[#6B7280] shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-[#6B7280]">{label}</p>
        <p className="text-sm text-[#2D2D2D]">{value}</p>
      </div>
    </div>
  )
}

function FeedbackCard({ feedback }: { feedback: MeetingFeedback }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge
          variant="default"
          className={getStatusColor(feedback.sentiment)}
        >
          {getStatusLabel(feedback.sentiment)}
        </Badge>
        {feedback.wants_next_meeting !== null && (
          <span className="text-xs text-[#6B7280] flex items-center gap-1">
            {feedback.wants_next_meeting ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#87A878]" />
                Souhaite continuer
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5 text-[#C45B5B]" />
                Ne souhaite pas continuer
              </>
            )}
          </span>
        )}
      </div>
      {feedback.feedback_text && (
        <p className="text-sm text-[#6B7280]">{feedback.feedback_text}</p>
      )}
      {feedback.private_notes && (
        <div className="bg-[#C5A55A]/5 rounded-lg p-2 border border-[#C5A55A]/20">
          <p className="text-xs text-[#8B7030]">
            <span className="font-medium">Note privee :</span> {feedback.private_notes}
          </p>
        </div>
      )}
      {feedback.collected_at && (
        <p className="text-xs text-[#6B7280]">
          Recueilli le {formatDate(feedback.collected_at)}
        </p>
      )}
    </div>
  )
}
