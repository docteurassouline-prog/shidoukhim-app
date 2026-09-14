'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, UserPlus } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

const MARITAL_STATUS_OPTIONS = [
  { value: 'celibataire', label: 'Celibataire' },
  { value: 'divorce', label: 'Divorce' },
  { value: 'veuf', label: 'Veuf' },
]

const ORIGIN_CHANNEL_OPTIONS = [
  { value: 'bouche_a_oreille', label: 'Bouche a oreille' },
  { value: 'evenement', label: 'Evenement' },
  { value: 'internet', label: 'Internet' },
  { value: 'recommandation', label: 'Recommandation' },
  { value: 'autre', label: 'Autre' },
]

interface FormData {
  // Identite
  first_name: string
  last_name: string
  hebrew_name: string
  date_of_birth: string
  age_estimate: string
  city: string
  country: string

  // Contact
  phone: string
  whatsapp: string
  email: string

  // Vie religieuse
  languages: string
  community: string
  rabbi_reference: string
  torah_study: string

  // Situation personnelle
  marital_status: string
  has_children: boolean
  family_context: string

  // Profil
  profession: string
  studies: string
  interests: string
  temperament: string

  // Attentes
  preferred_age_min: string
  preferred_age_max: string
  preferred_cities: string
  expected_qualities: string
  expected_values: string
  incompatibilities: string

  // Informations complementaires
  external_chadkhanit_name: string
  external_chadkhanit_contact: string
  origin_channel: string
  notes: string
}

const initialFormData: FormData = {
  first_name: '',
  last_name: '',
  hebrew_name: '',
  date_of_birth: '',
  age_estimate: '',
  city: '',
  country: '',
  phone: '',
  whatsapp: '',
  email: '',
  languages: '',
  community: '',
  rabbi_reference: '',
  torah_study: '',
  marital_status: '',
  has_children: false,
  family_context: '',
  profession: '',
  studies: '',
  interests: '',
  temperament: '',
  preferred_age_min: '',
  preferred_age_max: '',
  preferred_cities: '',
  expected_qualities: '',
  expected_values: '',
  incompatibilities: '',
  external_chadkhanit_name: '',
  external_chadkhanit_contact: '',
  origin_channel: '',
  notes: '',
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="mb-4 mt-8 first:mt-0">
      <h2 className="text-lg font-semibold text-[#6B3A5B]">{title}</h2>
      <div className="mt-1 h-px bg-[#E8E0D4]" />
    </div>
  )
}

export default function NewManPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!form.first_name.trim()) {
      newErrors.first_name = 'Le prenom est requis'
    }
    if (!form.last_name.trim()) {
      newErrors.last_name = 'Le nom est requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (!validate()) return

    setLoading(true)

    try {
      const supabase = createClient()

      // Build partner_description from expected_qualities + expected_values
      const partnerParts: string[] = []
      if (form.expected_qualities.trim()) {
        partnerParts.push(`Qualites recherchees : ${form.expected_qualities.trim()}`)
      }
      if (form.expected_values.trim()) {
        partnerParts.push(`Valeurs attendues : ${form.expected_values.trim()}`)
      }
      const partnerDescription = partnerParts.length > 0 ? partnerParts.join('\n\n') : null

      // Build custom_fields
      const customFields: Record<string, unknown> = {}
      if (form.languages.trim()) customFields.languages = form.languages.trim()
      if (form.rabbi_reference.trim()) customFields.rabbi_reference = form.rabbi_reference.trim()
      if (form.interests.trim()) customFields.interests = form.interests.trim()
      if (form.temperament.trim()) customFields.temperament = form.temperament.trim()
      if (form.external_chadkhanit_name.trim()) {
        customFields.external_chadkhanit_name = form.external_chadkhanit_name.trim()
      }
      if (form.external_chadkhanit_contact.trim()) {
        customFields.external_chadkhanit_contact = form.external_chadkhanit_contact.trim()
      }
      if (form.whatsapp.trim()) customFields.whatsapp = form.whatsapp.trim()
      if (form.studies.trim()) customFields.studies = form.studies.trim()

      // Determine age fields
      const hasDateOfBirth = !!form.date_of_birth
      const ageEstimate = form.age_estimate ? parseInt(form.age_estimate, 10) : null

      const insertData = {
        organization_id: ORG_ID,
        gender: 'male' as const,
        status: 'active' as const,
        availability: 'available' as const,
        priority: 0,
        has_children: form.has_children,
        tags: [],
        custom_fields: customFields,

        // Identite
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        hebrew_name: form.hebrew_name.trim() || null,
        date_of_birth: hasDateOfBirth ? form.date_of_birth : null,
        age_estimate: !hasDateOfBirth && ageEstimate ? ageEstimate : null,
        is_age_estimate: !hasDateOfBirth && !!ageEstimate,
        city: form.city.trim() || null,
        country: form.country.trim() || null,

        // Contact
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,

        // Religion & communaute
        community: form.community.trim() || null,
        yeshiva: form.torah_study.trim() || null,

        // Situation personnelle
        marital_history: form.marital_status || null,
        family_situation: form.family_context.trim() || null,

        // Profil
        profession: form.profession.trim() || null,

        // Attentes
        preferred_age_min: form.preferred_age_min ? parseInt(form.preferred_age_min, 10) : null,
        preferred_age_max: form.preferred_age_max ? parseInt(form.preferred_age_max, 10) : null,
        preferred_location: form.preferred_cities.trim() || null,
        partner_description: partnerDescription,
        deal_breakers: form.incompatibilities.trim() || null,

        // Metadata
        source: form.origin_channel || null,
        notes: form.notes.trim() || null,
      }

      const { error } = await supabase
        .from('candidates_men')
        .insert(insertData)

      if (error) {
        setSubmitError(error.message)
        return
      }

      router.push('/men')
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Une erreur est survenue lors de la creation du profil.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFBF0]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/men"
            className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#2D2D2D] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </div>

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#87A878]/10">
            <UserPlus className="h-5 w-5 text-[#87A878]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2D2D2D]">Nouveau profil homme</h1>
            <p className="text-sm text-[#6B7280]">
              Remplissez les informations du candidat. Les champs marques * sont obligatoires.
            </p>
          </div>
        </div>

        {/* Error banner */}
        {submitError && (
          <div className="mb-6 rounded-lg border border-[#C45B5B]/30 bg-[#C45B5B]/5 p-4">
            <p className="text-sm text-[#C45B5B]">{submitError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="rounded-xl border border-[#E8E0D4] bg-white p-6 shadow-sm sm:p-8">
            {/* ── Identite ── */}
            <SectionHeading title="Identite" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Prenom *"
                value={form.first_name}
                onChange={(e) => updateField('first_name', e.currentTarget.value)}
                error={errors.first_name}
                placeholder="Prenom du candidat"
              />
              <Input
                label="Nom *"
                value={form.last_name}
                onChange={(e) => updateField('last_name', e.currentTarget.value)}
                error={errors.last_name}
                placeholder="Nom de famille"
              />
              <Input
                label="Nom hebreu"
                value={form.hebrew_name}
                onChange={(e) => updateField('hebrew_name', e.currentTarget.value)}
                placeholder="Ex : Moshe ben David"
              />
              <Input
                label="Date de naissance"
                inputType="date"
                value={form.date_of_birth}
                onChange={(e) => updateField('date_of_birth', e.currentTarget.value)}
                helperText="Ou renseignez un age estime ci-dessous"
              />
              <Input
                label="Age estime"
                inputType="number"
                value={form.age_estimate}
                onChange={(e) => updateField('age_estimate', e.currentTarget.value)}
                placeholder="Ex : 28"
                min={18}
                max={120}
                helperText="Si la date de naissance n'est pas connue"
              />
              <Input
                label="Ville"
                value={form.city}
                onChange={(e) => updateField('city', e.currentTarget.value)}
                placeholder="Ex : Paris"
              />
              <Input
                label="Pays"
                value={form.country}
                onChange={(e) => updateField('country', e.currentTarget.value)}
                placeholder="Ex : France"
              />
            </div>

            {/* ── Contact ── */}
            <SectionHeading title="Contact" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Telephone"
                inputType="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.currentTarget.value)}
                placeholder="+33 6 00 00 00 00"
              />
              <Input
                label="WhatsApp"
                value={form.whatsapp}
                onChange={(e) => updateField('whatsapp', e.currentTarget.value)}
                placeholder="Numero WhatsApp si different"
              />
              <Input
                label="Email"
                inputType="email"
                value={form.email}
                onChange={(e) => updateField('email', e.currentTarget.value)}
                placeholder="email@exemple.com"
                className="sm:col-span-2"
              />
            </div>

            {/* ── Vie religieuse ── */}
            <SectionHeading title="Vie religieuse" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Langues parlees"
                value={form.languages}
                onChange={(e) => updateField('languages', e.currentTarget.value)}
                placeholder="Ex : Francais, Hebreu, Anglais"
              />
              <Input
                label="Communaute"
                value={form.community}
                onChange={(e) => updateField('community', e.currentTarget.value)}
                placeholder="Ex : Sfarade, Ashkenaze, Mixte"
              />
              <Input
                label="Reference rabbinique"
                value={form.rabbi_reference}
                onChange={(e) => updateField('rabbi_reference', e.currentTarget.value)}
                placeholder="Nom du Rav de reference"
              />
              <Input
                label="Etude de Torah / Yeshiva"
                value={form.torah_study}
                onChange={(e) => updateField('torah_study', e.currentTarget.value)}
                placeholder="Yeshiva frequentee, rythme d'etude"
              />
            </div>

            {/* ── Situation personnelle ── */}
            <SectionHeading title="Situation personnelle" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Situation matrimoniale"
                value={form.marital_status}
                onChange={(e) => updateField('marital_status', e.currentTarget.value)}
                options={MARITAL_STATUS_OPTIONS}
                placeholder="Selectionnez..."
              />
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.has_children}
                    onChange={(e) => updateField('has_children', e.target.checked)}
                    className="h-4 w-4 rounded border-[#E8E0D4] text-[#87A878] focus:ring-[#87A878]"
                  />
                  <span className="text-sm font-medium text-[#2D2D2D]">A des enfants</span>
                </label>
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Contexte familial"
                  inputType="textarea"
                  value={form.family_context}
                  onChange={(e) => updateField('family_context', e.currentTarget.value)}
                  placeholder="Informations sur la situation familiale, contexte particulier..."
                />
              </div>
            </div>

            {/* ── Profil ── */}
            <SectionHeading title="Profil" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Profession"
                value={form.profession}
                onChange={(e) => updateField('profession', e.currentTarget.value)}
                placeholder="Ex : Ingenieur, Enseignant, Commercial"
              />
              <Input
                label="Etudes"
                value={form.studies}
                onChange={(e) => updateField('studies', e.currentTarget.value)}
                placeholder="Ex : Master Informatique, Semicha"
              />
              <div className="sm:col-span-2">
                <Input
                  label="Centres d'interet"
                  inputType="textarea"
                  value={form.interests}
                  onChange={(e) => updateField('interests', e.currentTarget.value)}
                  placeholder="Hobbies, passions, activites..."
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Temperament / Personnalite"
                  inputType="textarea"
                  value={form.temperament}
                  onChange={(e) => updateField('temperament', e.currentTarget.value)}
                  placeholder="Description du caractere, traits de personnalite..."
                />
              </div>
            </div>

            {/* ── Attentes ── */}
            <SectionHeading title="Attentes" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Age minimum recherche"
                inputType="number"
                value={form.preferred_age_min}
                onChange={(e) => updateField('preferred_age_min', e.currentTarget.value)}
                placeholder="Ex : 22"
                min={18}
                max={120}
              />
              <Input
                label="Age maximum recherche"
                inputType="number"
                value={form.preferred_age_max}
                onChange={(e) => updateField('preferred_age_max', e.currentTarget.value)}
                placeholder="Ex : 30"
                min={18}
                max={120}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Villes preferees"
                  value={form.preferred_cities}
                  onChange={(e) => updateField('preferred_cities', e.currentTarget.value)}
                  placeholder="Ex : Paris, Lyon, Jerusalem"
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Qualites recherchees"
                  inputType="textarea"
                  value={form.expected_qualities}
                  onChange={(e) => updateField('expected_qualities', e.currentTarget.value)}
                  placeholder="Qualites souhaitees chez la partenaire..."
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Valeurs attendues"
                  inputType="textarea"
                  value={form.expected_values}
                  onChange={(e) => updateField('expected_values', e.currentTarget.value)}
                  placeholder="Valeurs importantes pour la vie de couple..."
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Incompatibilites / Points redhibitoires"
                  inputType="textarea"
                  value={form.incompatibilities}
                  onChange={(e) => updateField('incompatibilities', e.currentTarget.value)}
                  placeholder="Ce que le candidat ne souhaite absolument pas..."
                />
              </div>
            </div>

            {/* ── Informations complementaires ── */}
            <SectionHeading title="Informations complementaires" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nom de la chadkhanit externe"
                value={form.external_chadkhanit_name}
                onChange={(e) => updateField('external_chadkhanit_name', e.currentTarget.value)}
                placeholder="Si suivi par une autre chadkhanit"
              />
              <Input
                label="Contact de la chadkhanit externe"
                value={form.external_chadkhanit_contact}
                onChange={(e) => updateField('external_chadkhanit_contact', e.currentTarget.value)}
                placeholder="Telephone ou email"
              />
              <Select
                label="Canal d'origine"
                value={form.origin_channel}
                onChange={(e) => updateField('origin_channel', e.currentTarget.value)}
                options={ORIGIN_CHANNEL_OPTIONS}
                placeholder="Comment a-t-il connu le service ?"
              />
              <div className="sm:col-span-2">
                <Input
                  label="Notes"
                  inputType="textarea"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.currentTarget.value)}
                  placeholder="Remarques supplementaires, contexte, informations utiles..."
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link href="/men">
              <Button type="button" variant="secondary">
                Annuler
              </Button>
            </Link>
            <Button
              type="submit"
              loading={loading}
              icon={<Save className="h-4 w-4" />}
            >
              Enregistrer le profil
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
