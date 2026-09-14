'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, UserPlus } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import {
  courantOptions,
  hassidoutOptions,
  nousahOptions,
  kipaTypeOptions,
  shabbatPracticeOptions,
  kashrutLevelOptions,
  tsnioutOptions,
  torahStudyOptions,
  cohenLeviIsraelOptions,
  communityEthnicOptions,
  childrenEducationOptions,
} from '@/lib/constants/orthodox'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

const MARITAL_STATUS_OPTIONS = [
  { value: '', label: 'Choisir...' },
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'divorce', label: 'Divorcé' },
  { value: 'veuf', label: 'Veuf' },
]

const ORIGIN_CHANNEL_OPTIONS = [
  { value: '', label: 'Choisir...' },
  { value: 'bouche_a_oreille', label: 'Bouche à oreille' },
  { value: 'evenement', label: 'Événement' },
  { value: 'internet', label: 'Internet' },
  { value: 'recommandation', label: 'Recommandation' },
  { value: 'autre', label: 'Autre' },
]

interface FormData {
  first_name: string
  last_name: string
  hebrew_name: string
  date_of_birth: string
  age_estimate: string
  city: string
  country: string
  phone: string
  whatsapp: string
  email: string
  languages: string
  courant: string
  hassidout: string
  nousah: string
  kipa_type: string
  community: string
  synagogue: string
  rabbi_reference: string
  school_seminary: string
  shabbat_practice: string
  kashrut_level: string
  tsniout: string
  torah_study: string
  traditions_minhaguim: string
  prayer_study: string
  religious_home_project: string
  children_education: string
  marital_status: string
  has_children: string
  family_context: string
  profession: string
  studies: string
  interests: string
  temperament: string
  age_min: string
  age_max: string
  preferred_cities: string
  expected_qualities: string
  expected_values: string
  incompatibilities: string
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
  courant: '',
  hassidout: '',
  nousah: '',
  kipa_type: '',
  community: '',
  synagogue: '',
  rabbi_reference: '',
  school_seminary: '',
  shabbat_practice: '',
  kashrut_level: '',
  tsniout: '',
  torah_study: '',
  traditions_minhaguim: '',
  prayer_study: '',
  religious_home_project: '',
  children_education: '',
  marital_status: '',
  has_children: 'false',
  family_context: '',
  profession: '',
  studies: '',
  interests: '',
  temperament: '',
  age_min: '',
  age_max: '',
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
    if (!form.first_name.trim()) newErrors.first_name = 'Le prénom est requis'
    if (!form.last_name.trim()) newErrors.last_name = 'Le nom est requis'
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

      const hasDateOfBirth = !!form.date_of_birth
      const ageEstimate = form.age_estimate ? parseInt(form.age_estimate, 10) : null

      const insertData = {
        organization_id: ORG_ID,
        status: 'actif' as const,

        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        hebrew_name: form.hebrew_name.trim() || null,
        date_of_birth: hasDateOfBirth ? form.date_of_birth : null,
        age_estimate: !hasDateOfBirth && ageEstimate ? ageEstimate : null,
        is_age_estimate: !hasDateOfBirth && !!ageEstimate,
        city: form.city.trim() || null,
        country: form.country.trim() || null,

        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,

        courant: form.courant || null,
        hassidout: form.hassidout || null,
        nousah: form.nousah || null,
        kipa_type: form.kipa_type || null,
        community: form.community || null,
        synagogue: form.synagogue.trim() || null,
        rabbi_reference: form.rabbi_reference.trim() || null,
        school_seminary: form.school_seminary.trim() || null,
        shabbat_practice: form.shabbat_practice || null,
        kashrut_level: form.kashrut_level || null,
        tsniout: form.tsniout || null,
        torah_study: form.torah_study.trim() || null,
        traditions_minhaguim: form.traditions_minhaguim.trim() || null,
        prayer_study: form.prayer_study.trim() || null,
        religious_home_project: form.religious_home_project.trim() || null,
        children_education: form.children_education || null,

        marital_status: form.marital_status || null,
        has_children: form.has_children === 'true',
        family_context: form.family_context.trim() || null,

        profession: form.profession.trim() || null,
        studies: form.studies.trim() || null,
        interests: form.interests.trim() || null,
        temperament: form.temperament.trim() || null,

        age_min: form.age_min ? parseInt(form.age_min, 10) : null,
        age_max: form.age_max ? parseInt(form.age_max, 10) : null,
        preferred_cities: form.preferred_cities.trim() || null,
        expected_qualities: form.expected_qualities.trim() || null,
        expected_values: form.expected_values.trim() || null,
        incompatibilities: form.incompatibilities.trim() || null,

        external_chadkhanit_name: form.external_chadkhanit_name.trim() || null,
        external_chadkhanit_contact: form.external_chadkhanit_contact.trim() || null,
        origin_channel: form.origin_channel || null,
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
        err instanceof Error ? err.message : 'Une erreur est survenue lors de la création du profil.'
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
              Remplissez les informations du candidat. Les champs marqués * sont obligatoires.
            </p>
          </div>
        </div>

        {submitError && (
          <div className="mb-6 rounded-lg border border-[#C45B5B]/30 bg-[#C45B5B]/5 p-4">
            <p className="text-sm text-[#C45B5B]">{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="rounded-xl border border-[#E8E0D4] bg-white p-6 shadow-sm sm:p-8">
            {/* ── Identité ── */}
            <SectionHeading title="Identité & Contact" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Prénom *"
                value={form.first_name}
                onChange={(e) => updateField('first_name', e.currentTarget.value)}
                error={errors.first_name}
                placeholder="Prénom du candidat"
              />
              <Input
                label="Nom *"
                value={form.last_name}
                onChange={(e) => updateField('last_name', e.currentTarget.value)}
                error={errors.last_name}
                placeholder="Nom de famille"
              />
              <Input
                label="Nom hébraïque"
                value={form.hebrew_name}
                onChange={(e) => updateField('hebrew_name', e.currentTarget.value)}
                placeholder="Ex : Moshé ben David"
              />
              <Input
                label="Date de naissance"
                inputType="date"
                value={form.date_of_birth}
                onChange={(e) => updateField('date_of_birth', e.currentTarget.value)}
              />
              <Input
                label="Âge estimé"
                inputType="number"
                value={form.age_estimate}
                onChange={(e) => updateField('age_estimate', e.currentTarget.value)}
                placeholder="Si date de naissance inconnue"
              />
              <Input
                label="Ville"
                value={form.city}
                onChange={(e) => updateField('city', e.currentTarget.value)}
                placeholder="Paris"
              />
              <Input
                label="Pays"
                value={form.country}
                onChange={(e) => updateField('country', e.currentTarget.value)}
              />
              <Input
                label="Téléphone"
                inputType="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.currentTarget.value)}
                placeholder="+33 6 ..."
              />
              <Input
                label="WhatsApp"
                value={form.whatsapp}
                onChange={(e) => updateField('whatsapp', e.currentTarget.value)}
                placeholder="Si différent du téléphone"
              />
              <Input
                label="Email"
                inputType="email"
                value={form.email}
                onChange={(e) => updateField('email', e.currentTarget.value)}
                placeholder="email@exemple.com"
              />
            </div>

            {/* ── Vie religieuse ── */}
            <SectionHeading title="Vie religieuse" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Courant religieux"
                options={courantOptions}
                value={form.courant}
                onChange={(e) => updateField('courant', e.currentTarget.value)}
              />
              {form.courant === 'haredi_hassidique' && (
                <Select
                  label="Hassidout"
                  options={hassidoutOptions}
                  value={form.hassidout}
                  onChange={(e) => updateField('hassidout', e.currentTarget.value)}
                />
              )}
              <Select
                label="Nousah (rite de prière)"
                options={nousahOptions}
                value={form.nousah}
                onChange={(e) => updateField('nousah', e.currentTarget.value)}
              />
              <Select
                label="Type de kipa"
                options={kipaTypeOptions}
                value={form.kipa_type}
                onChange={(e) => updateField('kipa_type', e.currentTarget.value)}
              />
              <Select
                label="Communauté d'origine"
                options={communityEthnicOptions}
                value={form.community}
                onChange={(e) => updateField('community', e.currentTarget.value)}
              />
              <Input
                label="Synagogue"
                value={form.synagogue}
                onChange={(e) => updateField('synagogue', e.currentTarget.value)}
                placeholder="Nom de la synagogue"
              />
              <Input
                label="Référence rabbinique"
                value={form.rabbi_reference}
                onChange={(e) => updateField('rabbi_reference', e.currentTarget.value)}
                placeholder="Nom du Rav de référence"
              />
              <Input
                label="Yeshiva / École juive"
                value={form.school_seminary}
                onChange={(e) => updateField('school_seminary', e.currentTarget.value)}
                placeholder="Yeshiva, Kolel, école..."
              />
              <Select
                label="Chabbat"
                options={shabbatPracticeOptions}
                value={form.shabbat_practice}
                onChange={(e) => updateField('shabbat_practice', e.currentTarget.value)}
              />
              <Select
                label="Cacheroute"
                options={kashrutLevelOptions}
                value={form.kashrut_level}
                onChange={(e) => updateField('kashrut_level', e.currentTarget.value)}
              />
              <Select
                label="Tsniout"
                options={tsnioutOptions}
                value={form.tsniout}
                onChange={(e) => updateField('tsniout', e.currentTarget.value)}
              />
              <div /> {/* spacer */}
              <div className="sm:col-span-2">
                <Input
                  label="Étude de Torah"
                  inputType="textarea"
                  value={form.torah_study}
                  onChange={(e) => updateField('torah_study', e.currentTarget.value)}
                  placeholder="Rythme d'étude, seder, Daf Yomi..."
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Traditions et Minhaguim"
                  inputType="textarea"
                  value={form.traditions_minhaguim}
                  onChange={(e) => updateField('traditions_minhaguim', e.currentTarget.value)}
                  placeholder="Kitniyot à Pessah, deuxième jour de fête, minhaguim spécifiques..."
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Prière / Pratique"
                  inputType="textarea"
                  value={form.prayer_study}
                  onChange={(e) => updateField('prayer_study', e.currentTarget.value)}
                  placeholder="Offices quotidiens, minyan, pratiques..."
                />
              </div>
            </div>

            {/* ── Situation personnelle ── */}
            <SectionHeading title="Situation personnelle" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Situation matrimoniale"
                value={form.marital_status}
                onChange={(e) => updateField('marital_status', e.currentTarget.value)}
                options={MARITAL_STATUS_OPTIONS}
              />
              <Select
                label="A des enfants"
                options={[
                  { value: 'false', label: 'Non' },
                  { value: 'true', label: 'Oui' },
                ]}
                value={form.has_children}
                onChange={(e) => updateField('has_children', e.currentTarget.value)}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Contexte familial"
                  inputType="textarea"
                  value={form.family_context}
                  onChange={(e) => updateField('family_context', e.currentTarget.value)}
                  placeholder="Situation familiale, fratrie, contexte particulier..."
                />
              </div>
            </div>

            {/* ── Parcours ── */}
            <SectionHeading title="Parcours & Personnalité" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Profession"
                value={form.profession}
                onChange={(e) => updateField('profession', e.currentTarget.value)}
                placeholder="Ingénieur, enseignant..."
              />
              <Input
                label="Études"
                value={form.studies}
                onChange={(e) => updateField('studies', e.currentTarget.value)}
                placeholder="Master, Semicha, Kolel..."
              />
              <div className="sm:col-span-2">
                <Input
                  label="Centres d'intérêt"
                  inputType="textarea"
                  value={form.interests}
                  onChange={(e) => updateField('interests', e.currentTarget.value)}
                  placeholder="Hobbies, passions, activités..."
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Tempérament / Personnalité"
                  inputType="textarea"
                  value={form.temperament}
                  onChange={(e) => updateField('temperament', e.currentTarget.value)}
                  placeholder="Traits de caractère, personnalité..."
                />
              </div>
            </div>

            {/* ── Attentes ── */}
            <SectionHeading title="Attentes" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Âge minimum souhaité"
                inputType="number"
                value={form.age_min}
                onChange={(e) => updateField('age_min', e.currentTarget.value)}
                placeholder="22"
              />
              <Input
                label="Âge maximum souhaité"
                inputType="number"
                value={form.age_max}
                onChange={(e) => updateField('age_max', e.currentTarget.value)}
                placeholder="30"
              />
              <Input
                label="Villes préférées"
                value={form.preferred_cities}
                onChange={(e) => updateField('preferred_cities', e.currentTarget.value)}
                placeholder="Paris, Jérusalem, Bnei Brak..."
                className="sm:col-span-2"
              />
              <div className="sm:col-span-2">
                <Input
                  label="Projet religieux du foyer"
                  inputType="textarea"
                  value={form.religious_home_project}
                  onChange={(e) => updateField('religious_home_project', e.currentTarget.value)}
                  placeholder="Foyer Torah, mixte étude-travail..."
                />
              </div>
              <Select
                label="Éducation des enfants souhaitée"
                options={childrenEducationOptions}
                value={form.children_education}
                onChange={(e) => updateField('children_education', e.currentTarget.value)}
              />
              <div /> {/* spacer */}
              <div className="sm:col-span-2">
                <Input
                  label="Qualités recherchées"
                  inputType="textarea"
                  value={form.expected_qualities}
                  onChange={(e) => updateField('expected_qualities', e.currentTarget.value)}
                  placeholder="Qualités souhaitées chez la partenaire..."
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Valeurs attendues"
                  inputType="textarea"
                  value={form.expected_values}
                  onChange={(e) => updateField('expected_values', e.currentTarget.value)}
                  placeholder="Valeurs essentielles..."
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Points rédhibitoires"
                  inputType="textarea"
                  value={form.incompatibilities}
                  onChange={(e) => updateField('incompatibilities', e.currentTarget.value)}
                  placeholder="Ce qu'il ne souhaite absolument pas..."
                />
              </div>
            </div>

            {/* ── Informations complémentaires ── */}
            <SectionHeading title="Informations complémentaires" />
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
                placeholder="Téléphone ou email"
              />
              <Select
                label="Canal d'origine"
                value={form.origin_channel}
                onChange={(e) => updateField('origin_channel', e.currentTarget.value)}
                options={ORIGIN_CHANNEL_OPTIONS}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Notes"
                  inputType="textarea"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.currentTarget.value)}
                  placeholder="Remarques supplémentaires..."
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
