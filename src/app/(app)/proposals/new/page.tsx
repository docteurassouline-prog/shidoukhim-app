'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Heart,
  Check,
  AlertTriangle,
  User,
  Search,
} from 'lucide-react'
import { getCandidatesForProposal, checkProposalConflicts, createProposal } from '@/lib/proposals/actions'
import { computePairScore } from '@/lib/scoring/actions'
import type { CompatibilityResult } from '@/lib/scoring/types'
import ScoreDetails from '@/components/scoring/ScoreDetails'
import {
  calculateAge,
  getStatusLabel,
  getAvailabilityLabel,
  cn,
} from '@/lib/utils'
import {
  getCourantLabel,
  getCommunityEthnicLabel,
  getShabbatPracticeLabel,
} from '@/lib/constants/orthodox'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface CandidateOption {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  age_estimate: number | null
  is_age_estimate: boolean
  city: string | null
  status: string
  availability: string
  courant: string | null
  community: string | null
  profession: string | null
  shabbat_practice: string | null
  kashrut_level: string | null
  age_min: number | null
  age_max: number | null
  preferred_cities: string | null
}

interface ActiveProposal {
  id: string
  status: string
  candidate_woman_id: string
  candidate_man_id: string
}


export default function NewProposalPage() {
  const router = useRouter()
  const [women, setWomen] = useState<CandidateOption[]>([])
  const [men, setMen] = useState<CandidateOption[]>([])
  const [selectedWoman, setSelectedWoman] = useState<CandidateOption | null>(null)
  const [selectedMan, setSelectedMan] = useState<CandidateOption | null>(null)
  const [womanSearch, setWomanSearch] = useState('')
  const [manSearch, setManSearch] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loadingCandidates, setLoadingCandidates] = useState(true)
  const [conflicts, setConflicts] = useState<ActiveProposal[]>([])
  const [checkingConflicts, setCheckingConflicts] = useState(false)
  const [pairScore, setPairScore] = useState<CompatibilityResult | null>(null)
  const [loadingScore, setLoadingScore] = useState(false)

  // Load candidates
  useEffect(() => {
    async function fetchCandidates() {
      setLoadingCandidates(true)

      const { women, men } = await getCandidatesForProposal()

      setWomen(women as unknown as CandidateOption[])
      setMen(men as unknown as CandidateOption[])
      setLoadingCandidates(false)
    }

    fetchCandidates()
  }, [])

  // Check exclusivity conflicts
  useEffect(() => {
    if (!selectedWoman || !selectedMan) {
      setConflicts([])
      return
    }

    async function checkConflicts() {
      setCheckingConflicts(true)

      const data = await checkProposalConflicts(selectedWoman!.id, selectedMan!.id)

      setConflicts(data as unknown as ActiveProposal[])
      setCheckingConflicts(false)
    }

    checkConflicts()
  }, [selectedWoman, selectedMan])

  useEffect(() => {
    if (!selectedWoman || !selectedMan) {
      setPairScore(null)
      return
    }

    let cancelled = false
    setLoadingScore(true)

    computePairScore(selectedWoman.id, selectedMan.id).then((result) => {
      if (!cancelled) {
        setPairScore(result)
        setLoadingScore(false)
      }
    })

    return () => { cancelled = true }
  }, [selectedWoman, selectedMan])

  async function handleSubmit() {
    if (!selectedWoman || !selectedMan) return

    setSubmitting(true)

    const result = await createProposal({
      candidate_woman_id: selectedWoman.id,
      candidate_man_id: selectedMan.id,
      matchmaker_notes: notes || null,
    })

    if (!result.success) {
      console.error('Erreur creation proposition:', result.error)
      alert('Erreur lors de la creation. Veuillez reessayer.')
    } else if (result.id) {
      router.push(`/proposals/${result.id}`)
    }
    setSubmitting(false)
  }

  const filteredWomen = women.filter((c) => {
    if (!womanSearch) return true
    const q = womanSearch.toLowerCase()
    const name = `${c.first_name} ${c.last_name}`.toLowerCase()
    return name.includes(q) || (c.city && c.city.toLowerCase().includes(q))
  })

  const filteredMen = men.filter((c) => {
    if (!manSearch) return true
    const q = manSearch.toLowerCase()
    const name = `${c.first_name} ${c.last_name}`.toLowerCase()
    return name.includes(q) || (c.city && c.city.toLowerCase().includes(q))
  })

  function renderCandidateList(
    candidates: CandidateOption[],
    selected: CandidateOption | null,
    onSelect: (c: CandidateOption) => void,
    searchValue: string,
    onSearchChange: (v: string) => void,
    label: string,
    color: string
  ) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-ink-soft uppercase tracking-wider mb-2">
          {label}
        </h3>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-line rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage"
          />
        </div>
        <div className="max-h-64 overflow-y-auto border border-line rounded-lg divide-y divide-line">
          {candidates.length === 0 ? (
            <div className="py-6 text-center text-sm text-ink-soft">
              Aucun resultat
            </div>
          ) : (
            candidates.map((c) => {
              const isSelected = selected?.id === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 transition-colors text-sm',
                    isSelected
                      ? `${color} ring-1 ring-inset ring-current/20`
                      : 'hover:bg-stone-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-ink">
                        {c.first_name} {c.last_name}
                      </span>
                      <span className="text-ink-soft ml-2">
                        {calculateAge(c.date_of_birth, c.age_estimate, c.is_age_estimate)}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-sage" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-ink-soft">
                    {c.city && <span>{c.city}</span>}
                    {c.profession && <span>- {c.profession}</span>}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    )
  }

  function renderProfileSummary(
    candidate: CandidateOption | null,
    label: string,
    bgColor: string
  ) {
    if (!candidate) {
      return (
        <div className={`${bgColor} rounded-lg p-4 text-center`}>
          <User className="h-10 w-10 text-ink-soft/30 mx-auto mb-2" />
          <p className="text-sm text-ink-soft">
            Selectionnez {label.toLowerCase()}
          </p>
        </div>
      )
    }

    return (
      <div className={`${bgColor} rounded-lg p-4`}>
        <h4 className="text-sm font-semibold text-ink mb-3">
          {candidate.first_name} {candidate.last_name}
        </h4>
        <dl className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Age</dt>
            <dd className="font-medium text-ink">
              {calculateAge(candidate.date_of_birth, candidate.age_estimate, candidate.is_age_estimate)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Ville</dt>
            <dd className="font-medium text-ink">
              {candidate.city || 'Non renseigne'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Profession</dt>
            <dd className="font-medium text-ink">
              {candidate.profession || 'Non renseigné'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Courant</dt>
            <dd className="font-medium text-ink">
              {candidate.courant
                ? getCourantLabel(candidate.courant)
                : 'Non renseigné'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Communauté</dt>
            <dd className="font-medium text-ink">
              {candidate.community
                ? getCommunityEthnicLabel(candidate.community)
                : 'Non renseigné'}
            </dd>
          </div>
          {candidate.shabbat_practice && (
            <div className="flex justify-between">
              <dt className="text-ink-soft">Chabbat</dt>
              <dd className="font-medium text-ink">
                {getShabbatPracticeLabel(candidate.shabbat_practice)}
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-ink-soft">Disponibilite</dt>
            <dd>
              <Badge variant={candidate.availability as 'disponible'}>
                {getAvailabilityLabel(candidate.availability)}
              </Badge>
            </dd>
          </div>
        </dl>

        {/* Partner preferences */}
        <div className="mt-3 pt-3 border-t border-black/5">
          <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
            Recherche
          </p>
          <dl className="space-y-1 text-xs">
            {(candidate.age_min || candidate.age_max) && (
              <div className="flex justify-between">
                <dt className="text-ink-soft">Âge souhaité</dt>
                <dd className="font-medium text-ink">
                  {candidate.age_min || '?'} - {candidate.age_max || '?'} ans
                </dd>
              </div>
            )}
            {candidate.preferred_cities && (
              <div className="flex justify-between">
                <dt className="text-ink-soft">Villes</dt>
                <dd className="font-medium text-ink">
                  {candidate.preferred_cities}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    )
  }

  if (loadingCandidates) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/proposals"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux propositions
      </Link>

      <h1 className="text-[30px] font-semibold text-ink">
        Nouvelle proposition
      </h1>

      {/* Conflict warning */}
      {conflicts.length > 0 && (
        <div className="bg-gold-light border border-gold/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-gold-deep shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gold-deep">
              Attention : proposition(s) existante(s) detectee(s)
            </p>
            <p className="text-xs text-gold-deep mt-1">
              {conflicts.length} proposition(s) active(s) impliquant l'un de ces
              candidats. Verifiez qu'il n'y a pas de conflit d'exclusivite.
            </p>
            <div className="mt-2 space-y-1">
              {conflicts.map((c) => (
                <Link
                  key={c.id}
                  href={`/proposals/${c.id}`}
                  className="text-xs text-gold-deep underline block"
                >
                  Proposition {c.id.slice(0, 8)}... ({getStatusLabel(c.status)})
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main grid: selection + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Selection */}
        <div className="space-y-6">
          <Card>
            {renderCandidateList(
              filteredWomen,
              selectedWoman,
              setSelectedWoman,
              womanSearch,
              setWomanSearch,
              'Candidate (elle)',
              'bg-plum-light'
            )}
          </Card>

          <Card>
            {renderCandidateList(
              filteredMen,
              selectedMan,
              setSelectedMan,
              manSearch,
              setManSearch,
              'Candidat (lui)',
              'bg-plum-light'
            )}
          </Card>

          <Card>
            <Input
              label="Notes de la chadkhanit"
              inputType="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Pourquoi ce shidoukh ? Impressions, compatibilite..."
            />
          </Card>
        </div>

        {/* Right: Side-by-side preview */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-ink">
            Apercu de la proposition
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {renderProfileSummary(selectedWoman, 'une candidate', 'bg-plum-light/50')}
            {renderProfileSummary(selectedMan, 'un candidat', 'bg-plum-light/50')}
          </div>

          {/* Score de compatibilite */}
          {selectedWoman && selectedMan && (
            <Card>
              <h3 className="text-sm font-semibold text-ink-soft uppercase tracking-wider mb-3">
                Score de compatibilite
              </h3>
              {loadingScore ? (
                <div className="flex items-center gap-2 py-3">
                  <LoadingSpinner size="sm" />
                  <span className="text-xs text-ink-soft">Calcul en cours...</span>
                </div>
              ) : pairScore ? (
                <ScoreDetails result={pairScore} />
              ) : (
                <p className="text-xs text-ink-soft">Impossible de calculer le score.</p>
              )}
            </Card>
          )}

          {/* Loading conflicts */}
          {checkingConflicts && (
            <div className="flex items-center gap-2 text-xs text-ink-soft">
              <LoadingSpinner size="sm" />
              Verification des conflits...
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4">
            <Link href="/proposals">
              <Button variant="ghost">Annuler</Button>
            </Link>
            <Button
              variant="accent"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!selectedWoman || !selectedMan}
              icon={<Heart className="h-4 w-4" />}
            >
              Creer la proposition
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

