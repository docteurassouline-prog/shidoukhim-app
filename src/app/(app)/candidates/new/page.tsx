'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Save,
  X,
  User,
  Users,
  BookOpen,
  Sparkles,
  Heart,
  ClipboardCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'
import {
  courantOptions,
  hassidoutOptions,
  nousahOptions,
  headCoveringOptions,
  shabbatPracticeOptions,
  kashrutLevelOptions,
  tsnioutOptions,
  cohenLeviIsraelOptions,
  communityEthnicOptions,
  childrenEducationOptions,
} from '@/lib/constants/orthodox'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

const STEPS = [
  { key: 'identity', label: 'Identité & Contact', icon: User },
  { key: 'family', label: 'Famille', icon: Users },
  { key: 'religion', label: 'Vie religieuse', icon: BookOpen },
  { key: 'personality', label: 'Personnalité & Parcours', icon: Sparkles },
  { key: 'expectations', label: 'Attentes', icon: Heart },
  { key: 'review', label: 'Vérification', icon: ClipboardCheck },
]

interface FormData {
  // Identité
  first_name: string
  last_name: string
  hebrew_name: string
  date_of_birth: string
  age_estimate: string
  phone: string
  whatsapp: string
  email: string
  city: string
  country: string

  // Famille
  siblings: string
  family_context: string
  family_traditions: string
  marital_status: string
  has_children: string
  children_details: string

  // Vie religieuse
  courant: string
  hassidout: string
  nousah: string
  community: string
  synagogue: string
  rabbi_reference: string
  school_seminary: string
  shabbat_practice: string
  kashrut_level: string
  tsniout: string
  head_covering: string
  traditions_minhaguim: string
  prayer_study: string

  // Parcours
  studies: string
  profession: string
  interests: string
  temperament: string
  personal_note: string

  // Attentes
  age_min: string
  age_max: string
  preferred_cities: string
  religious_project: string
  children_education: string
  expected_values: string
  expected_qualities: string
  incompatibilities: string
  ideal_husband: string

  // Méta
  origin_channel: string
  notes: string
}

const initialFormData: FormData = {
  first_name: '',
  last_name: '',
  hebrew_name: '',
  date_of_birth: '',
  age_estimate: '',
  phone: '',
  whatsapp: '',
  email: '',
  city: '',
  country: 'France',
  siblings: '',
  family_context: '',
  family_traditions: '',
  marital_status: '',
  has_children: 'false',
  children_details: '',
  courant: '',
  hassidout: '',
  nousah: '',
  community: '',
  synagogue: '',
  rabbi_reference: '',
  school_seminary: '',
  shabbat_practice: '',
  kashrut_level: '',
  tsniout: '',
  head_covering: '',
  traditions_minhaguim: '',
  prayer_study: '',
  studies: '',
  profession: '',
  interests: '',
  temperament: '',
  personal_note: '',
  age_min: '',
  age_max: '',
  preferred_cities: '',
  religious_project: '',
  children_education: '',
  expected_values: '',
  expected_qualities: '',
  incompatibilities: '',
  ideal_husband: '',
  origin_channel: '',
  notes: '',
}

export default function NewCandidatePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)

  function updateField(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function validateCurrentStep(): boolean {
    const newErrors: Record<string, string> = {}

    if (currentStep === 0) {
      if (!formData.first_name.trim()) {
        newErrors.first_name = 'Le prenom est obligatoire'
      }
      if (!formData.last_name.trim()) {
        newErrors.last_name = 'Le nom est obligatoire'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function goNext() {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
    }
  }

  function goBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  function buildCandidatePayload() {
    const hasDateOfBirth = !!formData.date_of_birth
    const ageEstimate = formData.age_estimate ? parseInt(formData.age_estimate, 10) : null

    return {
      organization_id: ORG_ID,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      hebrew_name: formData.hebrew_name || null,
      date_of_birth: hasDateOfBirth ? formData.date_of_birth : null,
      age_estimate: !hasDateOfBirth && ageEstimate ? ageEstimate : null,
      is_age_estimate: !hasDateOfBirth && !!ageEstimate,
      phone: formData.phone || null,
      whatsapp: formData.whatsapp || null,
      email: formData.email || null,
      city: formData.city || null,
      country: formData.country || null,
      siblings: formData.siblings || null,
      family_context: formData.family_context || null,
      family_traditions: formData.family_traditions || null,
      marital_status: formData.marital_status || null,
      has_children: formData.has_children === 'true',
      children_details: formData.children_details || null,
      courant: formData.courant || null,
      hassidout: formData.hassidout || null,
      nousah: formData.nousah || null,
      community: formData.community || null,
      synagogue: formData.synagogue || null,
      rabbi_reference: formData.rabbi_reference || null,
      school_seminary: formData.school_seminary || null,
      shabbat_practice: formData.shabbat_practice || null,
      kashrut_level: formData.kashrut_level || null,
      tsniout: formData.tsniout || null,
      head_covering: formData.head_covering || null,
      traditions_minhaguim: formData.traditions_minhaguim || null,
      prayer_study: formData.prayer_study || null,
      studies: formData.studies || null,
      profession: formData.profession || null,
      interests: formData.interests || null,
      temperament: formData.temperament || null,
      personal_note: formData.personal_note || null,
      age_min: formData.age_min ? parseInt(formData.age_min, 10) : null,
      age_max: formData.age_max ? parseInt(formData.age_max, 10) : null,
      preferred_cities: formData.preferred_cities || null,
      religious_project: formData.religious_project || null,
      children_education: formData.children_education || null,
      expected_values: formData.expected_values || null,
      expected_qualities: formData.expected_qualities || null,
      incompatibilities: formData.incompatibilities || null,
      ideal_husband: formData.ideal_husband || null,
      origin_channel: formData.origin_channel || null,
      notes: formData.notes || null,
    }
  }

  async function handleSaveDraft() {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setErrors({
        first_name: !formData.first_name.trim() ? 'Le prenom est obligatoire' : '',
        last_name: !formData.last_name.trim() ? 'Le nom est obligatoire' : '',
      })
      setCurrentStep(0)
      return
    }

    setSavingDraft(true)
    const supabase = createClient()

    const payload = {
      ...buildCandidatePayload(),
      status: 'brouillon' as const,
      availability: 'a_confirmer' as const,
    }

    const { data, error } = await supabase
      .from('candidates')
      .insert(payload)
      .select('id')
      .single()

    if (error) {
      console.error('Erreur sauvegarde brouillon:', error)
      alert('Erreur lors de la sauvegarde. Veuillez reessayer.')
    } else if (data) {
      router.push(`/candidates/${data.id}`)
    }
    setSavingDraft(false)
  }

  async function handleSubmit() {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setErrors({
        first_name: !formData.first_name.trim() ? 'Le prenom est obligatoire' : '',
        last_name: !formData.last_name.trim() ? 'Le nom est obligatoire' : '',
      })
      setCurrentStep(0)
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    const payload = {
      ...buildCandidatePayload(),
      status: 'a_valider' as const,
      availability: 'a_confirmer' as const,
    }

    const { data, error } = await supabase
      .from('candidates')
      .insert(payload)
      .select('id')
      .single()

    if (error) {
      console.error('Erreur creation candidate:', error)
      alert('Erreur lors de la creation. Veuillez reessayer.')
    } else if (data) {
      // Create assignment for current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('auth_user_id', user.id)
          .eq('organization_id', ORG_ID)
          .single()

        if (profile) {
          await supabase.from('candidate_assignments').insert({
            candidate_id: data.id,
            candidate_type: 'woman',
            user_id: profile.id,
            is_primary: true,
          })
        }
      }

      router.push(`/candidates/${data.id}`)
    }
    setSubmitting(false)
  }

  // =============== Step renderers ===============

  function renderStep0() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Prénom *"
          value={formData.first_name}
          onChange={(e) => updateField('first_name', e.target.value)}
          error={errors.first_name}
          placeholder="Prénom"
        />
        <Input
          label="Nom *"
          value={formData.last_name}
          onChange={(e) => updateField('last_name', e.target.value)}
          error={errors.last_name}
          placeholder="Nom de famille"
        />
        <Input
          label="Nom hébraïque"
          value={formData.hebrew_name}
          onChange={(e) => updateField('hebrew_name', e.target.value)}
          placeholder="Ex : Sarah bat Avraham"
        />
        <Input
          label="Date de naissance"
          inputType="date"
          value={formData.date_of_birth}
          onChange={(e) => updateField('date_of_birth', e.target.value)}
        />
        <Input
          label="Âge estimé"
          inputType="number"
          value={formData.age_estimate}
          onChange={(e) => updateField('age_estimate', e.target.value)}
          placeholder="Si date de naissance inconnue"
        />
        <Input
          label="Téléphone"
          inputType="tel"
          value={formData.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          placeholder="+33 6 ..."
        />
        <Input
          label="WhatsApp"
          value={formData.whatsapp}
          onChange={(e) => updateField('whatsapp', e.target.value)}
          placeholder="Si différent du téléphone"
        />
        <Input
          label="Email"
          inputType="email"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          placeholder="email@exemple.com"
        />
        <Input
          label="Ville"
          value={formData.city}
          onChange={(e) => updateField('city', e.target.value)}
          placeholder="Paris"
        />
        <Input
          label="Pays"
          value={formData.country}
          onChange={(e) => updateField('country', e.target.value)}
        />
      </div>
    )
  }

  function renderStep1() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Situation matrimoniale"
          options={[
            { value: '', label: 'Choisir...' },
            { value: 'celibataire', label: 'Célibataire' },
            { value: 'divorcee', label: 'Divorcée' },
            { value: 'veuve', label: 'Veuve' },
          ]}
          value={formData.marital_status}
          onChange={(e) => updateField('marital_status', e.target.value)}
        />
        <Select
          label="A des enfants"
          options={[
            { value: 'false', label: 'Non' },
            { value: 'true', label: 'Oui' },
          ]}
          value={formData.has_children}
          onChange={(e) => updateField('has_children', e.target.value)}
        />
        {formData.has_children === 'true' && (
          <div className="sm:col-span-2">
            <Input
              label="Détails enfants"
              inputType="textarea"
              value={formData.children_details}
              onChange={(e) => updateField('children_details', e.target.value)}
              placeholder="Nombre, âges, garde..."
            />
          </div>
        )}
        <div className="sm:col-span-2">
          <Input
            label="Fratrie"
            inputType="textarea"
            value={formData.siblings}
            onChange={(e) => updateField('siblings', e.target.value)}
            placeholder="Frère aîné 30 ans marié, sœur 25 ans..."
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Contexte familial"
            inputType="textarea"
            value={formData.family_context}
            onChange={(e) => updateField('family_context', e.target.value)}
            placeholder="Parents mariés, divorcés, composition familiale..."
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Traditions familiales"
            inputType="textarea"
            value={formData.family_traditions}
            onChange={(e) => updateField('family_traditions', e.target.value)}
            placeholder="Traditions, minhaguim familiaux..."
          />
        </div>
      </div>
    )
  }

  function renderStep2() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Courant religieux"
          options={courantOptions}
          value={formData.courant}
          onChange={(e) => updateField('courant', e.target.value)}
        />
        {formData.courant === 'haredi_hassidique' && (
          <Select
            label="Hassidout"
            options={hassidoutOptions}
            value={formData.hassidout}
            onChange={(e) => updateField('hassidout', e.target.value)}
          />
        )}
        <Select
          label="Nousah (rite de prière)"
          options={nousahOptions}
          value={formData.nousah}
          onChange={(e) => updateField('nousah', e.target.value)}
        />
        <Select
          label="Communauté d'origine"
          options={communityEthnicOptions}
          value={formData.community}
          onChange={(e) => updateField('community', e.target.value)}
        />
        <Input
          label="Synagogue"
          value={formData.synagogue}
          onChange={(e) => updateField('synagogue', e.target.value)}
          placeholder="Nom de la synagogue"
        />
        <Input
          label="Référence rabbinique"
          value={formData.rabbi_reference}
          onChange={(e) => updateField('rabbi_reference', e.target.value)}
          placeholder="Nom du Rav de référence"
        />
        <Input
          label="Séminaire / École juive"
          value={formData.school_seminary}
          onChange={(e) => updateField('school_seminary', e.target.value)}
          placeholder="Beth Yaakov, Séminaire..."
        />
        <Select
          label="Chabbat"
          options={shabbatPracticeOptions}
          value={formData.shabbat_practice}
          onChange={(e) => updateField('shabbat_practice', e.target.value)}
        />
        <Select
          label="Cacheroute"
          options={kashrutLevelOptions}
          value={formData.kashrut_level}
          onChange={(e) => updateField('kashrut_level', e.target.value)}
        />
        <Select
          label="Tsniout (pudeur vestimentaire)"
          options={tsnioutOptions}
          value={formData.tsniout}
          onChange={(e) => updateField('tsniout', e.target.value)}
        />
        <Select
          label="Couverture de cheveux"
          options={headCoveringOptions}
          value={formData.head_covering}
          onChange={(e) => updateField('head_covering', e.target.value)}
        />
        <div className="sm:col-span-2">
          <Input
            label="Traditions et Minhaguim particuliers"
            inputType="textarea"
            value={formData.traditions_minhaguim}
            onChange={(e) => updateField('traditions_minhaguim', e.target.value)}
            placeholder="Kitniyot à Pessah, deuxième jour de fête, minhaguim spécifiques..."
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Étude / Prière"
            inputType="textarea"
            value={formData.prayer_study}
            onChange={(e) => updateField('prayer_study', e.target.value)}
            placeholder="Cours de Torah, Tehilim, participation aux offices..."
          />
        </div>
      </div>
    )
  }

  function renderStep3() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Études"
          value={formData.studies}
          onChange={(e) => updateField('studies', e.target.value)}
          placeholder="Bac+5, Licence, Séminaire..."
        />
        <Input
          label="Profession"
          value={formData.profession}
          onChange={(e) => updateField('profession', e.target.value)}
          placeholder="Avocate, enseignante..."
        />
        <div className="sm:col-span-2">
          <Input
            label="Centres d'intérêt"
            inputType="textarea"
            value={formData.interests}
            onChange={(e) => updateField('interests', e.target.value)}
            placeholder="Hobbies, passions, activités..."
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Tempérament / Personnalité"
            inputType="textarea"
            value={formData.temperament}
            onChange={(e) => updateField('temperament', e.target.value)}
            placeholder="Traits de caractère, personnalité..."
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Note personnelle"
            inputType="textarea"
            value={formData.personal_note}
            onChange={(e) => updateField('personal_note', e.target.value)}
            placeholder="Ce qu'elle souhaite ajouter, mot personnel..."
          />
        </div>
      </div>
    )
  }

  function renderStep4() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Âge minimum souhaité"
          inputType="number"
          value={formData.age_min}
          onChange={(e) => updateField('age_min', e.target.value)}
          placeholder="22"
        />
        <Input
          label="Âge maximum souhaité"
          inputType="number"
          value={formData.age_max}
          onChange={(e) => updateField('age_max', e.target.value)}
          placeholder="35"
        />
        <Input
          label="Villes préférées"
          value={formData.preferred_cities}
          onChange={(e) => updateField('preferred_cities', e.target.value)}
          placeholder="Paris, Jérusalem, Bnei Brak..."
        />
        <div /> {/* spacer */}
        <div className="sm:col-span-2">
          <Input
            label="Projet religieux du foyer"
            inputType="textarea"
            value={formData.religious_project}
            onChange={(e) => updateField('religious_project', e.target.value)}
            placeholder="Foyer Torah, mixte étude-travail, ouvert..."
          />
        </div>
        <Select
          label="Éducation des enfants souhaitée"
          options={childrenEducationOptions}
          value={formData.children_education}
          onChange={(e) => updateField('children_education', e.target.value)}
        />
        <div /> {/* spacer */}
        <div className="sm:col-span-2">
          <Input
            label="Qualités recherchées"
            inputType="textarea"
            value={formData.expected_qualities}
            onChange={(e) => updateField('expected_qualities', e.target.value)}
            placeholder="Qualités souhaitées chez le partenaire..."
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Valeurs attendues"
            inputType="textarea"
            value={formData.expected_values}
            onChange={(e) => updateField('expected_values', e.target.value)}
            placeholder="Valeurs essentielles pour la vie de couple..."
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Description du mari idéal"
            inputType="textarea"
            value={formData.ideal_husband}
            onChange={(e) => updateField('ideal_husband', e.target.value)}
            placeholder="Description libre du profil recherché..."
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Points rédhibitoires"
            inputType="textarea"
            value={formData.incompatibilities}
            onChange={(e) => updateField('incompatibilities', e.target.value)}
            placeholder="Ce qu'elle ne souhaite absolument pas..."
          />
        </div>
      </div>
    )
  }

  function renderStep5() {
    const nr = 'Non renseigné'
    const summaryFields: Array<{ section: string; items: Array<{ label: string; value: string }> }> = [
      {
        section: 'Identité',
        items: [
          { label: 'Nom', value: `${formData.first_name} ${formData.last_name}` },
          { label: 'Date de naissance', value: formData.date_of_birth || nr },
          { label: 'Téléphone', value: formData.phone || nr },
          { label: 'Ville', value: formData.city || nr },
        ],
      },
      {
        section: 'Famille',
        items: [
          { label: 'Situation', value: formData.marital_status || nr },
          { label: 'Enfants', value: formData.has_children === 'true' ? 'Oui' : 'Non' },
          { label: 'Fratrie', value: formData.siblings || nr },
        ],
      },
      {
        section: 'Vie religieuse',
        items: [
          { label: 'Courant', value: formData.courant ? courantOptions.find(o => o.value === formData.courant)?.label ?? formData.courant : nr },
          { label: 'Communauté', value: formData.community ? communityEthnicOptions.find(o => o.value === formData.community)?.label ?? formData.community : nr },
          { label: 'Chabbat', value: formData.shabbat_practice ? shabbatPracticeOptions.find(o => o.value === formData.shabbat_practice)?.label ?? formData.shabbat_practice : nr },
          { label: 'Cacheroute', value: formData.kashrut_level ? kashrutLevelOptions.find(o => o.value === formData.kashrut_level)?.label ?? formData.kashrut_level : nr },
        ],
      },
      {
        section: 'Parcours',
        items: [
          { label: 'Profession', value: formData.profession || nr },
          { label: 'Études', value: formData.studies || nr },
        ],
      },
      {
        section: 'Attentes',
        items: [
          { label: "Tranche d'âge", value: formData.age_min || formData.age_max ? `${formData.age_min || '?'} – ${formData.age_max || '?'} ans` : nr },
          { label: 'Villes', value: formData.preferred_cities || nr },
        ],
      },
    ]

    return (
      <div className="space-y-6">
        <div className="bg-sage/5 rounded-lg p-4 border border-sage/20">
          <p className="text-sm text-sage-deep font-medium">
            Vérifiez les informations avant de soumettre la fiche.
          </p>
        </div>

        {summaryFields.map((section) => (
          <div key={section.section}>
            <h3 className="text-sm font-semibold text-ink-soft uppercase tracking-wider mb-2">
              {section.section}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {section.items.map((item) => (
                <div key={item.label} className="py-1.5">
                  <span className="text-xs text-ink-soft">{item.label}</span>
                  <p className={`text-sm ${item.value === nr ? 'text-ink-soft/50 italic' : 'text-ink'}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Retour */}
      <Link
        href="/candidates"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour a la liste
      </Link>

      <h1 className="text-[30px] font-semibold text-ink">Nouvelle fiche candidate</h1>

      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => {
          const StepIcon = step.icon
          const isActive = i === currentStep
          const isCompleted = i < currentStep

          return (
            <div key={step.key} className="flex items-center flex-1">
              <button
                onClick={() => {
                  if (i < currentStep || (i === currentStep + 1 && validateCurrentStep())) {
                    setCurrentStep(i)
                  }
                }}
                className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-plum'
                    : isCompleted
                      ? 'text-sage'
                      : 'text-ink-soft/50'
                }`}
                title={step.label}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm font-medium ${
                    isActive
                      ? 'bg-plum text-white'
                      : isCompleted
                        ? 'bg-sage text-white'
                        : 'bg-stone-100 text-ink-soft'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                </div>
                <span className="hidden lg:inline">{step.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 rounded ${
                    isCompleted ? 'bg-sage' : 'bg-stone-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <Card>
        <div className="mb-4">
          <h2 className="font-display text-[22px] font-semibold text-ink">
            {STEPS[currentStep].label}
          </h2>
        </div>
        {stepRenderers[currentStep]()}
      </Card>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button
              variant="secondary"
              onClick={goBack}
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Precedent
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handleSaveDraft}
            loading={savingDraft}
            icon={<Save className="h-4 w-4" />}
          >
            Enregistrer brouillon
          </Button>
        </div>

        <div className="flex gap-2">
          <Link href="/candidates">
            <Button variant="ghost" icon={<X className="h-4 w-4" />}>
              Annuler
            </Button>
          </Link>
          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={goNext}
              iconRight={<ArrowRight className="h-4 w-4" />}
            >
              Suivant
            </Button>
          ) : (
            <Button
              variant="accent"
              onClick={handleSubmit}
              loading={submitting}
              icon={<Check className="h-4 w-4" />}
            >
              Creer la fiche
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
