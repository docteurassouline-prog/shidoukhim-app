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
  CandidateManStatus,
  ProposalWithCandidates,
} from '@/lib/types'
import {
  calculateAge,
  formatDate,
  cn,
} from '@/lib/utils'
import {
  courantOptions,
  hassidoutOptions,
  nousahOptions,
  kipaTypeOptions,
  shabbatPracticeOptions,
  kashrutLevelOptions,
  tsnioutOptions,
  torahStudyOptions,
  communityEthnicOptions,
  childrenEducationOptions,
  getCourantLabel,
  getHassidoutLabel,
  getNousahLabel,
  getKipaTypeLabel,
  getShabbatPracticeLabel,
  getKashrutLevelLabel,
  getTsnioutLabel,
  getTorahStudyLabel,
  getCommunityEthnicLabel,
  getChildrenEducationLabel,
} from '@/lib/constants/orthodox'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

const statusOptions: { value: CandidateManStatus; label: string }[] = [
  { value: 'actif', label: 'Actif' },
  { value: 'en_pause', label: 'En pause' },
  { value: 'archive', label: 'Archivé' },
]

function getManStatusLabel(status: CandidateManStatus): string {
  const labels: Record<CandidateManStatus, string> = {
    actif: 'Actif',
    en_pause: 'En pause',
    archive: 'Archivé',
  }
  return labels[status] || status
}

function getManStatusColor(status: CandidateManStatus): string {
  const colors: Record<CandidateManStatus, string> = {
    actif: 'bg-sage-light text-sage-deep',
    en_pause: 'bg-gold-light text-gold-deep',
    archive: 'bg-stone-100 text-stone-500',
  }
  return colors[status] || 'bg-stone-100 text-stone-600'
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
    <div className="bg-surface rounded-[14px] border border-line shadow-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-line flex items-center gap-2">
        <span className="text-sage">{icon}</span>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 py-2 border-b border-line/50 last:border-0">
      <dt className="text-sm font-medium text-ink-soft">{label}</dt>
      <dd className="sm:col-span-2 text-sm text-ink">
        {editing && inputElement ? inputElement : (value || <span className="text-ink-soft/50 italic">Non renseigne</span>)}
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
    draft: 'bg-stone-100 text-stone-600',
    proposed_woman: 'bg-gold-light text-gold-deep',
    proposed_man: 'bg-gold-light text-gold-deep',
    proposed_both: 'bg-gold-light text-gold-deep',
    accepted_woman: 'bg-plum-light text-plum',
    accepted_man: 'bg-plum-light text-plum',
    accepted_both: 'bg-sage-light text-sage-deep',
    meeting_scheduled: 'bg-plum-light text-plum',
    dating: 'bg-plum-light text-plum',
    engaged: 'bg-plum-light text-plum',
    married: 'bg-plum-light text-plum',
    declined_woman: 'bg-danger-light text-danger-deep',
    declined_man: 'bg-danger-light text-danger-deep',
    declined_both: 'bg-danger-light text-danger-deep',
    cancelled: 'bg-stone-100 text-stone-500',
    on_hold: 'bg-gold-light text-gold-deep',
  }
  return colors[status] || 'bg-stone-100 text-stone-600'
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
  async function handleStatusChange(newStatus: CandidateManStatus) {
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

  // ── Cancel edit ────────────────────────────────────────────
  function handleCancelEdit() {
    if (man) setFormData(man)
    setEditing(false)
  }

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-sage mx-auto mb-3" />
          <p className="text-sm text-ink-soft">Chargement du profil...</p>
        </div>
      </div>
    )
  }

  // ── Error / not found ──────────────────────────────────────
  if (error && !man) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-danger mx-auto mb-3" />
          <h1 className="text-[24px] font-semibold text-ink mb-2">Candidat introuvable</h1>
          <p className="text-sm text-ink-soft mb-4">{error}</p>
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

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* ── Header ───────────────────────────────────────── */}
        <div className="mb-6">
          {/* Back link */}
          <Link
            href="/men"
            className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour a la liste des hommes
          </Link>

          {/* Name + badges + actions */}
          <div className="bg-surface rounded-[14px] border border-line shadow-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-[26px] font-semibold text-ink mb-1">
                  {man.first_name} {man.last_name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-ink-soft mb-3">
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
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-opacity hover:opacity-80',
                        getManStatusColor(man.status)
                      )}
                    >
                      {getManStatusLabel(man.status)}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {statusDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 bg-surface border border-line rounded-lg shadow-lg z-20 py-1 min-w-[160px]">
                        {statusOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleStatusChange(opt.value)}
                            className={cn(
                              'w-full text-left px-3 py-1.5 text-sm hover:bg-canvas transition-colors',
                              man.status === opt.value
                                ? 'font-semibold text-sage'
                                : 'text-ink'
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
              <div className="mt-3 rounded-lg bg-danger-light border border-danger/25 px-3 py-2 text-sm text-danger-deep">
                {error}
              </div>
            )}
            {saveSuccess && (
              <div className="mt-3 rounded-lg bg-sage-light border border-sage/30 px-3 py-2 text-sm text-sage-deep">
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
                    <span className="text-xs text-ink-soft whitespace-nowrap pb-2">ou</span>
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
            </dl>
          </SectionCard>

          {/* ── Contact ──────────────────────────────────── */}
          <SectionCard title="Contact" icon={<Phone className="h-4 w-4" />}>
            <dl>
              <FieldRow
                label="Telephone"
                value={
                  man.phone ? (
                    <a href={`tel:${man.phone}`} className="text-sage hover:underline">
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
                label="Email"
                value={
                  man.email ? (
                    <a href={`mailto:${man.email}`} className="text-sage hover:underline">
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
                label="WhatsApp"
                value={man.whatsapp}
                editing={editing}
                inputElement={
                  <Input
                    inputType="tel"
                    value={formData.whatsapp || ''}
                    onChange={(e) => updateField('whatsapp', e.target.value)}
                  />
                }
              />
            </dl>
          </SectionCard>

          {/* ── Vie religieuse ───────────────────────────── */}
          <SectionCard title="Vie religieuse" icon={<BookOpen className="h-4 w-4" />}>
            <dl>
              <FieldRow
                label="Courant"
                value={getCourantLabel(man.courant)}
                editing={editing}
                inputElement={
                  <Select
                    options={courantOptions}
                    value={formData.courant || ''}
                    onChange={(e) => updateField('courant', e.target.value || null)}
                  />
                }
              />
              <FieldRow
                label="Hassidout"
                value={getHassidoutLabel(man.hassidout)}
                editing={editing}
                inputElement={
                  <Select
                    options={hassidoutOptions}
                    value={formData.hassidout || ''}
                    onChange={(e) => updateField('hassidout', e.target.value || null)}
                  />
                }
              />
              <FieldRow
                label="Nousah"
                value={getNousahLabel(man.nousah)}
                editing={editing}
                inputElement={
                  <Select
                    options={nousahOptions}
                    value={formData.nousah || ''}
                    onChange={(e) => updateField('nousah', e.target.value || null)}
                  />
                }
              />
              <FieldRow
                label="Type de kipa"
                value={getKipaTypeLabel(man.kipa_type)}
                editing={editing}
                inputElement={
                  <Select
                    options={kipaTypeOptions}
                    value={formData.kipa_type || ''}
                    onChange={(e) => updateField('kipa_type', e.target.value || null)}
                  />
                }
              />
              <FieldRow
                label="Communaute"
                value={getCommunityEthnicLabel(man.community)}
                editing={editing}
                inputElement={
                  <Select
                    options={communityEthnicOptions}
                    value={formData.community || ''}
                    onChange={(e) => updateField('community', e.target.value || null)}
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
                label="Rav de reference"
                value={man.rabbi_reference}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.rabbi_reference || ''}
                    onChange={(e) => updateField('rabbi_reference', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Yechiva / Seminaire"
                value={man.school_seminary}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.school_seminary || ''}
                    onChange={(e) => updateField('school_seminary', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Pratique du Chabbat"
                value={getShabbatPracticeLabel(man.shabbat_practice)}
                editing={editing}
                inputElement={
                  <Select
                    options={shabbatPracticeOptions}
                    value={formData.shabbat_practice || ''}
                    onChange={(e) => updateField('shabbat_practice', e.target.value || null)}
                  />
                }
              />
              <FieldRow
                label="Niveau de cacheroute"
                value={getKashrutLevelLabel(man.kashrut_level)}
                editing={editing}
                inputElement={
                  <Select
                    options={kashrutLevelOptions}
                    value={formData.kashrut_level || ''}
                    onChange={(e) => updateField('kashrut_level', e.target.value || null)}
                  />
                }
              />
              <FieldRow
                label="Tsniout"
                value={getTsnioutLabel(man.tsniout)}
                editing={editing}
                inputElement={
                  <Select
                    options={tsnioutOptions}
                    value={formData.tsniout || ''}
                    onChange={(e) => updateField('tsniout', e.target.value || null)}
                  />
                }
              />
              <FieldRow
                label="Etude de Torah"
                value={getTorahStudyLabel(man.torah_study)}
                editing={editing}
                inputElement={
                  <Select
                    options={torahStudyOptions}
                    value={formData.torah_study || ''}
                    onChange={(e) => updateField('torah_study', e.target.value || null)}
                  />
                }
              />
              <FieldRow
                label="Priere"
                value={man.prayer_study}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.prayer_study || ''}
                    onChange={(e) => updateField('prayer_study', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Traditions / Minhaguim"
                value={man.traditions_minhaguim}
                editing={editing}
                inputElement={
                  <Input
                    inputType="textarea"
                    value={formData.traditions_minhaguim || ''}
                    onChange={(e) => updateField('traditions_minhaguim', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Projet de foyer religieux"
                value={man.religious_home_project}
                editing={editing}
                inputElement={
                  <Input
                    inputType="textarea"
                    value={formData.religious_home_project || ''}
                    onChange={(e) => updateField('religious_home_project', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Education des enfants"
                value={getChildrenEducationLabel(man.children_education)}
                editing={editing}
                inputElement={
                  <Select
                    options={childrenEducationOptions}
                    value={formData.children_education || ''}
                    onChange={(e) => updateField('children_education', e.target.value || null)}
                  />
                }
              />
            </dl>
          </SectionCard>

          {/* ── Famille ──────────────────────────────────── */}
          <SectionCard title="Famille" icon={<Users className="h-4 w-4" />}>
            <dl>
              <FieldRow
                label="Statut matrimonial"
                value={man.marital_status}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.marital_status || ''}
                    onChange={(e) => updateField('marital_status', e.target.value)}
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
              <FieldRow
                label="Contexte familial"
                value={man.family_context}
                editing={editing}
                inputElement={
                  <Input
                    inputType="textarea"
                    value={formData.family_context || ''}
                    onChange={(e) => updateField('family_context', e.target.value)}
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
                label="Etudes"
                value={man.studies}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.studies || ''}
                    onChange={(e) => updateField('studies', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Temperament"
                value={man.temperament}
                editing={editing}
                inputElement={
                  <Input
                    inputType="textarea"
                    value={formData.temperament || ''}
                    onChange={(e) => updateField('temperament', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Centres d'interet"
                value={man.interests}
                editing={editing}
                inputElement={
                  <Input
                    inputType="textarea"
                    value={formData.interests || ''}
                    onChange={(e) => updateField('interests', e.target.value)}
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
                  man.age_min !== null || man.age_max !== null
                    ? `${man.age_min ?? '?'} - ${man.age_max ?? '?'} ans`
                    : null
                }
                editing={editing}
                inputElement={
                  <div className="flex gap-2 items-center">
                    <Input
                      inputType="number"
                      placeholder="Min"
                      value={formData.age_min ?? ''}
                      onChange={(e) =>
                        updateField('age_min', e.target.value ? Number(e.target.value) : null)
                      }
                    />
                    <span className="text-sm text-ink-soft">a</span>
                    <Input
                      inputType="number"
                      placeholder="Max"
                      value={formData.age_max ?? ''}
                      onChange={(e) =>
                        updateField('age_max', e.target.value ? Number(e.target.value) : null)
                      }
                    />
                  </div>
                }
              />
              <FieldRow
                label="Villes souhaitees"
                value={man.preferred_cities}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.preferred_cities || ''}
                    onChange={(e) => updateField('preferred_cities', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Qualites recherchees"
                value={man.expected_qualities}
                editing={editing}
                inputElement={
                  <Input
                    inputType="textarea"
                    value={formData.expected_qualities || ''}
                    onChange={(e) => updateField('expected_qualities', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Valeurs attendues"
                value={man.expected_values}
                editing={editing}
                inputElement={
                  <Input
                    inputType="textarea"
                    value={formData.expected_values || ''}
                    onChange={(e) => updateField('expected_values', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Incompatibilites"
                value={man.incompatibilities}
                editing={editing}
                inputElement={
                  <Input
                    inputType="textarea"
                    value={formData.incompatibilities || ''}
                    onChange={(e) => updateField('incompatibilities', e.target.value)}
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
                label="Canal d'origine"
                value={man.origin_channel}
                editing={editing}
                inputElement={
                  <Input
                    value={formData.origin_channel || ''}
                    onChange={(e) => updateField('origin_channel', e.target.value)}
                  />
                }
              />
              <FieldRow
                label="Chadkhanit externe"
                value={
                  man.external_chadkhanit_name
                    ? `${man.external_chadkhanit_name}${man.external_chadkhanit_contact ? ` (${man.external_chadkhanit_contact})` : ''}`
                    : null
                }
                editing={editing}
                inputElement={
                  <div className="space-y-2">
                    <Input
                      placeholder="Nom de la chadkhanit"
                      value={formData.external_chadkhanit_name || ''}
                      onChange={(e) => updateField('external_chadkhanit_name', e.target.value)}
                    />
                    <Input
                      placeholder="Contact"
                      value={formData.external_chadkhanit_contact || ''}
                      onChange={(e) => updateField('external_chadkhanit_contact', e.target.value)}
                    />
                  </div>
                }
              />
            </dl>
          </SectionCard>

          {/* ── Metadata ─────────────────────────────────── */}
          <div className="bg-surface rounded-[14px] border border-line shadow-card px-5 py-3">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-soft">
              <span>Cree le {formatDate(man.created_at)}</span>
              <span>Mis a jour le {formatDate(man.updated_at)}</span>
            </div>
          </div>

          {/* ── Propositions liees ────────────────────────── */}
          <SectionCard title="Propositions" icon={<MessageSquare className="h-4 w-4" />}>
            {proposals.length === 0 ? (
              <p className="text-sm text-ink-soft italic py-2">
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
                      className="block rounded-lg border border-line p-3 hover:bg-canvas transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink group-hover:text-sage transition-colors">
                            {woman?.first_name} {woman?.last_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-ink-soft">
                            {woman?.age_estimate && <span>~{woman.age_estimate} ans</span>}
                            {woman?.city && (
                              <span className="inline-flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />
                                {woman.city}
                              </span>
                            )}
                          </div>
                          {proposal.matchmaker_notes && (
                            <p className="text-xs text-ink-soft mt-1 line-clamp-2">
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
                          <span className="text-xs text-ink-soft">
                            {formatDate(proposal.updated_at)}
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 text-ink-soft opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-line">
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
          <div className="sticky bottom-0 bg-canvas/95 backdrop-blur border-t border-line mt-6 -mx-4 px-4 py-3 flex justify-end gap-2">
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
      {statusDropdownOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setStatusDropdownOpen(false)}
        />
      )}
    </div>
  )
}
