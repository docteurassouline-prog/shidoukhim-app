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
import { createClient } from '@/lib/supabase/client'
import {
  calculateAge,
  getStatusLabel,
  getAvailabilityLabel,
  cn,
} from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

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
  religious_level: string | null
  hashkafa: string | null
  community: string | null
  profession: string | null
  height_cm: number | null
  preferred_age_min: number | null
  preferred_age_max: number | null
  preferred_religious_level: string | null
  preferred_hashkafa: string | null
  preferred_location: string | null
}

interface ActiveProposal {
  id: string
  status: string
  candidate_woman_id: string
  candidate_man_id: string
}

const religiousLevelLabels: Record<string, string> = {
  tres_pratiquant: 'Tres pratiquant(e)',
  pratiquant: 'Pratiquant(e)',
  traditionnel: 'Traditionnel(le)',
  liberal: 'Liberal(e)',
  autre: 'Autre',
}

const hashkafaLabels: Record<string, string> = {
  haredi_ashkenaz: 'Haredi Ashkenaze',
  haredi_sfarad: 'Haredi Sefarade',
  dati_leumi: 'Dati Leoumi',
  dati_liberal: 'Dati Liberal',
  masorti: 'Massorti',
  hiloni: 'Hiloni',
  baal_teshuva: 'Baal Techouva',
  autre: 'Autre',
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

  // Load candidates
  useEffect(() => {
    async function fetchCandidates() {
      setLoadingCandidates(true)
      const supabase = createClient()

      const selectFields = `
        id, first_name, last_name, date_of_birth, age_estimate, is_age_estimate,
        city, status, availability, religious_level, hashkafa, community,
        profession, height_cm, preferred_age_min, preferred_age_max,
        preferred_religious_level, preferred_hashkafa, preferred_location
      `

      const [womenRes, menRes] = await Promise.all([
        supabase
          .from('candidates')
          .select(selectFields)
          .eq('organization_id', ORG_ID)
          .in('status', ['validee', 'a_valider'])
          .order('last_name', { ascending: true }),
        supabase
          .from('candidates_man')
          .select(selectFields)
          .eq('organization_id', ORG_ID)
          .in('status', ['validee', 'a_valider'])
          .order('last_name', { ascending: true }),
      ])

      setWomen((womenRes.data ?? []) as CandidateOption[])
      setMen((menRes.data ?? []) as CandidateOption[])
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
      const supabase = createClient()

      // Check for active proposals involving either candidate
      const { data } = await supabase
        .from('proposals')
        .select('id, status, candidate_woman_id, candidate_man_id')
        .eq('organization_id', ORG_ID)
        .not('status', 'in', '("refusee","interrompue","aboutie")')
        .or(
          `candidate_woman_id.eq.${selectedWoman!.id},candidate_man_id.eq.${selectedMan!.id}`
        )

      setConflicts((data ?? []) as ActiveProposal[])
      setCheckingConflicts(false)
    }

    checkConflicts()
  }, [selectedWoman, selectedMan])

  async function handleSubmit() {
    if (!selectedWoman || !selectedMan) return

    setSubmitting(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('proposals')
      .insert({
        organization_id: ORG_ID,
        candidate_woman_id: selectedWoman.id,
        candidate_man_id: selectedMan.id,
        status: 'envisagee' as const,
        matchmaker_notes: notes || null,
        priority: 0,
        tags: [],
      })
      .select('id')
      .single()

    if (error) {
      console.error('Erreur creation proposition:', error)
      alert('Erreur lors de la creation. Veuillez reessayer.')
    } else if (data) {
      router.push(`/proposals/${data.id}`)
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
        <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
          {label}
        </h3>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#E8E0D4] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#87A878]/50 focus:border-[#87A878]"
          />
        </div>
        <div className="max-h-64 overflow-y-auto border border-[#E8E0D4] rounded-lg divide-y divide-[#E8E0D4]">
          {candidates.length === 0 ? (
            <div className="py-6 text-center text-sm text-[#6B7280]">
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
                      : 'hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-[#2D2D2D]">
                        {c.first_name} {c.last_name}
                      </span>
                      <span className="text-[#6B7280] ml-2">
                        {calculateAge(c.date_of_birth, c.age_estimate, c.is_age_estimate)}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-[#87A878]" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-[#6B7280]">
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
          <User className="h-10 w-10 text-[#6B7280]/30 mx-auto mb-2" />
          <p className="text-sm text-[#6B7280]">
            Selectionnez {label.toLowerCase()}
          </p>
        </div>
      )
    }

    return (
      <div className={`${bgColor} rounded-lg p-4`}>
        <h4 className="text-sm font-semibold text-[#2D2D2D] mb-3">
          {candidate.first_name} {candidate.last_name}
        </h4>
        <dl className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <dt className="text-[#6B7280]">Age</dt>
            <dd className="font-medium text-[#2D2D2D]">
              {calculateAge(candidate.date_of_birth, candidate.age_estimate, candidate.is_age_estimate)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#6B7280]">Ville</dt>
            <dd className="font-medium text-[#2D2D2D]">
              {candidate.city || 'Non renseigne'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#6B7280]">Taille</dt>
            <dd className="font-medium text-[#2D2D2D]">
              {candidate.height_cm ? `${candidate.height_cm} cm` : 'Non renseigne'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#6B7280]">Profession</dt>
            <dd className="font-medium text-[#2D2D2D]">
              {candidate.profession || 'Non renseigne'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#6B7280]">Niveau religieux</dt>
            <dd className="font-medium text-[#2D2D2D]">
              {candidate.religious_level
                ? religiousLevelLabels[candidate.religious_level] || candidate.religious_level
                : 'Non renseigne'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#6B7280]">Hashkafa</dt>
            <dd className="font-medium text-[#2D2D2D]">
              {candidate.hashkafa
                ? hashkafaLabels[candidate.hashkafa] || candidate.hashkafa
                : 'Non renseigne'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#6B7280]">Communaute</dt>
            <dd className="font-medium text-[#2D2D2D]">
              {candidate.community || 'Non renseigne'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#6B7280]">Disponibilite</dt>
            <dd>
              <Badge variant={candidate.availability as 'disponible'}>
                {getAvailabilityLabel(candidate.availability)}
              </Badge>
            </dd>
          </div>
        </dl>

        {/* Partner preferences */}
        <div className="mt-3 pt-3 border-t border-black/5">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">
            Recherche
          </p>
          <dl className="space-y-1 text-xs">
            {(candidate.preferred_age_min || candidate.preferred_age_max) && (
              <div className="flex justify-between">
                <dt className="text-[#6B7280]">Age souhaite</dt>
                <dd className="font-medium text-[#2D2D2D]">
                  {candidate.preferred_age_min || '?'} - {candidate.preferred_age_max || '?'} ans
                </dd>
              </div>
            )}
            {candidate.preferred_religious_level && (
              <div className="flex justify-between">
                <dt className="text-[#6B7280]">Niveau religieux</dt>
                <dd className="font-medium text-[#2D2D2D]">
                  {religiousLevelLabels[candidate.preferred_religious_level] || candidate.preferred_religious_level}
                </dd>
              </div>
            )}
            {candidate.preferred_hashkafa && (
              <div className="flex justify-between">
                <dt className="text-[#6B7280]">Hashkafa</dt>
                <dd className="font-medium text-[#2D2D2D]">
                  {hashkafaLabels[candidate.preferred_hashkafa] || candidate.preferred_hashkafa}
                </dd>
              </div>
            )}
            {candidate.preferred_location && (
              <div className="flex justify-between">
                <dt className="text-[#6B7280]">Lieu</dt>
                <dd className="font-medium text-[#2D2D2D]">
                  {candidate.preferred_location}
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
        className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#2D2D2D] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux propositions
      </Link>

      <h1 className="text-2xl font-bold text-[#2D2D2D]">
        Nouvelle proposition
      </h1>

      {/* Conflict warning */}
      {conflicts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Attention : proposition(s) existante(s) detectee(s)
            </p>
            <p className="text-xs text-amber-700 mt-1">
              {conflicts.length} proposition(s) active(s) impliquant l'un de ces
              candidats. Verifiez qu'il n'y a pas de conflit d'exclusivite.
            </p>
            <div className="mt-2 space-y-1">
              {conflicts.map((c) => (
                <Link
                  key={c.id}
                  href={`/proposals/${c.id}`}
                  className="text-xs text-amber-700 underline block"
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
              'bg-pink-50'
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
              'bg-blue-50'
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
          <h2 className="text-base font-semibold text-[#2D2D2D]">
            Apercu de la proposition
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {renderProfileSummary(selectedWoman, 'une candidate', 'bg-pink-50/50')}
            {renderProfileSummary(selectedMan, 'un candidat', 'bg-blue-50/50')}
          </div>

          {/* Compatibility summary */}
          {selectedWoman && selectedMan && (
            <Card>
              <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-3">
                Points de compatibilite
              </h3>
              <div className="space-y-2 text-xs">
                {/* Religious level match */}
                <CompatRow
                  label="Niveau religieux"
                  womanValue={selectedWoman.religious_level ? religiousLevelLabels[selectedWoman.religious_level] || selectedWoman.religious_level : null}
                  manValue={selectedMan.religious_level ? religiousLevelLabels[selectedMan.religious_level] || selectedMan.religious_level : null}
                  match={selectedWoman.religious_level === selectedMan.religious_level}
                />
                {/* Hashkafa match */}
                <CompatRow
                  label="Hashkafa"
                  womanValue={selectedWoman.hashkafa ? hashkafaLabels[selectedWoman.hashkafa] || selectedWoman.hashkafa : null}
                  manValue={selectedMan.hashkafa ? hashkafaLabels[selectedMan.hashkafa] || selectedMan.hashkafa : null}
                  match={selectedWoman.hashkafa === selectedMan.hashkafa}
                />
                {/* Community match */}
                <CompatRow
                  label="Communaute"
                  womanValue={selectedWoman.community}
                  manValue={selectedMan.community}
                  match={
                    !!selectedWoman.community &&
                    !!selectedMan.community &&
                    selectedWoman.community.toLowerCase() === selectedMan.community.toLowerCase()
                  }
                />
                {/* Location match */}
                <CompatRow
                  label="Ville"
                  womanValue={selectedWoman.city}
                  manValue={selectedMan.city}
                  match={
                    !!selectedWoman.city &&
                    !!selectedMan.city &&
                    selectedWoman.city.toLowerCase() === selectedMan.city.toLowerCase()
                  }
                />
              </div>
            </Card>
          )}

          {/* Loading conflicts */}
          {checkingConflicts && (
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
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

function CompatRow({
  label,
  womanValue,
  manValue,
  match,
}: {
  label: string
  womanValue: string | null
  manValue: string | null
  match: boolean
}) {
  const bothFilled = !!womanValue && !!manValue

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'h-2 w-2 rounded-full shrink-0',
          !bothFilled ? 'bg-gray-300' : match ? 'bg-green-500' : 'bg-orange-400'
        )}
      />
      <span className="text-[#6B7280] w-28 shrink-0">{label}</span>
      <span className="text-[#2D2D2D] flex-1 truncate">
        {womanValue || '-'}
      </span>
      <span className="text-[#6B7280] mx-1">/</span>
      <span className="text-[#2D2D2D] flex-1 truncate">
        {manValue || '-'}
      </span>
    </div>
  )
}
