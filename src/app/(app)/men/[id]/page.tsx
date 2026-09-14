'use client'

import { use, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Edit3,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Heart,
  BookOpen,
  Users,
  Briefcase,
  Ruler,
  Star,
  FileText,
  MessageSquare,
  ChevronDown,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type {
  CandidateMan,
  CandidateStatus,
  CandidateAvailability,
  ProposalWithCandidates,
} from '@/lib/types'
import {
  calculateAge,
  formatDate,
  getStatusLabel,
  getStatusColor,
  getAvailabilityLabel,
  getAvailabilityColor,
  cn,
} from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

const statusOptions: { value: CandidateStatus; label: string }[] = [
  { value: 'invitation_envoyee', label: 'Invitation envoyee' },
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'a_valider', label: 'A valider' },
  { value: 'validee', label: 'Validee' },
  { value: 'archivee', label: 'Archivee' },
]

const availabilityOptions: { value: CandidateAvailability; label: string }[] = [
  { value: 'a_confirmer', label: 'A confirmer' },
  { value: 'disponible', label: 'Disponible' },
  { value: 'en_rencontre', label: 'En rencontre' },
  { value: 'en_pause', label: 'En pause' },
  { value: 'fiancee', label: 'Fiancee' },
  { value: 'mariee', label: 'Mariee' },
]

const religiousLevelOptions = [
  { value: '', label: 'Non renseigne' },
  { value: 'very_religious', label: 'Tres pratiquant' },
  { value: 'religious', label: 'Pratiquant' },
  { value: 'traditional', label: 'Traditionnel' },
  { value: 'secular', label: 'Laique' },
  { value: 'other', label: 'Autre' },
]

const hashkafaOptions = [
  { value: '', label: 'Non renseigne' },
  { value: 'haredi_ashkenaz', label: 'Haredi Ashkenaze' },
  { value: 'haredi_sfarad', label: 'Haredi Sefarade' },
  { value: 'dati_leumi', label: 'Dati Leoumi' },
  { value: 'dati_liberal', label: 'Dati Liberal' },
  { value: 'masorti', label: 'Massorti' },
  { value: 'hiloni', label: 'Hiloni' },
  { value: 'baal_teshuva', label: 'Baal Techouva' },
  { value: 'other', label: 'Autre' },
]

const buildOptions = [
  { value: '', label: 'Non renseigne' },
  { value: 'slim', label: 'Mince' },
  { value: 'average', label: 'Moyen' },
  { value: 'athletic', label: 'Athletique' },
  { value: 'stocky', label: 'Costaud' },
  { value: 'heavy', label: 'Fort' },
]

const hairColorOptions = [
  { value: '', label: 'Non renseigne' },
  { value: 'black', label: 'Noir' },
  { value: 'brown', label: 'Brun' },
  { value: 'blond', label: 'Blond' },
  { value: 'red', label: 'Roux' },
  { value: 'gray', label: 'Gris' },
  { value: 'white', label: 'Blanc' },
  { value: 'bald', label: 'Chauve' },
]

const eyeColorOptions = [
  { value: '', label: 'Non renseigne' },
  { value: 'brown', label: 'Marron' },
  { value: 'blue', label: 'Bleu' },
  { value: 'green', label: 'Vert' },
  { value: 'hazel', label: 'Noisette' },
  { value: 'gray', label: 'Gris' },
  { value: 'black', label: 'Noir' },
]

function getReligiousLevelLabel(value: string | null): string {
  if (!value) return 'Non renseigne'
  const found = religiousLevelOptions.find((o) => o.value === value)
  return found ? found.label : value
}

function getHashkafaLabel(value: string | null): string {
  if (!value) return 'Non renseigne'
  const found = hashkafaOptions.find((o) => o.value === value)
  return found ? found.label : value
}

function getBuildLabel(value: string | null): string {
  if (!value) return 'Non renseigne'
  const found = buildOptions.find((o) => o.value === value)
  return found ? found.label : value
}

function getHairColorLabel(value: string | null): string {
  if (!value) return 'Non renseigne'
  const found = hairColorOptions.find((o) => o.value === value)
  return found ? found.label : value
}

function getEyeColorLabel(value: string | null): string {
  if (!value) return 'Non renseigne'
  const found = eyeColorOptions.find((o) => o.value === value)
  return found ? found.label : value
}

// ─── Section card wrapper ─────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E0D4] shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#E8E0D4] flex items-center gap-2">
        <span className="text-[#87A878]">{icon}</span>
        <h2 className="text-sm font-semibold text-[#2D2D2D]">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

// ─── Field row helper ─────────────────────────────────────────

function FieldRow({
  label,
  value,
  editing,
  inputElement,
}: {
  label: string
  value: React.ReactNode
  editing: boolean
  inputElement?: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 py-2 border-b border-[#E8E0D4]/50 last:border-0">
      <dt className="text-sm font-medium text-[#6B7280]">{label}</dt>
      <dd className="sm:col-span-2 text-sm text-[#2D2D2D]">
        {editing && inputElement ? inputElement : (value || <span className="text-[#6B7280]/50 italic">Non renseigne</span>)}
      </dd>
    </div>
  )
}

// ─── Proposal status label in French ──────────────────────────

function getProposalStatusLabel(status: string): string {
  const labels: Record<string, string> = {
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
    married: 'Maries',
    declined_woman: 'Refuse (elle)',
    declined_man: 'Refuse (lui)',
    declined_both: 'Refuse (les deux)',
    cancelled: 'Annule',
    on_hold: 'En pause',
  }
  return labels[status] || status
}

function getProposalStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    proposed_woman: 'bg-amber-50 text-amber-700',
    proposed_man: 'bg-amber-50 text-amber-700',
    proposed_both: 'bg-amber-50 text-amber-700',
    accepted_woman: 'bg-sky-50 text-sky-700',
    accepted_man: 'bg-sky-50 text-sky-700',
    accepted_both: 'bg-emerald-50 text-emerald-700',
    meeting_scheduled: 'bg-indigo-50 text-indigo-700',
    dating: 'bg-pink-50 text-pink-700',
    engaged: 'bg-violet-50 text-violet-700',
    married: 'bg-purple-50 text-purple-700',
    declined_woman: 'bg-red-50 text-red-600',
    declined_man: 'bg-red-50 text-red-600',
    declined_both: 'bg-red-50 text-red-600',
    cancelled: 'bg-gray-100 text-gray-500',
    on_hold: 'bg-yellow-50 text-yellow-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-600'
}

// ═══════════════════════════════════════════════════════════════
// Page component
// ═══════════════════════════════════════════════════════════════

export default function ManDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  // ── State ──────────────────────────────────────────────────
  const [man, setMan] = useState<CandidateMan | null>(null)
  const [formData, setFormData] = useState<Partial<CandidateMan>>({})
  const [proposals, setProposals] = useState<ProposalWithCandidates[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [availabilityDropdownOpen, setAvailabilityDropdownOpen] = useState(false)

  // ── Fetch man ──────────────────────────────────────────────
  const fetchMan = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('candidates_men')
      .select('*')
      .eq('id', id)
      .eq('organization_id', ORG_ID)
      .single()

    if (fetchError || !data) {
      setError(fetchError?.message || 'Candidat introuvable')
      setLoading(false)
      return
    }

    setMan(data as CandidateMan)
    setFormData(data as CandidateMan)
    setLoading(false)
  }, [id, supabase])

  // ── Fetch proposals ────────────────────────────────────────
  const fetchProposals = useCallback(async () => {
    const { data } = await supabase
      .from('proposals')
      .select(
        `
        *,
        candidate_woman:candidates!candidate_woman_id(id, first_name, last_name, age_estimate, city, status),
        candidate_man:candidates_men!candidate_man_id(id, first_name, last_name, age_estimate, city, status)
      `
      )
      .eq('candidate_man_id', id)
      .eq('organization_id', ORG_ID)
      .order('updated_at', { ascending: false })

    if (data) {
      setProposals(data as unknown as ProposalWithCandidates[])
    }
  }, [id, supabase])

  useEffect(() => {
    fetchMan()
    fetchProposals()
  }, [fetchMan, fetchProposals])

  // ── Form helpers ───────────────────────────────────────────
  function updateField(field: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function updateCustomField(field: string, value: unknown) {
    setFormData((prev) => ({
      ...prev,
      custom_fields: { ...(prev.custom_fields || {}), [field]: value },
    }))
  }

  // ── Save ───────────────────────────────────────────────────
  async function handleSave() {
    if (!man) return
    setSaving(true)
    setError(null)

    const {
      id: _id,
      organization_id: _org,
      created_by: _cb,
      created_at: _ca,
      updated_at: _ua,
      gender: _g,
      ...updateData
    } = formData as CandidateMan

    const { error: updateError } = await supabase
      .from('candidates_men')
      .update(updateData)
      .eq('id', man.id)
      .eq('organization_id', ORG_ID)

    if (updateError) {
      setError(`Erreur lors de la sauvegarde : ${updateError.message}`)
      setSaving(false)
      return
    }

    await fetchMan()
    setEditing(false)
    setSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  // ── Status change ──────────────────────────────────────────
  async function handleStatusChange(newStatus: CandidateStatus) {
    if (!man) return
    setStatusDropdownOpen(false)

    const { error: updateError } = await supabase
      .from('candidates_men')
      .update({ status: newStatus })
      .eq('id', man.id)
      .eq('organization_id', ORG_ID)

    if (updateError) {
      setError(`Erreur lors du changement de statut : ${updateError.message}`)
      return
    }

    setMan((prev) => (prev ? { ...prev, status: newStatus } : prev))
    setFormData((prev) => ({ ...prev, status: newStatus }))
  }

  // ── Availability change ────────────────────────────────────
  async function handleAvailabilityChange(newAvailability: CandidateAvailability) {
    if (!man) return
    setAvailabilityDropdownOpen(false)

    const { error: updateError } = await supabase
      .from('candidates_men')
      .update({ availability: newAvailability })
      .eq('id', man.id)
      .eq('organization_id', ORG_ID)

    if (updateError) {
      setError(`Erreur lors du changement de disponibilite : ${updateError.message}`)
      return
    }

    setMan((prev) => (prev ? { ...prev, availability: newAvailability } : prev))
    setFormData((prev) => ({ ...prev, availability: newAvailability }))
  }

  // ── Cancel edit ────────────────────────────────────────────
  function handleCancelEdit() {
    if (man) setFormData(man)
    setEditing(false)
  }

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#87A878] mx-auto mb-3" />
          <p className="text-sm text-[#6B7280]">Chargement du profil...</p>
        </div>
      </div>
    )
  }

  // ── Error / not found ──────────────────────────────────────
  if (error && !man) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-[#C45B5B] mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-[#2D2D2D] mb-2">Candidat introuvable</h1>
          <p className="text-sm text-[#6B7280] mb-4">{error}</p>
          <Link href="/men">
            <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4" />}>
              Retour a la liste
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!man) return null

  const customFields = (man.custom_fields || {}) as Record<string, string>
  const formCustomFields = (formData.custom_fields || {}) as Record<string, string>

  return (
    <div className="min-h-screen bg-[#FFFBF0]">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* ── Header ───────────────────────────────────────── */}
        <div className="mb-6">
          {/* Back link */}
          <Link
            href="/men"
            className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#2D2D2D] transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour a la liste des hommes
          </Link>

          {/* Name + badges + actions */}
          <div className="bg-white rounded-xl border border-[#E8E0D4] shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-[#2D2D2D] mb-1">
                  {man.first_name} {man.last_name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#6B7280] mb-3">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {calculateAge(man.date_of_birth, man.age_estimate, man.is_age_estimate)}
                  </span>
                  {man.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {man.city}{man.country ? `, ${man.country}` : ''}
                    </span>
                  )}
                  {man.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {man.phone}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Status with dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setStatusDropdownOpen(!statusDropdownOpen)
                        setAvailabilityDropdownOpen(false)
                      }}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-opacity hover:opacity-80',
                        getStatusColor(man.status)
                      )}
                    >
                      {getStatusLabel(man.status)}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {statusDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-[#E8E0D4] rounded-lg shadow-lg z-20 py-1 min-w-[160px]">
                        {statusOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleStatusChange(opt.value)}
                            className={cn(
                              'w-full text-left px-3 py-1.5 text-sm hover:bg-[#FFFBF0] transition-colors',
                              man.status === opt.value
                                ? 'font-semibold text-[#87A878]'
                                : 'text-[#2D2D2D]'
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Availability with dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setAvailabilityDropdownOpen(!availabilityDropdownOpen)
                        setStatusDropdownOpen(false)
                      }}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-opacity hover:opacity-80',
                        getAvailabilityColor(man.availability)
                      )}
                    >
                      {getAvailabilityLabel(man.availability)}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {availabilityDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-[#E8E0D4] rounded-lg shadow-lg z-20 py-1 min-w-[180px]">
                        {availabilityOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleAvailabilityChange(opt.value)}
                            className={cn(
                              'w-full text-left px-3 py-1.5 text-sm hover:bg-[#FFFBF0] transition-colors',
                              man.availability === opt.value
                                ? 'font-semibold text-[#87A878]'
                                : 'text-[#2D2D2D]'
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {editing ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      icon={<X className="h-4 w-4" />}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      loading={saving}
                      icon={<Save className="h-4 w-4" />}
                    >
                      Enregistrer
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditing(true)}
                      icon={<Edit3 className="h-4 w-4" />}
                    >
                      Modifier
                    </Button>
                    <Link href={`/proposals?man=${man.id}`}>
                      <Button
                        variant="accent"
                        size="sm"
                        icon={<Heart className="h-4 w-4" />}
                      >
                        Propositions
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Error / success messages */}
            {error && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {saveSuccess && (
              <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                Profil mis a jour avec succes
              </div>
            )}
          </div>
        </div>

        {/* ── Sections ─────────────────────────────────────── */}
        <div className="space-y-4">
          {/* ── Identite ─────────────────────────────────── */}
          <SectionCard title="Identite" icon={<User className="h-4 w-4" />}>
            <dl className="divide-y-0">
              <FieldRow
                label="Prenom"
                value={man.first_name}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.first_name || ''}
                    onChange={(e) => updateField('first_name', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Nom"
                value={man.last_name}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.last_name || ''}
                    onChange={(e) => updateField('last_name', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Nom hebreu"
                value={man.hebrew_name}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.hebrew_name || ''}
                    onChange={(e) => updateField('hebrew_name', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Date de naissance"
                value={
                  man.date_of_birth
                    ? `${formatDate(man.date_of_birth)} (${calculateAge(man.date_of_birth, man.age_estimate, man.is_age_estimate)})`
                    : man.age_estimate
                      ? `~${man.age_estimate} ans (estimation)`
                      : null
                }
                editing={editing}
                inputElement={
                  <div className="flex gap-2 items-end">
                    <Input
                      inputType="date"
                      value={formData.date_of_birth || ''}
                      onChange={(e) => updateField('date_of_birth', e.target.value || null)}
                    />
                    <span className="text-xs text-[#6B7280] whitespace-nowrap pb-2">ou</span>
                    <Input
                      inputType="number"
                      placeholder="Age estime"
                      value={formData.age_estimate ?? ''}
                      onChange={(e) =>
                        updateField('age_estimate', e.target.value ? Number(e.target.value) : null)
                      }
                    />
                  </div>
                }
              />
              <FieldRow
                label="Ville"
                value={man.city}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.city || ''}
                    onChange={(e) => updateField('city', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Pays"
                value={man.country}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.country || ''}
                    onChange={(e) => updateField('country', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Nationalite"
                value={man.nationality}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.nationality || ''}
                    onChange={(e) => updateField('nationality', e.target.value)}
                  />
                }
              />
            </dl>
          </SectionCard>

          {/* ── Contact ──────────────────────────────────── */}
          <SectionCard title="Contact" icon={<Phone className="h-4 w-4" />}>
            <dl>
              <FieldRow
                label="Telephone"
                value={
                  man.phone ? (
                    <a href={`tel:${man.phone}`} className="text-[#87A878] hover:underline">
                      {man.phone}
                    </a>
                  ) : null
                }
                editing={editing}
                inputElement={
                  <Input
                    inputType="tel"
                    value={formData.phone || ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Telephone secondaire"
                value={
                  man.phone_secondary ? (
                    <a href={`tel:${man.phone_secondary}`} className="text-[#87A878] hover:underline">
                      {man.phone_secondary}
                    </a>
                  ) : null
                }
                editing={editing}
                inputElement={
                  <Input
                    inputType="tel"
                    value={formData.phone_secondary || ''}
                    onChange={(e) => updateField('phone_secondary', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Email"
                value={
                  man.email ? (
                    <a href={`mailto:${man.email}`} className="text-[#87A878] hover:underline">
                      {man.email}
                    </a>
                  ) : null
                }
                editing={editing}
                inputElement={
                  <Input
                    inputType="email"
                    value={formData.email || ''}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Adresse"
                value={man.address}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.address || ''}
                    onChange={(e) => updateField('address', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="WhatsApp"
                value={customFields.whatsapp || null}
                editing={editing}
                inputElement={
                  <Input
                    inputType="tel"
                    value={formCustomFields.whatsapp || ''}
                    onChange={(e) => updateCustomField('whatsapp', e.target.value)}
                  />
                }
              />
            </dl>
          </SectionCard>

          {/* ── Vie religieuse ───────────────────────────── */}
          <SectionCard title="Vie religieuse" icon={<BookOpen className="h-4 w-4" />}>
            <dl>
              <FieldRow
                label="Niveau religieux"
                value={getReligiousLevelLabel(man.religious_level)}
                editing={editing}
                inputElement={
                  <Select
                    options={religiousLevelOptions}
                    value={formData.religious_level || ''}
                    onChange={(e) => updateField('religious_level', e.target.value || null)}
                  />
                }
              />
              <FieldRow
                label="Hashkafa"
                value={getHashkafaLabel(man.hashkafa)}
                editing={editing}
                inputElement={
                  <Select
                    options={hashkafaOptions}
                    value={formData.hashkafa || ''}
                    onChange={(e) => updateField('hashkafa', e.target.value || null)}
                  />
                }
              />
              <FieldRow
                label="Communaute"
                value={man.community}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.community || ''}
                    onChange={(e) => updateField('community', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Synagogue"
                value={man.synagogue}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.synagogue || ''}
                    onChange={(e) => updateField('synagogue', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Cohen / Levi / Israel"
                value={man.cohen_levi_israel}
                editing={editing}
                inputElement={
                  <Select
                    options={[
                      { value: '', label: 'Non renseigne' },
                      { value: 'cohen', label: 'Cohen' },
                      { value: 'levi', label: 'Levi' },
                      { value: 'israel', label: 'Israel' },
                    ]}
                    value={formData.cohen_levi_israel || ''}
                    onChange={(e) => updateField('cohen_levi_israel', e.target.value || null)}
                  />
                }
              />
              <FieldRow
                label="Yechiva"
                value={man.yeshiva}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.yeshiva || ''}
                    onChange={(e) => updateField('yeshiva', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Rythme d'etude"
                value={man.learning_schedule}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.learning_schedule || ''}
                    onChange={(e) => updateField('learning_schedule', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Chabbat"
                value={man.keeps_shabbat === null ? null : man.keeps_shabbat ? 'Oui' : 'Non'}
                editing={editing}
                inputElement={
                  <Select
                    options={[
                      { value: '', label: 'Non renseigne' },
                      { value: 'true', label: 'Oui' },
                      { value: 'false', label: 'Non' },
                    ]}
                    value={formData.keeps_shabbat === null ? '' : formData.keeps_shabbat ? 'true' : 'false'}
                    onChange={(e) =>
                      updateField('keeps_shabbat', e.target.value === '' ? null : e.target.value === 'true')
                    }
                  />
                }
              />
              <FieldRow
                label="Cacherout"
                value={man.keeps_kashrut === null ? null : man.keeps_kashrut ? 'Oui' : 'Non'}
                editing={editing}
                inputElement={
                  <Select
                    options={[
                      { value: '', label: 'Non renseigne' },
                      { value: 'true', label: 'Oui' },
                      { value: 'false', label: 'Non' },
                    ]}
                    value={formData.keeps_kashrut === null ? '' : formData.keeps_kashrut ? 'true' : 'false'}
                    onChange={(e) =>
                      updateField('keeps_kashrut', e.target.value === '' ? null : e.target.value === 'true')
                    }
                  />
                }
              />
              <FieldRow
                label="Reference Rav"
                value={customFields.rabbi_reference || null}
                editing={editing}
                inputElement={
                  <Input
                    value={formCustomFields.rabbi_reference || ''}
                    onChange={(e) => updateCustomField('rabbi_reference', e.target.value)}
                  />
                }
              />
            </dl>
          </SectionCard>

          {/* ── Famille ──────────────────────────────────── */}
          <SectionCard title="Famille" icon={<Users className="h-4 w-4" />}>
            <dl>
              <FieldRow
                label="Historique matrimonial"
                value={man.marital_history}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.marital_history || ''}
                    onChange={(e) => updateField('marital_history', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="A des enfants"
                value={man.has_children ? 'Oui' : 'Non'}
                editing={editing}
                inputElement={
                  <Select
                    options={[
                      { value: 'false', label: 'Non' },
                      { value: 'true', label: 'Oui' },
                    ]}
                    value={formData.has_children ? 'true' : 'false'}
                    onChange={(e) => updateField('has_children', e.target.value === 'true')}
                  />
                }
              />
              {(man.has_children || formData.has_children) && (
                <>
                  <FieldRow
                    label="Nombre d'enfants"
                    value={man.children_count !== null ? String(man.children_count) : null}
                    editing={editing}
                    inputElement={
                      <Input
                        inputType="number"
                        value={formData.children_count ?? ''}
                        onChange={(e) =>
                          updateField('children_count', e.target.value ? Number(e.target.value) : null)
                        }
                      />
                    }
                  />
                  <FieldRow
                    label="Details enfants"
                    value={man.children_details}
                    editing={editing}
                    inputElement={
                      <Input
                        inputType="textarea"
                        value={formData.children_details || ''}
                        onChange={(e) => updateField('children_details', e.target.value)}
                      />
                    }
                  />
                </>
              )}
              <FieldRow
                label="Nom du pere"
                value={man.father_name}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.father_name || ''}
                    onChange={(e) => updateField('father_name', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Nom de la mere"
                value={man.mother_name}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.mother_name || ''}
                    onChange={(e) => updateField('mother_name', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Nombre de freres et soeurs"
                value={man.siblings_count !== null ? String(man.siblings_count) : null}
                editing={editing}
                inputElement={
                  <Input
                    inputType="number"
                    value={formData.siblings_count ?? ''}
                    onChange={(e) =>
                      updateField('siblings_count', e.target.value ? Number(e.target.value) : null)
                    }
                  />
                }
              />
              <FieldRow
                label="Situation familiale"
                value={man.family_situation}
                editing={editing}
                inputElement={
                  <Input
                    inputType="textarea"
                    value={formData.family_situation || ''}
                    onChange={(e) => updateField('family_situation', e.target.value)}
                  />
                }
              />
            </dl>
          </SectionCard>

          {/* ── Profil ───────────────────────────────────── */}
          <SectionCard title="Profil" icon={<Briefcase className="h-4 w-4" />}>
            <dl>
              <FieldRow
                label="Profession"
                value={man.profession}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.profession || ''}
                    onChange={(e) => updateField('profession', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Niveau d'etudes"
                value={man.education_level}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.education_level || ''}
                    onChange={(e) => updateField('education_level', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Diplome"
                value={man.diploma}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.diploma || ''}
                    onChange={(e) => updateField('diploma', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Ecole / Universite"
                value={man.school}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.school || ''}
                    onChange={(e) => updateField('school', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Temperament"
                value={customFields.temperament || null}
                editing={editing}
                inputElement={
                  <Input
                    inputType="textarea"
                    value={formCustomFields.temperament || ''}
                    onChange={(e) => updateCustomField('temperament', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Centres d'interet"
                value={customFields.interests || null}
                editing={editing}
                inputElement={
                  <Input
                    inputType="textarea"
                    value={formCustomFields.interests || ''}
                    onChange={(e) => updateCustomField('interests', e.target.value)}
                  />
                }
              />
            </dl>
          </SectionCard>

          {/* ── Physique ─────────────────────────────────── */}
          <SectionCard title="Physique" icon={<Ruler className="h-4 w-4" />}>
            <dl>
              <FieldRow
                label="Taille (cm)"
                value={man.height_cm !== null ? `${man.height_cm} cm` : null}
                editing={editing}
                inputElement={
                  <Input
                    inputType="number"
                    value={formData.height_cm ?? ''}
                    onChange={(e) =>
                      updateField('height_cm', e.target.value ? Number(e.target.value) : null)
                    }
                  />
                }
              />
              <FieldRow
                label="Corpulence"
                value={getBuildLabel(man.build)}
                editing={editing}
                inputElement={
                  <Select
                    options={buildOptions}
                    value={formData.build || ''}
                    onChange={(e) => updateField('build', e.target.value || null)}
                  />
                }
              />
              <FieldRow
                label="Couleur de cheveux"
                value={getHairColorLabel(man.hair_color)}
                editing={editing}
                inputElement={
                  <Select
                    options={hairColorOptions}
                    value={formData.hair_color || ''}
                    onChange={(e) => updateField('hair_color', e.target.value || null)}
                  />
                }
              />
              <FieldRow
                label="Couleur des yeux"
                value={getEyeColorLabel(man.eye_color)}
                editing={editing}
                inputElement={
                  <Select
                    options={eyeColorOptions}
                    value={formData.eye_color || ''}
                    onChange={(e) => updateField('eye_color', e.target.value || null)}
                  />
                }
              />
              <FieldRow
                label="Description physique"
                value={man.physical_description}
                editing={editing}
                inputElement={
                  <Input
                    inputType="textarea"
                    value={formData.physical_description || ''}
                    onChange={(e) => updateField('physical_description', e.target.value)}
                  />
                }
              />
            </dl>
          </SectionCard>

          {/* ── Attentes ─────────────────────────────────── */}
          <SectionCard title="Attentes" icon={<Heart className="h-4 w-4" />}>
            <dl>
              <FieldRow
                label="Age souhaite"
                value={
                  man.preferred_age_min !== null || man.preferred_age_max !== null
                    ? `${man.preferred_age_min ?? '?'} - ${man.preferred_age_max ?? '?'} ans`
                    : null
                }
                editing={editing}
                inputElement={
                  <div className="flex gap-2 items-center">
                    <Input
                      inputType="number"
                      placeholder="Min"
                      value={formData.preferred_age_min ?? ''}
                      onChange={(e) =>
                        updateField('preferred_age_min', e.target.value ? Number(e.target.value) : null)
                      }
                    />
                    <span className="text-sm text-[#6B7280]">a</span>
                    <Input
                      inputType="number"
                      placeholder="Max"
                      value={formData.preferred_age_max ?? ''}
                      onChange={(e) =>
                        updateField('preferred_age_max', e.target.value ? Number(e.target.value) : null)
                      }
                    />
                  </div>
                }
              />
              <FieldRow
                label="Localisation souhaitee"
                value={man.preferred_location}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.preferred_location || ''}
                    onChange={(e) => updateField('preferred_location', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Niveau religieux souhaite"
                value={man.preferred_religious_level}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.preferred_religious_level || ''}
                    onChange={(e) => updateField('preferred_religious_level', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Hashkafa souhaitee"
                value={man.preferred_hashkafa}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.preferred_hashkafa || ''}
                    onChange={(e) => updateField('preferred_hashkafa', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Communaute souhaitee"
                value={man.preferred_community}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.preferred_community || ''}
                    onChange={(e) => updateField('preferred_community', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Profession souhaitee"
                value={man.preferred_profession}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.preferred_profession || ''}
                    onChange={(e) => updateField('preferred_profession', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Description du partenaire ideal"
                value={man.partner_description}
                editing={editing}
                inputElement={
                  <Input
                    inputType="textarea"
                    value={formData.partner_description || ''}
                    onChange={(e) => updateField('partner_description', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Points de blocage"
                value={man.deal_breakers}
                editing={editing}
                inputElement={
                  <Input
                    inputType="textarea"
                    value={formData.deal_breakers || ''}
                    onChange={(e) => updateField('deal_breakers', e.target.value)}
                  />
                }
              />
            </dl>
          </SectionCard>

          {/* ── Notes ────────────────────────────────────── */}
          <SectionCard title="Notes" icon={<FileText className="h-4 w-4" />}>
            <dl>
              <FieldRow
                label="Notes"
                value={man.notes ? <p className="whitespace-pre-wrap">{man.notes}</p> : null}
                editing={editing}
                inputElement={
                  <Input
                    inputType="textarea"
                    value={formData.notes || ''}
                    onChange={(e) => updateField('notes', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Notes privees"
                value={man.private_notes ? <p className="whitespace-pre-wrap">{man.private_notes}</p> : null}
                editing={editing}
                inputElement={
                  <Input
                    inputType="textarea"
                    value={formData.private_notes || ''}
                    onChange={(e) => updateField('private_notes', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Impression du Chadkhan"
                value={
                  man.matchmaker_impression ? (
                    <p className="whitespace-pre-wrap">{man.matchmaker_impression}</p>
                  ) : null
                }
                editing={editing}
                inputElement={
                  <Input
                    inputType="textarea"
                    value={formData.matchmaker_impression || ''}
                    onChange={(e) => updateField('matchmaker_impression', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Source"
                value={man.source}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.source || ''}
                    onChange={(e) => updateField('source', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Tags"
                value={
                  man.tags && man.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {man.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex rounded-full bg-[#87A878]/10 px-2 py-0.5 text-xs font-medium text-[#5A7A4A]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null
                }
                editing={editing}
                inputElement={
                  <Input
                    value={(formData.tags || []).join(', ')}
                    helperText="Separez les tags par des virgules"
                    onChange={(e) =>
                      updateField(
                        'tags',
                        e.target.value
                          .split(',')
                          .map((t: string) => t.trim())
                          .filter(Boolean)
                      )
                    }
                  />
                }
              />
            </dl>
          </SectionCard>

          {/* ── Metadata ─────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-[#E8E0D4] shadow-sm px-5 py-3">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#6B7280]">
              <span>Cree le {formatDate(man.created_at)}</span>
              <span>Mis a jour le {formatDate(man.updated_at)}</span>
              <span>Priorite : {man.priority}</span>
            </div>
          </div>

          {/* ── Propositions liees ────────────────────────── */}
          <SectionCard title="Propositions" icon={<MessageSquare className="h-4 w-4" />}>
            {proposals.length === 0 ? (
              <p className="text-sm text-[#6B7280] italic py-2">
                Aucune proposition pour ce candidat
              </p>
            ) : (
              <div className="space-y-3">
                {proposals.map((proposal) => {
                  const woman = proposal.candidate_woman
                  return (
                    <Link
                      key={proposal.id}
                      href={`/proposals/${proposal.id}`}
                      className="block rounded-lg border border-[#E8E0D4] p-3 hover:bg-[#FFFBF0] transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#2D2D2D] group-hover:text-[#87A878] transition-colors">
                            {woman?.first_name} {woman?.last_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#6B7280]">
                            {woman?.age_estimate && <span>~{woman.age_estimate} ans</span>}
                            {woman?.city && (
                              <span className="inline-flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />
                                {woman.city}
                              </span>
                            )}
                          </div>
                          {proposal.matchmaker_notes && (
                            <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">
                              {proposal.matchmaker_notes}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                              getProposalStatusColor(proposal.status)
                            )}
                          >
                            {getProposalStatusLabel(proposal.status)}
                          </span>
                          <span className="text-xs text-[#6B7280]">
                            {formatDate(proposal.updated_at)}
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 text-[#6B7280] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-[#E8E0D4]">
              <Link href={`/proposals/new?man=${man.id}`}>
                <Button variant="secondary" size="sm" icon={<Heart className="h-4 w-4" />}>
                  Creer une proposition
                </Button>
              </Link>
            </div>
          </SectionCard>
        </div>

        {/* ── Bottom actions (edit mode) ──────────────────── */}
        {editing && (
          <div className="sticky bottom-0 bg-[#FFFBF0]/95 backdrop-blur border-t border-[#E8E0D4] mt-6 -mx-4 px-4 py-3 flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={handleCancelEdit}
              icon={<X className="h-4 w-4" />}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
              icon={<Save className="h-4 w-4" />}
            >
              Enregistrer les modifications
            </Button>
          </div>
        )}
      </div>

      {/* Close dropdowns on click outside */}
      {(statusDropdownOpen || availabilityDropdownOpen) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setStatusDropdownOpen(false)
            setAvailabilityDropdownOpen(false)
          }}
        />
      )}
    </div>
  )
}
