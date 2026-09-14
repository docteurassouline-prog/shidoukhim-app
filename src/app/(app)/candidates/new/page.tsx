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

const ORG_ID = '00000000-0000-0000-0000-000000000001'

const STEPS = [
  { key: 'identity', label: 'Identite & Contact', icon: User },
  { key: 'family', label: 'Famille', icon: Users },
  { key: 'religion', label: 'Vie religieuse', icon: BookOpen },
  { key: 'personality', label: 'Personnalite & Valeurs', icon: Sparkles },
  { key: 'expectations', label: 'Attentes', icon: Heart },
  { key: 'review', label: 'Verification', icon: ClipboardCheck },
]

const religiousLevelOptions = [
  { value: '', label: 'Choisir...' },
  { value: 'tres_pratiquant', label: 'Tres pratiquant(e)' },
  { value: 'pratiquant', label: 'Pratiquant(e)' },
  { value: 'traditionnel', label: 'Traditionnel(le)' },
  { value: 'liberal', label: 'Liberal(e)' },
  { value: 'autre', label: 'Autre' },
]

const hashkafaOptions = [
  { value: '', label: 'Choisir...' },
  { value: 'haredi_ashkenaz', label: 'Haredi Ashkenaze' },
  { value: 'haredi_sfarad', label: 'Haredi Sefarade' },
  { value: 'dati_leumi', label: 'Dati Leoumi' },
  { value: 'dati_liberal', label: 'Dati Liberal' },
  { value: 'masorti', label: 'Massorti' },
  { value: 'hiloni', label: 'Hiloni' },
  { value: 'baal_teshuva', label: 'Baal Techouva' },
  { value: 'autre', label: 'Autre' },
]

interface FormData {
  // Identity
  first_name: string
  last_name: string
  hebrew_name: string
  maiden_name: string
  date_of_birth: string
  nationality: string
  country_of_origin: string
  phone: string
  phone_secondary: string
  email: string
  address: string
  city: string
  postal_code: string
  country: string
  height_cm: string
  build: string
  hair_color: string
  eye_color: string

  // Family
  father_name: string
  father_profession: string
  father_origin: string
  mother_name: string
  mother_maiden_name: string
  mother_profession: string
  mother_origin: string
  siblings_count: string
  siblings_details: string
  family_situation: string

  // Religion
  religious_level: string
  hashkafa: string
  community: string
  synagogue: string
  cohen_levi_israel: string
  keeps_shabbat: string
  keeps_kashrut: string

  // Personality
  education_level: string
  school: string
  diploma: string
  profession: string
  employer: string
  marital_history: string
  has_children: string
  children_count: string
  notes: string
  matchmaker_impression: string

  // Expectations
  preferred_age_min: string
  preferred_age_max: string
  preferred_height_min: string
  preferred_height_max: string
  preferred_religious_level: string
  preferred_hashkafa: string
  preferred_community: string
  preferred_location: string
  preferred_profession: string
  deal_breakers: string
  partner_description: string
}

const initialFormData: FormData = {
  first_name: '',
  last_name: '',
  hebrew_name: '',
  maiden_name: '',
  date_of_birth: '',
  nationality: '',
  country_of_origin: '',
  phone: '',
  phone_secondary: '',
  email: '',
  address: '',
  city: '',
  postal_code: '',
  country: 'France',
  height_cm: '',
  build: '',
  hair_color: '',
  eye_color: '',
  father_name: '',
  father_profession: '',
  father_origin: '',
  mother_name: '',
  mother_maiden_name: '',
  mother_profession: '',
  mother_origin: '',
  siblings_count: '',
  siblings_details: '',
  family_situation: '',
  religious_level: '',
  hashkafa: '',
  community: '',
  synagogue: '',
  cohen_levi_israel: '',
  keeps_shabbat: '',
  keeps_kashrut: '',
  education_level: '',
  school: '',
  diploma: '',
  profession: '',
  employer: '',
  marital_history: '',
  has_children: 'false',
  children_count: '',
  notes: '',
  matchmaker_impression: '',
  preferred_age_min: '',
  preferred_age_max: '',
  preferred_height_min: '',
  preferred_height_max: '',
  preferred_religious_level: '',
  preferred_hashkafa: '',
  preferred_community: '',
  preferred_location: '',
  preferred_profession: '',
  deal_breakers: '',
  partner_description: '',
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
    return {
      organization_id: ORG_ID,
      gender: 'female' as const,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      hebrew_name: formData.hebrew_name || null,
      maiden_name: formData.maiden_name || null,
      date_of_birth: formData.date_of_birth || null,
      age_estimate: null,
      is_age_estimate: false,
      nationality: formData.nationality || null,
      country_of_origin: formData.country_of_origin || null,
      phone: formData.phone || null,
      phone_secondary: formData.phone_secondary || null,
      email: formData.email || null,
      address: formData.address || null,
      city: formData.city || null,
      postal_code: formData.postal_code || null,
      country: formData.country || null,
      height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
      build: formData.build || null,
      hair_color: formData.hair_color || null,
      eye_color: formData.eye_color || null,
      physical_description: null,
      religious_level: formData.religious_level || null,
      hashkafa: formData.hashkafa || null,
      community: formData.community || null,
      synagogue: formData.synagogue || null,
      cohen_levi_israel: formData.cohen_levi_israel || null,
      keeps_shabbat: formData.keeps_shabbat === 'true' ? true : formData.keeps_shabbat === 'false' ? false : null,
      keeps_kashrut: formData.keeps_kashrut === 'true' ? true : formData.keeps_kashrut === 'false' ? false : null,
      father_name: formData.father_name || null,
      father_profession: formData.father_profession || null,
      father_origin: formData.father_origin || null,
      mother_name: formData.mother_name || null,
      mother_maiden_name: formData.mother_maiden_name || null,
      mother_profession: formData.mother_profession || null,
      mother_origin: formData.mother_origin || null,
      siblings_count: formData.siblings_count ? parseInt(formData.siblings_count) : null,
      siblings_details: formData.siblings_details || null,
      family_situation: formData.family_situation || null,
      education_level: formData.education_level || null,
      school: formData.school || null,
      diploma: formData.diploma || null,
      profession: formData.profession || null,
      employer: formData.employer || null,
      income_range: null,
      marital_history: formData.marital_history || null,
      has_children: formData.has_children === 'true',
      children_count: formData.children_count ? parseInt(formData.children_count) : null,
      children_details: null,
      wants_children: null,
      preferred_age_min: formData.preferred_age_min ? parseInt(formData.preferred_age_min) : null,
      preferred_age_max: formData.preferred_age_max ? parseInt(formData.preferred_age_max) : null,
      preferred_height_min: formData.preferred_height_min ? parseInt(formData.preferred_height_min) : null,
      preferred_height_max: formData.preferred_height_max ? parseInt(formData.preferred_height_max) : null,
      preferred_religious_level: formData.preferred_religious_level || null,
      preferred_hashkafa: formData.preferred_hashkafa || null,
      preferred_community: formData.preferred_community || null,
      preferred_location: formData.preferred_location || null,
      preferred_profession: formData.preferred_profession || null,
      deal_breakers: formData.deal_breakers || null,
      partner_description: formData.partner_description || null,
      notes: formData.notes || null,
      private_notes: null,
      matchmaker_impression: formData.matchmaker_impression || null,
      source: null,
      tags: [],
      custom_fields: {},
      priority: 0,
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
          label="Prenom *"
          value={formData.first_name}
          onChange={(e) => updateField('first_name', e.target.value)}
          error={errors.first_name}
          placeholder="Prenom"
        />
        <Input
          label="Nom *"
          value={formData.last_name}
          onChange={(e) => updateField('last_name', e.target.value)}
          error={errors.last_name}
          placeholder="Nom de famille"
        />
        <Input
          label="Nom hebraique"
          value={formData.hebrew_name}
          onChange={(e) => updateField('hebrew_name', e.target.value)}
          placeholder="Nom hebraique"
        />
        <Input
          label="Nom de jeune fille"
          value={formData.maiden_name}
          onChange={(e) => updateField('maiden_name', e.target.value)}
          placeholder="Si applicable"
        />
        <Input
          label="Date de naissance"
          inputType="date"
          value={formData.date_of_birth}
          onChange={(e) => updateField('date_of_birth', e.target.value)}
        />
        <Input
          label="Nationalite"
          value={formData.nationality}
          onChange={(e) => updateField('nationality', e.target.value)}
          placeholder="Francaise"
        />
        <Input
          label="Telephone"
          inputType="tel"
          value={formData.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          placeholder="+33 6 ..."
        />
        <Input
          label="Telephone secondaire"
          inputType="tel"
          value={formData.phone_secondary}
          onChange={(e) => updateField('phone_secondary', e.target.value)}
          placeholder="Optionnel"
        />
        <Input
          label="Email"
          inputType="email"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          placeholder="email@exemple.com"
        />
        <Input
          label="Pays d'origine"
          value={formData.country_of_origin}
          onChange={(e) => updateField('country_of_origin', e.target.value)}
        />
        <Input
          label="Adresse"
          value={formData.address}
          onChange={(e) => updateField('address', e.target.value)}
          className="sm:col-span-2"
        />
        <Input
          label="Ville"
          value={formData.city}
          onChange={(e) => updateField('city', e.target.value)}
          placeholder="Paris"
        />
        <Input
          label="Code postal"
          value={formData.postal_code}
          onChange={(e) => updateField('postal_code', e.target.value)}
          placeholder="75016"
        />
        <Input
          label="Pays"
          value={formData.country}
          onChange={(e) => updateField('country', e.target.value)}
        />
        <Input
          label="Taille (cm)"
          inputType="number"
          value={formData.height_cm}
          onChange={(e) => updateField('height_cm', e.target.value)}
          placeholder="165"
        />
        <Input
          label="Corpulence"
          value={formData.build}
          onChange={(e) => updateField('build', e.target.value)}
          placeholder="Mince, moyenne, ..."
        />
        <Input
          label="Couleur de cheveux"
          value={formData.hair_color}
          onChange={(e) => updateField('hair_color', e.target.value)}
        />
        <Input
          label="Couleur des yeux"
          value={formData.eye_color}
          onChange={(e) => updateField('eye_color', e.target.value)}
        />
      </div>
    )
  }

  function renderStep1() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nom du pere"
          value={formData.father_name}
          onChange={(e) => updateField('father_name', e.target.value)}
        />
        <Input
          label="Profession du pere"
          value={formData.father_profession}
          onChange={(e) => updateField('father_profession', e.target.value)}
        />
        <Input
          label="Origine du pere"
          value={formData.father_origin}
          onChange={(e) => updateField('father_origin', e.target.value)}
        />
        <div /> {/* spacer */}
        <Input
          label="Nom de la mere"
          value={formData.mother_name}
          onChange={(e) => updateField('mother_name', e.target.value)}
        />
        <Input
          label="Nom de jeune fille de la mere"
          value={formData.mother_maiden_name}
          onChange={(e) => updateField('mother_maiden_name', e.target.value)}
        />
        <Input
          label="Profession de la mere"
          value={formData.mother_profession}
          onChange={(e) => updateField('mother_profession', e.target.value)}
        />
        <Input
          label="Origine de la mere"
          value={formData.mother_origin}
          onChange={(e) => updateField('mother_origin', e.target.value)}
        />
        <Input
          label="Nombre de freres et soeurs"
          inputType="number"
          value={formData.siblings_count}
          onChange={(e) => updateField('siblings_count', e.target.value)}
        />
        <Input
          label="Situation familiale"
          value={formData.family_situation}
          onChange={(e) => updateField('family_situation', e.target.value)}
          placeholder="Parents maries, divorces..."
        />
        <div className="sm:col-span-2">
          <Input
            label="Detail de la fratrie"
            inputType="textarea"
            value={formData.siblings_details}
            onChange={(e) => updateField('siblings_details', e.target.value)}
            placeholder="Frere aine 30 ans marie, soeur 25 ans..."
          />
        </div>
      </div>
    )
  }

  function renderStep2() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Niveau de pratique"
          options={religiousLevelOptions}
          value={formData.religious_level}
          onChange={(e) => updateField('religious_level', e.target.value)}
        />
        <Select
          label="Hashkafa"
          options={hashkafaOptions}
          value={formData.hashkafa}
          onChange={(e) => updateField('hashkafa', e.target.value)}
        />
        <Input
          label="Communaute"
          value={formData.community}
          onChange={(e) => updateField('community', e.target.value)}
          placeholder="Communaute d'appartenance"
        />
        <Input
          label="Synagogue"
          value={formData.synagogue}
          onChange={(e) => updateField('synagogue', e.target.value)}
        />
        <Input
          label="Cohen / Levi / Israel"
          value={formData.cohen_levi_israel}
          onChange={(e) => updateField('cohen_levi_israel', e.target.value)}
        />
        <Select
          label="Chabbat"
          options={[
            { value: '', label: 'Non precise' },
            { value: 'true', label: 'Oui' },
            { value: 'false', label: 'Non' },
          ]}
          value={formData.keeps_shabbat}
          onChange={(e) => updateField('keeps_shabbat', e.target.value)}
        />
        <Select
          label="Cacherout"
          options={[
            { value: '', label: 'Non precise' },
            { value: 'true', label: 'Oui' },
            { value: 'false', label: 'Non' },
          ]}
          value={formData.keeps_kashrut}
          onChange={(e) => updateField('keeps_kashrut', e.target.value)}
        />
      </div>
    )
  }

  function renderStep3() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Niveau d'etudes"
          value={formData.education_level}
          onChange={(e) => updateField('education_level', e.target.value)}
          placeholder="Bac+5, Licence..."
        />
        <Input
          label="Ecole / Universite"
          value={formData.school}
          onChange={(e) => updateField('school', e.target.value)}
        />
        <Input
          label="Diplome"
          value={formData.diploma}
          onChange={(e) => updateField('diploma', e.target.value)}
        />
        <Input
          label="Profession"
          value={formData.profession}
          onChange={(e) => updateField('profession', e.target.value)}
        />
        <Input
          label="Employeur"
          value={formData.employer}
          onChange={(e) => updateField('employer', e.target.value)}
        />
        <Input
          label="Situation matrimoniale"
          value={formData.marital_history}
          onChange={(e) => updateField('marital_history', e.target.value)}
          placeholder="Celibataire, divorcee..."
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
          <Input
            label="Nombre d'enfants"
            inputType="number"
            value={formData.children_count}
            onChange={(e) => updateField('children_count', e.target.value)}
          />
        )}
        <div className="sm:col-span-2">
          <Input
            label="Notes"
            inputType="textarea"
            value={formData.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Notes generales sur la candidate..."
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Impression de la chadkhanit"
            inputType="textarea"
            value={formData.matchmaker_impression}
            onChange={(e) => updateField('matchmaker_impression', e.target.value)}
            placeholder="Vos impressions personnelles..."
          />
        </div>
      </div>
    )
  }

  function renderStep4() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Age minimum souhaite"
          inputType="number"
          value={formData.preferred_age_min}
          onChange={(e) => updateField('preferred_age_min', e.target.value)}
          placeholder="22"
        />
        <Input
          label="Age maximum souhaite"
          inputType="number"
          value={formData.preferred_age_max}
          onChange={(e) => updateField('preferred_age_max', e.target.value)}
          placeholder="35"
        />
        <Input
          label="Taille minimum souhaitee (cm)"
          inputType="number"
          value={formData.preferred_height_min}
          onChange={(e) => updateField('preferred_height_min', e.target.value)}
          placeholder="170"
        />
        <Input
          label="Taille maximum souhaitee (cm)"
          inputType="number"
          value={formData.preferred_height_max}
          onChange={(e) => updateField('preferred_height_max', e.target.value)}
          placeholder="190"
        />
        <Select
          label="Niveau religieux souhaite"
          options={religiousLevelOptions}
          value={formData.preferred_religious_level}
          onChange={(e) => updateField('preferred_religious_level', e.target.value)}
        />
        <Select
          label="Hashkafa souhaitee"
          options={hashkafaOptions}
          value={formData.preferred_hashkafa}
          onChange={(e) => updateField('preferred_hashkafa', e.target.value)}
        />
        <Input
          label="Communaute souhaitee"
          value={formData.preferred_community}
          onChange={(e) => updateField('preferred_community', e.target.value)}
        />
        <Input
          label="Lieu souhaite"
          value={formData.preferred_location}
          onChange={(e) => updateField('preferred_location', e.target.value)}
          placeholder="Paris, Israel..."
        />
        <Input
          label="Profession souhaitee"
          value={formData.preferred_profession}
          onChange={(e) => updateField('preferred_profession', e.target.value)}
        />
        <div /> {/* spacer */}
        <div className="sm:col-span-2">
          <Input
            label="Points redhibitoires"
            inputType="textarea"
            value={formData.deal_breakers}
            onChange={(e) => updateField('deal_breakers', e.target.value)}
            placeholder="Ce qu'elle ne souhaite absolument pas..."
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Description du partenaire ideal"
            inputType="textarea"
            value={formData.partner_description}
            onChange={(e) => updateField('partner_description', e.target.value)}
            placeholder="Description libre du profil recherche..."
          />
        </div>
      </div>
    )
  }

  function renderStep5() {
    const summaryFields: Array<{ section: string; items: Array<{ label: string; value: string }> }> = [
      {
        section: 'Identite',
        items: [
          { label: 'Nom', value: `${formData.first_name} ${formData.last_name}` },
          { label: 'Date de naissance', value: formData.date_of_birth || 'Non renseigne' },
          { label: 'Telephone', value: formData.phone || 'Non renseigne' },
          { label: 'Email', value: formData.email || 'Non renseigne' },
          { label: 'Ville', value: formData.city || 'Non renseigne' },
        ],
      },
      {
        section: 'Famille',
        items: [
          { label: 'Pere', value: formData.father_name || 'Non renseigne' },
          { label: 'Mere', value: formData.mother_name || 'Non renseigne' },
          { label: 'Fratrie', value: formData.siblings_count ? `${formData.siblings_count} frere(s)/soeur(s)` : 'Non renseigne' },
        ],
      },
      {
        section: 'Vie religieuse',
        items: [
          { label: 'Niveau', value: formData.religious_level ? religiousLevelOptions.find((o) => o.value === formData.religious_level)?.label ?? formData.religious_level : 'Non renseigne' },
          { label: 'Hashkafa', value: formData.hashkafa ? hashkafaOptions.find((o) => o.value === formData.hashkafa)?.label ?? formData.hashkafa : 'Non renseigne' },
          { label: 'Communaute', value: formData.community || 'Non renseigne' },
        ],
      },
      {
        section: 'Parcours',
        items: [
          { label: 'Profession', value: formData.profession || 'Non renseigne' },
          { label: 'Etudes', value: formData.education_level || 'Non renseigne' },
        ],
      },
      {
        section: 'Attentes',
        items: [
          { label: 'Tranche d\'age', value: formData.preferred_age_min || formData.preferred_age_max ? `${formData.preferred_age_min || '?'} - ${formData.preferred_age_max || '?'} ans` : 'Non renseigne' },
          { label: 'Lieu souhaite', value: formData.preferred_location || 'Non renseigne' },
        ],
      },
    ]

    return (
      <div className="space-y-6">
        <div className="bg-[#87A878]/5 rounded-lg p-4 border border-[#87A878]/20">
          <p className="text-sm text-[#5A7A4A] font-medium">
            Verifiez les informations avant de soumettre la fiche.
          </p>
        </div>

        {summaryFields.map((section) => (
          <div key={section.section}>
            <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
              {section.section}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {section.items.map((item) => (
                <div key={item.label} className="py-1.5">
                  <span className="text-xs text-[#6B7280]">{item.label}</span>
                  <p className={`text-sm ${item.value === 'Non renseigne' ? 'text-[#6B7280]/50 italic' : 'text-[#2D2D2D]'}`}>
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
        className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#2D2D2D] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour a la liste
      </Link>

      <h1 className="text-2xl font-bold text-[#2D2D2D]">Nouvelle fiche candidate</h1>

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
                    ? 'text-[#6B3A5B]'
                    : isCompleted
                      ? 'text-[#87A878]'
                      : 'text-[#6B7280]/50'
                }`}
                title={step.label}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm font-medium ${
                    isActive
                      ? 'bg-[#6B3A5B] text-white'
                      : isCompleted
                        ? 'bg-[#87A878] text-white'
                        : 'bg-gray-100 text-[#6B7280]'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                </div>
                <span className="hidden lg:inline">{step.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 rounded ${
                    isCompleted ? 'bg-[#87A878]' : 'bg-gray-200'
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
          <h2 className="text-lg font-semibold text-[#2D2D2D]">
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
