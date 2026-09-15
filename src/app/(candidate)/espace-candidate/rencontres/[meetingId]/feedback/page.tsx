'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { MessageCircleHeart, CheckCircle2, ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FeedbackData {
  liked_appearance: boolean
  liked_personality: boolean
  liked_conversation: boolean
  liked_values: boolean
  liked_humor: boolean
  liked_ambition: boolean
  liked_other: string
  issue_no_chemistry: boolean
  issue_different_values: boolean
  issue_conversation_difficult: boolean
  issue_appearance: boolean
  issue_different_lifestyle: boolean
  issue_other: string
  overall_impression: string
  wants_next_meeting: string
  additional_comments: string
}

interface ExistingFeedback extends FeedbackData {
  id: string
  meeting_id: string
  candidate_id: string
  created_at: string
}

const INITIAL_FEEDBACK: FeedbackData = {
  liked_appearance: false,
  liked_personality: false,
  liked_conversation: false,
  liked_values: false,
  liked_humor: false,
  liked_ambition: false,
  liked_other: '',
  issue_no_chemistry: false,
  issue_different_values: false,
  issue_conversation_difficult: false,
  issue_appearance: false,
  issue_different_lifestyle: false,
  issue_other: '',
  overall_impression: '',
  wants_next_meeting: '',
  additional_comments: '',
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function FeedbackPage(props: {
  params: Promise<{ meetingId: string }>
}) {
  const { meetingId } = use(props.params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessError, setAccessError] = useState<string | null>(null)

  const [feedback, setFeedback] = useState<FeedbackData>(INITIAL_FEEDBACK)
  const [existing, setExisting] = useState<ExistingFeedback | null>(null)
  const [candidateId, setCandidateId] = useState<string | null>(null)
  const [candidateType, setCandidateType] = useState<string>('woman')
  const [proposalId, setProposalId] = useState<string | null>(null)

  /* ---- Load meeting & existing feedback ---- */
  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // 1. Current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setAccessError('Veuillez vous connecter.')
        setLoading(false)
        return
      }

      // 2. Get candidate_id + candidate_type
      const { data: token } = await supabase
        .from('candidate_portal_tokens')
        .select('candidate_id, candidate_type')
        .eq('auth_user_id', user.id)
        .eq('is_active', true)
        .single()

      if (!token) {
        setAccessError('Acces non autorise.')
        setLoading(false)
        return
      }

      setCandidateId(token.candidate_id)
      const cType: 'woman' | 'man' = token.candidate_type || 'woman'
      setCandidateType(cType)

      // 3. Verify meeting belongs to one of this candidate's proposals
      const { data: meeting } = await supabase
        .from('meetings')
        .select('id, proposal_id, status')
        .eq('id', meetingId)
        .single()

      if (!meeting) {
        setAccessError('Rencontre introuvable.')
        setLoading(false)
        return
      }

      const proposalColumn = cType === 'woman' ? 'candidate_woman_id' : 'candidate_man_id'
      const { data: proposal } = await supabase
        .from('proposals')
        .select('id')
        .eq('id', meeting.proposal_id)
        .eq(proposalColumn, token.candidate_id)
        .single()

      if (!proposal) {
        setAccessError('Vous n\'avez pas acces a cette rencontre.')
        setLoading(false)
        return
      }

      setProposalId(meeting.proposal_id)

      // 4. Check for existing feedback (filtered by candidate_type so both can give feedback)
      const { data: existingFb } = await supabase
        .from('candidate_portal_feedback')
        .select('*')
        .eq('meeting_id', meetingId)
        .eq('candidate_id', token.candidate_id)
        .eq('candidate_type', cType)
        .single()

      if (existingFb) {
        setExisting(existingFb as ExistingFeedback)
        setFeedback({
          liked_appearance: existingFb.liked_appearance || false,
          liked_personality: existingFb.liked_personality || false,
          liked_conversation: existingFb.liked_conversation || false,
          liked_values: existingFb.liked_values || false,
          liked_humor: existingFb.liked_humor || false,
          liked_ambition: existingFb.liked_ambition || false,
          liked_other: existingFb.liked_other || '',
          issue_no_chemistry: existingFb.issue_no_chemistry || false,
          issue_different_values: existingFb.issue_different_values || false,
          issue_conversation_difficult: existingFb.issue_conversation_difficult || false,
          issue_appearance: existingFb.issue_appearance || false,
          issue_different_lifestyle: existingFb.issue_different_lifestyle || false,
          issue_other: existingFb.issue_other || '',
          overall_impression: existingFb.overall_impression || '',
          wants_next_meeting: existingFb.wants_next_meeting || '',
          additional_comments: existingFb.additional_comments || '',
        })
      }

      setLoading(false)
    }

    load()
  }, [meetingId])

  /* ---- Toggle a boolean field ---- */
  function toggle(field: keyof FeedbackData) {
    setFeedback((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  /* ---- Update a text field ---- */
  function updateText(field: keyof FeedbackData, value: string) {
    setFeedback((prev) => ({ ...prev, [field]: value }))
  }

  /* ---- Submit ---- */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (existing || !candidateId) return

    setError(null)
    setSubmitting(true)

    try {
      const supabase = createClient()
      const { error: insertError } = await supabase
        .from('candidate_portal_feedback')
        .insert({
          meeting_id: meetingId,
          proposal_id: proposalId,
          candidate_id: candidateId,
          candidate_type: candidateType,
          liked_appearance: feedback.liked_appearance,
          liked_personality: feedback.liked_personality,
          liked_conversation: feedback.liked_conversation,
          liked_values: feedback.liked_values,
          liked_humor: feedback.liked_humor,
          liked_ambition: feedback.liked_ambition,
          liked_other: feedback.liked_other || null,
          issue_no_chemistry: feedback.issue_no_chemistry,
          issue_different_values: feedback.issue_different_values,
          issue_conversation_difficult: feedback.issue_conversation_difficult,
          issue_appearance: feedback.issue_appearance,
          issue_different_lifestyle: feedback.issue_different_lifestyle,
          issue_other: feedback.issue_other || null,
          overall_impression: feedback.overall_impression || null,
          wants_next_meeting: feedback.wants_next_meeting || null,
          additional_comments: feedback.additional_comments || null,
        })

      if (insertError) {
        setError('Une erreur est survenue. Veuillez reessayer.')
        setSubmitting(false)
        return
      }

      setSubmitted(true)
      setTimeout(() => {
        router.push('/espace-candidate/rencontres')
      }, 2500)
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  /* ---- Access error ---- */
  if (accessError) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-danger font-medium">{accessError}</p>
        <Link
          href="/espace-candidate/rencontres"
          className="inline-flex items-center gap-1.5 text-sm text-plum hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux rencontres
        </Link>
      </div>
    )
  }

  /* ---- Success state after submit ---- */
  if (submitted) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sage/15">
          <CheckCircle2 className="w-8 h-8 text-sage" />
        </div>
        <h2 className="font-display text-[24px] font-semibold text-ink">
          Merci pour votre retour !
        </h2>
        <p className="text-sm text-ink-soft">
          Votre avis a bien ete enregistre. Hava le prendra en compte pour la suite.
        </p>
        <p className="text-xs text-ink-muted">
          Redirection en cours...
        </p>
      </div>
    )
  }

  const isReadOnly = !!existing

  /* ---- Form ---- */
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/espace-candidate/rencontres"
        className="inline-flex items-center gap-1.5 text-sm text-plum hover:text-plum-hover transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux rencontres
      </Link>

      {/* Title */}
      <div>
        <h1 className="text-[30px] font-semibold text-plum flex items-center gap-2">
          <MessageCircleHeart className="h-6 w-6" />
          {isReadOnly ? 'Mon retour' : 'Donner mon avis'}
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          {isReadOnly
            ? 'Voici le retour que vous avez partage. Il est transmis a votre chadkhanit.'
            : 'Partagez votre ressenti en toute confidentialite. Seule votre chadkhanit y aura acces.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ---- Ce qui m'a plu ---- */}
        <fieldset className="bg-surface rounded-[14px] border border-line p-5 space-y-4">
          <legend className="text-base font-semibold text-sage px-1">
            Ce qui m&apos;a plu
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CheckboxItem
              label="Son apparence physique"
              checked={feedback.liked_appearance}
              onChange={() => toggle('liked_appearance')}
              disabled={isReadOnly}
              color="sage"
            />
            <CheckboxItem
              label="Sa personnalite"
              checked={feedback.liked_personality}
              onChange={() => toggle('liked_personality')}
              disabled={isReadOnly}
              color="sage"
            />
            <CheckboxItem
              label="La qualite de la conversation"
              checked={feedback.liked_conversation}
              onChange={() => toggle('liked_conversation')}
              disabled={isReadOnly}
              color="sage"
            />
            <CheckboxItem
              label="Ses valeurs et sa vision"
              checked={feedback.liked_values}
              onChange={() => toggle('liked_values')}
              disabled={isReadOnly}
              color="sage"
            />
            <CheckboxItem
              label="Son sens de l'humour"
              checked={feedback.liked_humor}
              onChange={() => toggle('liked_humor')}
              disabled={isReadOnly}
              color="sage"
            />
            <CheckboxItem
              label="Son ambition et ses projets"
              checked={feedback.liked_ambition}
              onChange={() => toggle('liked_ambition')}
              disabled={isReadOnly}
              color="sage"
            />
          </div>

          <div>
            <label className="block text-sm text-ink-soft mb-1">
              Autre (precisez)
            </label>
            <input
              type="text"
              value={feedback.liked_other}
              onChange={(e) => updateText('liked_other', e.target.value)}
              disabled={isReadOnly}
              placeholder="Ex : sa culture, sa douceur..."
              className="w-full px-3 py-2 rounded-lg border border-line text-sm text-ink
                         placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-sage
                         disabled:bg-surface-muted disabled:cursor-not-allowed"
            />
          </div>
        </fieldset>

        {/* ---- Ce qui n'a pas fonctionne ---- */}
        <fieldset className="bg-surface rounded-[14px] border border-line p-5 space-y-4">
          <legend className="text-base font-semibold text-danger px-1">
            Ce qui n&apos;a pas fonctionne
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CheckboxItem
              label="Pas de feeling / pas d'attirance"
              checked={feedback.issue_no_chemistry}
              onChange={() => toggle('issue_no_chemistry')}
              disabled={isReadOnly}
              color="rose"
            />
            <CheckboxItem
              label="Valeurs differentes"
              checked={feedback.issue_different_values}
              onChange={() => toggle('issue_different_values')}
              disabled={isReadOnly}
              color="rose"
            />
            <CheckboxItem
              label="Conversation difficile"
              checked={feedback.issue_conversation_difficult}
              onChange={() => toggle('issue_conversation_difficult')}
              disabled={isReadOnly}
              color="rose"
            />
            <CheckboxItem
              label="Physiquement pas mon type"
              checked={feedback.issue_appearance}
              onChange={() => toggle('issue_appearance')}
              disabled={isReadOnly}
              color="rose"
            />
            <CheckboxItem
              label="Mode de vie different"
              checked={feedback.issue_different_lifestyle}
              onChange={() => toggle('issue_different_lifestyle')}
              disabled={isReadOnly}
              color="rose"
            />
          </div>

          <div>
            <label className="block text-sm text-ink-soft mb-1">
              Autre (precisez)
            </label>
            <input
              type="text"
              value={feedback.issue_other}
              onChange={(e) => updateText('issue_other', e.target.value)}
              disabled={isReadOnly}
              placeholder="Ex : trop timide, pas assez mature..."
              className="w-full px-3 py-2 rounded-lg border border-line text-sm text-ink
                         placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-sage
                         disabled:bg-surface-muted disabled:cursor-not-allowed"
            />
          </div>
        </fieldset>

        {/* ---- Impression generale ---- */}
        <fieldset className="bg-surface rounded-[14px] border border-line p-5 space-y-3">
          <legend className="text-base font-semibold text-plum px-1">
            Impression generale
          </legend>
          <textarea
            value={feedback.overall_impression}
            onChange={(e) => updateText('overall_impression', e.target.value)}
            disabled={isReadOnly}
            rows={3}
            placeholder="Comment avez-vous vecu cette rencontre ? Qu'avez-vous ressenti ?"
            className="w-full px-3 py-2 rounded-lg border border-line text-sm text-ink
                       placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-sage
                       resize-none disabled:bg-surface-muted disabled:cursor-not-allowed"
          />
        </fieldset>

        {/* ---- Prochaine rencontre ---- */}
        <fieldset className="bg-surface rounded-[14px] border border-line p-5 space-y-3">
          <legend className="text-base font-semibold text-plum px-1">
            Souhaitez-vous une prochaine rencontre ?
          </legend>
          <div className="flex flex-wrap gap-3">
            {[
              { value: 'oui', label: 'Oui', emoji: '❤️' },
              { value: 'non', label: 'Non', emoji: '' },
              { value: 'ne_sais_pas', label: 'Je ne sais pas', emoji: '' },
            ].map((option) => (
              <label
                key={option.value}
                className={[
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-all',
                  feedback.wants_next_meeting === option.value
                    ? 'border-plum bg-plum/5 text-plum ring-1 ring-plum'
                    : 'border-line text-ink-soft hover:border-gold hover:text-ink',
                  isReadOnly ? 'cursor-not-allowed opacity-75' : '',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="wants_next_meeting"
                  value={option.value}
                  checked={feedback.wants_next_meeting === option.value}
                  onChange={(e) => updateText('wants_next_meeting', e.target.value)}
                  disabled={isReadOnly}
                  className="sr-only"
                />
                {option.emoji && <span>{option.emoji}</span>}
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        {/* ---- Commentaires supplementaires ---- */}
        <fieldset className="bg-surface rounded-[14px] border border-line p-5 space-y-3">
          <legend className="text-base font-semibold text-plum px-1">
            Commentaires supplementaires
          </legend>
          <textarea
            value={feedback.additional_comments}
            onChange={(e) => updateText('additional_comments', e.target.value)}
            disabled={isReadOnly}
            rows={3}
            placeholder="Tout ce que vous aimeriez ajouter pour aider votre chadkhanit..."
            className="w-full px-3 py-2 rounded-lg border border-line text-sm text-ink
                       placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-sage
                       resize-none disabled:bg-surface-muted disabled:cursor-not-allowed"
          />
        </fieldset>

        {/* ---- Submit / Error ---- */}
        {error && (
          <div className="p-3 rounded-lg bg-danger-light border border-danger/25 text-sm text-danger">
            {error}
          </div>
        )}

        {!isReadOnly && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg
                         bg-plum text-white text-sm font-medium shadow-card
                         hover:bg-plum-hover transition-colors
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Envoyer mon retour
                </>
              )}
            </button>
          </div>
        )}

        {isReadOnly && (
          <div className="p-4 rounded-lg bg-sage/10 border border-sage/20 text-center">
            <p className="text-sm text-sage-deep font-medium">
              Votre retour a deja ete envoye. Merci !
            </p>
          </div>
        )}
      </form>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Checkbox component                                                 */
/* ------------------------------------------------------------------ */

function CheckboxItem({
  label,
  checked,
  onChange,
  disabled,
  color,
}: {
  label: string
  checked: boolean
  onChange: () => void
  disabled: boolean
  color: 'sage' | 'rose'
}) {
  const borderChecked = color === 'sage' ? 'border-sage' : 'border-danger'
  const bgChecked = color === 'sage' ? 'bg-sage/10' : 'bg-danger-light'
  const checkColor = color === 'sage' ? 'text-sage' : 'text-danger'

  return (
    <label
      className={[
        'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm cursor-pointer transition-all',
        checked ? `${borderChecked} ${bgChecked}` : 'border-line',
        disabled ? 'cursor-not-allowed opacity-75' : 'hover:border-gold',
      ].join(' ')}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      <span
        className={[
          'flex items-center justify-center w-5 h-5 rounded border-2 flex-shrink-0 transition-colors',
          checked
            ? `${borderChecked} ${bgChecked}`
            : 'border-line-strong',
        ].join(' ')}
      >
        {checked && (
          <svg
            className={`w-3.5 h-3.5 ${checkColor}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </span>
      <span className="text-ink">{label}</span>
    </label>
  )
}
