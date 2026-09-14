'use client'

import { use, useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Invitation } from '@/lib/types'
import {
  Heart,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  Upload,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react'

// ============================================================
// Constants
// ============================================================

const TOTAL_STEPS = 7
const MAX_PHOTOS = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const STEP_LABELS = [
  'Identite',
  'Situation familiale',
  'Vie religieuse',
  'Personnalite',
  'Recherche',
  'Photos',
  'Verification',
]

const RELIGIOUS_LEVEL_OPTIONS = [
  { value: '', label: 'Selectionnez...' },
  { value: 'tres_pratiquant', label: 'Tres pratiquante' },
  { value: 'pratiquant', label: 'Pratiquante' },
  { value: 'traditionnel', label: 'Traditionnelle' },
  { value: 'liberal', label: 'Non pratiquante' },
  { value: 'autre', label: 'Autre' },
]

const HASHKAFA_OPTIONS = [
  { value: '', label: 'Selectionnez...' },
  { value: 'haredi_ashkenaz', label: 'Haredi Ashkenaze' },
  { value: 'haredi_sfarad', label: 'Haredi Sefarade' },
  { value: 'dati_leumi', label: 'Dati Leoumi (Sioniste religieux)' },
  { value: 'dati_liberal', label: 'Dati Liberal' },
  { value: 'masorti', label: 'Massorti (Conservateur)' },
  { value: 'hiloni', label: 'Hiloni (Laique)' },
  { value: 'baal_teshuva', label: 'Baal Teshouva' },
  { value: 'other', label: 'Autre' },
]

const MARITAL_HISTORY_OPTIONS = [
  { value: '', label: 'Selectionnez...' },
  { value: 'celibataire', label: 'Celibataire' },
  { value: 'divorcee', label: 'Divorcee' },
  { value: 'veuve', label: 'Veuve' },
]

// ============================================================
// Form data shape
// ============================================================

interface FormData {
  // Step 1 - Identite
  first_name: string
  last_name: string
  date_of_birth: string
  city: string
  country: string
  phone: string
  email: string

  // Step 2 - Situation familiale
  marital_history: string
  has_children: boolean
  children_count: number | ''
  children_details: string
  family_situation: string

  // Step 3 - Vie religieuse
  community: string
  religious_level: string
  hashkafa: string
  keeps_shabbat: boolean
  keeps_kashrut: boolean

  // Step 4 - Personnalite et parcours
  profession: string
  education_level: string
  diploma: string
  interests: string
  temperament: string

  // Step 5 - Ce que vous recherchez
  preferred_age_min: number | ''
  preferred_age_max: number | ''
  preferred_location: string
  preferred_religious_level: string
  partner_description: string
  deal_breakers: string
}

const INITIAL_FORM_DATA: FormData = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  city: '',
  country: '',
  phone: '',
  email: '',
  marital_history: '',
  has_children: false,
  children_count: '',
  children_details: '',
  family_situation: '',
  community: '',
  religious_level: '',
  hashkafa: '',
  keeps_shabbat: false,
  keeps_kashrut: false,
  profession: '',
  education_level: '',
  diploma: '',
  interests: '',
  temperament: '',
  preferred_age_min: '',
  preferred_age_max: '',
  preferred_location: '',
  preferred_religious_level: '',
  partner_description: '',
  deal_breakers: '',
}

// ============================================================
// Photo preview type
// ============================================================

interface PhotoPreview {
  file: File
  preview: string
}

// ============================================================
// Shared UI sub-components
// ============================================================

function Logo() {
  return (
    <div className="flex items-center justify-center gap-2">
      <Heart className="h-7 w-7 text-[#6B3A5B] fill-[#6B3A5B]/20" />
      <span className="text-2xl font-bold tracking-tight text-[#2D2D2D]">
        Hava Dahan
      </span>
      <Sparkles className="h-5 w-5 text-[#C5A55A]" />
    </div>
  )
}

function ProgressBar({
  currentStep,
  totalSteps,
}: {
  currentStep: number
  totalSteps: number
}) {
  return (
    <div className="w-full">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const step = i + 1
          const isCompleted = step < currentStep
          const isCurrent = step === currentStep
          return (
            <div key={step} className="flex flex-col items-center flex-1">
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                  transition-all duration-300
                  ${
                    isCompleted
                      ? 'bg-[#87A878] text-white'
                      : isCurrent
                        ? 'bg-[#6B3A5B] text-white ring-4 ring-[#6B3A5B]/20'
                        : 'bg-[#E8E0D4] text-[#2D2D2D]/50'
                  }
                `}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step}
              </div>
              <span
                className={`
                  text-[10px] mt-1 text-center leading-tight hidden sm:block
                  ${isCurrent ? 'text-[#6B3A5B] font-semibold' : 'text-[#2D2D2D]/50'}
                `}
              >
                {STEP_LABELS[i]}
              </span>
            </div>
          )
        })}
      </div>
      {/* Progress bar */}
      <div className="h-2 bg-[#E8E0D4] rounded-full overflow-hidden mt-2">
        <div
          className="h-full bg-gradient-to-r from-[#87A878] to-[#6B3A5B] rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
          }}
        />
      </div>
      {/* Mobile step label */}
      <p className="text-center text-sm text-[#6B3A5B] font-medium mt-2 sm:hidden">
        Etape {currentStep} / {totalSteps} &mdash; {STEP_LABELS[currentStep - 1]}
      </p>
    </div>
  )
}

function FormField({
  label,
  required,
  children,
  hint,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[#2D2D2D]">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-[#2D2D2D]/50">{hint}</p>}
    </div>
  )
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-[#E8E0D4] bg-white text-[#2D2D2D] text-base ' +
  'placeholder:text-[#2D2D2D]/30 focus:outline-none focus:ring-2 focus:ring-[#87A878]/40 ' +
  'focus:border-[#87A878] transition-all'

const selectClass =
  'w-full px-4 py-3 rounded-xl border border-[#E8E0D4] bg-white text-[#2D2D2D] text-base ' +
  'focus:outline-none focus:ring-2 focus:ring-[#87A878]/40 focus:border-[#87A878] transition-all ' +
  'appearance-none cursor-pointer'

const textareaClass =
  'w-full px-4 py-3 rounded-xl border border-[#E8E0D4] bg-white text-[#2D2D2D] text-base ' +
  'placeholder:text-[#2D2D2D]/30 focus:outline-none focus:ring-2 focus:ring-[#87A878]/40 ' +
  'focus:border-[#87A878] transition-all resize-none'

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 w-full py-2 group"
    >
      <div
        className={`
          relative w-12 h-7 rounded-full transition-colors duration-200
          ${checked ? 'bg-[#87A878]' : 'bg-[#E8E0D4]'}
        `}
      >
        <div
          className={`
            absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200
            ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}
          `}
        />
      </div>
      <span className="text-sm font-medium text-[#2D2D2D] group-hover:text-[#6B3A5B] transition-colors">
        {label}
      </span>
    </button>
  )
}

// ============================================================
// Error page component
// ============================================================

function ErrorPage({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-[#E8E0D4]">
          <div className="w-20 h-20 rounded-full bg-[#6B3A5B]/10 flex items-center justify-center mx-auto mb-6">
            <Heart className="h-10 w-10 text-[#6B3A5B]" />
          </div>
          <h1 className="text-xl font-bold text-[#2D2D2D] mb-3">{title}</h1>
          <p className="text-[#2D2D2D]/60 leading-relaxed">{message}</p>
          <div className="mt-8 flex items-center justify-center gap-1 text-sm text-[#2D2D2D]/30">
            <Heart className="h-3 w-3" />
            <span>Hava Dahan Matchmaking</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Confirmation page component
// ============================================================

function ConfirmationPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-[#E8E0D4]">
          <div className="w-20 h-20 rounded-full bg-[#87A878]/10 flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-[#87A878]" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-[#C5A55A]" />
            <h1 className="text-2xl font-bold text-[#2D2D2D]">Merci !</h1>
            <Sparkles className="h-5 w-5 text-[#C5A55A]" />
          </div>
          <p className="text-[#2D2D2D]/70 leading-relaxed text-lg mb-2">
            Votre dossier a ete transmis avec succes.
          </p>
          <p className="text-[#2D2D2D]/50 text-sm leading-relaxed">
            Nous examinons votre profil avec soin et vous contacterons prochainement.
            Que ce soit le debut d&apos;une belle histoire...
          </p>
          <div className="mt-8 pt-6 border-t border-[#E8E0D4]">
            <div className="flex items-center justify-center gap-2 text-sm text-[#6B3A5B]">
              <Heart className="h-4 w-4 fill-[#6B3A5B]/20" />
              <span className="font-medium">Hava Dahan Matchmaking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Step components
// ============================================================

function Step1Identity({
  data,
  onChange,
}: {
  data: FormData
  onChange: (patch: Partial<FormData>) => void
}) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#2D2D2D]">Votre identite</h2>
        <p className="text-sm text-[#2D2D2D]/50 mt-1">
          Commençons par les informations de base
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Prenom" required>
          <input
            type="text"
            className={inputClass}
            placeholder="Sarah"
            value={data.first_name}
            onChange={(e) => onChange({ first_name: e.target.value })}
          />
        </FormField>
        <FormField label="Nom" required>
          <input
            type="text"
            className={inputClass}
            placeholder="Cohen"
            value={data.last_name}
            onChange={(e) => onChange({ last_name: e.target.value })}
          />
        </FormField>
      </div>

      <FormField label="Date de naissance">
        <input
          type="date"
          className={inputClass}
          value={data.date_of_birth}
          onChange={(e) => onChange({ date_of_birth: e.target.value })}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Ville">
          <input
            type="text"
            className={inputClass}
            placeholder="Paris"
            value={data.city}
            onChange={(e) => onChange({ city: e.target.value })}
          />
        </FormField>
        <FormField label="Pays">
          <input
            type="text"
            className={inputClass}
            placeholder="France"
            value={data.country}
            onChange={(e) => onChange({ country: e.target.value })}
          />
        </FormField>
      </div>

      <FormField label="Telephone">
        <input
          type="tel"
          className={inputClass}
          placeholder="+33 6 12 34 56 78"
          value={data.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
        />
      </FormField>

      <FormField label="Email">
        <input
          type="email"
          className={inputClass}
          placeholder="sarah@exemple.fr"
          value={data.email}
          onChange={(e) => onChange({ email: e.target.value })}
        />
      </FormField>
    </div>
  )
}

function Step2Family({
  data,
  onChange,
}: {
  data: FormData
  onChange: (patch: Partial<FormData>) => void
}) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#2D2D2D]">Situation familiale</h2>
        <p className="text-sm text-[#2D2D2D]/50 mt-1">
          Ces informations restent strictement confidentielles
        </p>
      </div>

      <FormField label="Situation matrimoniale">
        <select
          className={selectClass}
          value={data.marital_history}
          onChange={(e) => onChange({ marital_history: e.target.value })}
        >
          {MARITAL_HISTORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>

      <div className="bg-[#FFFBF0] rounded-xl p-4 border border-[#E8E0D4]/50">
        <Toggle
          checked={data.has_children}
          onChange={(v) =>
            onChange({
              has_children: v,
              ...(!v ? { children_count: '', children_details: '' } : {}),
            })
          }
          label="Avez-vous des enfants ?"
        />

        {data.has_children && (
          <div className="mt-4 space-y-4 pl-1">
            <FormField label="Nombre d'enfants">
              <input
                type="number"
                min={0}
                max={20}
                className={inputClass}
                placeholder="0"
                value={data.children_count}
                onChange={(e) =>
                  onChange({
                    children_count: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
              />
            </FormField>
            <FormField label="Details (ages, garde, etc.)" hint="Informations qui pourraient etre utiles">
              <textarea
                className={textareaClass}
                rows={3}
                placeholder="Ex : 2 enfants (8 ans et 5 ans), garde alternee"
                value={data.children_details}
                onChange={(e) => onChange({ children_details: e.target.value })}
              />
            </FormField>
          </div>
        )}
      </div>

      <FormField label="Contexte familial" hint="Origine, composition de la famille, tout ce qui vous semble pertinent">
        <textarea
          className={textareaClass}
          rows={4}
          placeholder="Parlez-nous de votre famille..."
          value={data.family_situation}
          onChange={(e) => onChange({ family_situation: e.target.value })}
        />
      </FormField>
    </div>
  )
}

function Step3Religion({
  data,
  onChange,
}: {
  data: FormData
  onChange: (patch: Partial<FormData>) => void
}) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#2D2D2D]">Vie religieuse</h2>
        <p className="text-sm text-[#2D2D2D]/50 mt-1">
          Pour mieux vous connaitre et trouver la compatibilite ideale
        </p>
      </div>

      <FormField label="Communaute">
        <input
          type="text"
          className={inputClass}
          placeholder="Ex : Communaute sefarade de Paris"
          value={data.community}
          onChange={(e) => onChange({ community: e.target.value })}
        />
      </FormField>

      <FormField label="Niveau de pratique">
        <select
          className={selectClass}
          value={data.religious_level}
          onChange={(e) => onChange({ religious_level: e.target.value })}
        >
          {RELIGIOUS_LEVEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Hashkafa (orientation religieuse)">
        <select
          className={selectClass}
          value={data.hashkafa}
          onChange={(e) => onChange({ hashkafa: e.target.value })}
        >
          {HASHKAFA_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>

      <div className="bg-[#FFFBF0] rounded-xl p-4 border border-[#E8E0D4]/50 space-y-1">
        <Toggle
          checked={data.keeps_shabbat}
          onChange={(v) => onChange({ keeps_shabbat: v })}
          label="Observance du Chabbat"
        />
        <Toggle
          checked={data.keeps_kashrut}
          onChange={(v) => onChange({ keeps_kashrut: v })}
          label="Observance de la Cacherout"
        />
      </div>
    </div>
  )
}

function Step4Personality({
  data,
  onChange,
}: {
  data: FormData
  onChange: (patch: Partial<FormData>) => void
}) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#2D2D2D]">Personnalite et parcours</h2>
        <p className="text-sm text-[#2D2D2D]/50 mt-1">
          Aidez-nous a mieux vous connaitre
        </p>
      </div>

      <FormField label="Profession">
        <input
          type="text"
          className={inputClass}
          placeholder="Ex : Avocate, Enseignante, Medecin..."
          value={data.profession}
          onChange={(e) => onChange({ profession: e.target.value })}
        />
      </FormField>

      <FormField label="Niveau d'etudes">
        <input
          type="text"
          className={inputClass}
          placeholder="Ex : Bac+5, Master, Doctorat..."
          value={data.education_level}
          onChange={(e) => onChange({ education_level: e.target.value })}
        />
      </FormField>

      <FormField label="Diplome">
        <input
          type="text"
          className={inputClass}
          placeholder="Ex : Master en droit, Diplome d'ingenieur..."
          value={data.diploma}
          onChange={(e) => onChange({ diploma: e.target.value })}
        />
      </FormField>

      <FormField label="Centres d'interet">
        <textarea
          className={textareaClass}
          rows={3}
          placeholder="Voyages, lecture, cuisine, sport, musique..."
          value={data.interests}
          onChange={(e) => onChange({ interests: e.target.value })}
        />
      </FormField>

      <FormField label="Comment vous decririez-vous ?" hint="Votre temperament, vos valeurs, ce qui compte pour vous">
        <textarea
          className={textareaClass}
          rows={4}
          placeholder="Je suis quelqu'un de..."
          value={data.temperament}
          onChange={(e) => onChange({ temperament: e.target.value })}
        />
      </FormField>
    </div>
  )
}

function Step5Preferences({
  data,
  onChange,
}: {
  data: FormData
  onChange: (patch: Partial<FormData>) => void
}) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#2D2D2D]">Ce que vous recherchez</h2>
        <p className="text-sm text-[#2D2D2D]/50 mt-1">
          Decrivez le partenaire avec qui vous vous verriez partager votre vie
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Age minimum">
          <input
            type="number"
            min={18}
            max={99}
            className={inputClass}
            placeholder="25"
            value={data.preferred_age_min}
            onChange={(e) =>
              onChange({
                preferred_age_min: e.target.value === '' ? '' : Number(e.target.value),
              })
            }
          />
        </FormField>
        <FormField label="Age maximum">
          <input
            type="number"
            min={18}
            max={99}
            className={inputClass}
            placeholder="40"
            value={data.preferred_age_max}
            onChange={(e) =>
              onChange({
                preferred_age_max: e.target.value === '' ? '' : Number(e.target.value),
              })
            }
          />
        </FormField>
      </div>

      <FormField label="Villes souhaitees">
        <input
          type="text"
          className={inputClass}
          placeholder="Paris, Tel Aviv, Londres..."
          value={data.preferred_location}
          onChange={(e) => onChange({ preferred_location: e.target.value })}
        />
      </FormField>

      <FormField label="Niveau de pratique souhaite">
        <input
          type="text"
          className={inputClass}
          placeholder="Ex : Pratiquant, ouvert..."
          value={data.preferred_religious_level}
          onChange={(e) => onChange({ preferred_religious_level: e.target.value })}
        />
      </FormField>

      <FormField label="Decrivez le partenaire ideal" hint="Personnalite, valeurs, mode de vie...">
        <textarea
          className={textareaClass}
          rows={4}
          placeholder="Je recherche quelqu'un qui..."
          value={data.partner_description}
          onChange={(e) => onChange({ partner_description: e.target.value })}
        />
      </FormField>

      <FormField label="Points redhibitoires" hint="Ce que vous ne pourriez pas accepter">
        <textarea
          className={textareaClass}
          rows={3}
          placeholder="Il est important pour moi que..."
          value={data.deal_breakers}
          onChange={(e) => onChange({ deal_breakers: e.target.value })}
        />
      </FormField>
    </div>
  )
}

function Step6Photos({
  photos,
  onAdd,
  onRemove,
}: {
  photos: PhotoPreview[]
  onAdd: (files: FileList) => void
  onRemove: (index: number) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (e.dataTransfer.files.length > 0) {
        onAdd(e.dataTransfer.files)
      }
    },
    [onAdd]
  )

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#2D2D2D]">Photos</h2>
        <p className="text-sm text-[#2D2D2D]/50 mt-1">
          Ajoutez jusqu&apos;a {MAX_PHOTOS} photos (facultatif mais recommande)
        </p>
      </div>

      {/* Drop zone */}
      {photos.length < MAX_PHOTOS && (
        <div
          className={`
            relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${
              dragOver
                ? 'border-[#87A878] bg-[#87A878]/5'
                : 'border-[#E8E0D4] hover:border-[#87A878]/50 hover:bg-[#87A878]/5'
            }
          `}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onAdd(e.target.files)
                e.target.value = ''
              }
            }}
          />
          <Upload className="h-10 w-10 text-[#87A878] mx-auto mb-3" />
          <p className="text-sm text-[#2D2D2D]/70 font-medium">
            Glissez vos photos ici ou cliquez pour selectionner
          </p>
          <p className="text-xs text-[#2D2D2D]/40 mt-1">
            JPG, PNG &mdash; 5 Mo max par photo &mdash;{' '}
            {MAX_PHOTOS - photos.length} restante(s)
          </p>
        </div>
      )}

      {/* Previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-xl overflow-hidden border border-[#E8E0D4] bg-[#E8E0D4]/20"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.preview}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center
                  opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent p-2">
                <p className="text-xs text-white truncate">{photo.file.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <p className="text-center text-sm text-[#2D2D2D]/40 italic">
          Aucune photo ajoutee pour le moment
        </p>
      )}
    </div>
  )
}

function Step7Review({
  data,
  photos,
  confirmed,
  onConfirm,
}: {
  data: FormData
  photos: PhotoPreview[]
  confirmed: boolean
  onConfirm: (v: boolean) => void
}) {
  const sections = [
    {
      title: 'Identite',
      fields: [
        { label: 'Prenom', value: data.first_name },
        { label: 'Nom', value: data.last_name },
        { label: 'Date de naissance', value: data.date_of_birth },
        { label: 'Ville', value: data.city },
        { label: 'Pays', value: data.country },
        { label: 'Telephone', value: data.phone },
        { label: 'Email', value: data.email },
      ],
    },
    {
      title: 'Situation familiale',
      fields: [
        {
          label: 'Situation',
          value:
            MARITAL_HISTORY_OPTIONS.find((o) => o.value === data.marital_history)
              ?.label || data.marital_history,
        },
        { label: 'Enfants', value: data.has_children ? 'Oui' : 'Non' },
        ...(data.has_children
          ? [
              { label: 'Nombre', value: String(data.children_count) },
              { label: 'Details', value: data.children_details },
            ]
          : []),
        { label: 'Contexte familial', value: data.family_situation },
      ],
    },
    {
      title: 'Vie religieuse',
      fields: [
        { label: 'Communaute', value: data.community },
        {
          label: 'Pratique',
          value:
            RELIGIOUS_LEVEL_OPTIONS.find((o) => o.value === data.religious_level)
              ?.label || data.religious_level,
        },
        {
          label: 'Hashkafa',
          value:
            HASHKAFA_OPTIONS.find((o) => o.value === data.hashkafa)?.label ||
            data.hashkafa,
        },
        { label: 'Chabbat', value: data.keeps_shabbat ? 'Oui' : 'Non' },
        { label: 'Cacherout', value: data.keeps_kashrut ? 'Oui' : 'Non' },
      ],
    },
    {
      title: 'Personnalite et parcours',
      fields: [
        { label: 'Profession', value: data.profession },
        { label: "Niveau d'etudes", value: data.education_level },
        { label: 'Diplome', value: data.diploma },
        { label: "Centres d'interet", value: data.interests },
        { label: 'Temperament', value: data.temperament },
      ],
    },
    {
      title: 'Ce que vous recherchez',
      fields: [
        {
          label: 'Tranche d\'age',
          value:
            data.preferred_age_min || data.preferred_age_max
              ? `${data.preferred_age_min || '?'} - ${data.preferred_age_max || '?'} ans`
              : '',
        },
        { label: 'Villes souhaitees', value: data.preferred_location },
        { label: 'Pratique souhaitee', value: data.preferred_religious_level },
        { label: 'Partenaire ideal', value: data.partner_description },
        { label: 'Points redhibitoires', value: data.deal_breakers },
      ],
    },
  ]

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#2D2D2D]">Verification</h2>
        <p className="text-sm text-[#2D2D2D]/50 mt-1">
          Relisez vos informations avant envoi
        </p>
      </div>

      {sections.map((section) => (
        <div
          key={section.title}
          className="bg-[#FFFBF0] rounded-xl border border-[#E8E0D4]/50 p-4"
        >
          <h3 className="text-sm font-bold text-[#6B3A5B] mb-3 uppercase tracking-wider">
            {section.title}
          </h3>
          <div className="space-y-2">
            {section.fields.map((field) => (
              <div
                key={field.label}
                className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2"
              >
                <span className="text-xs font-medium text-[#2D2D2D]/50 sm:w-40 shrink-0">
                  {field.label}
                </span>
                <span className="text-sm text-[#2D2D2D] break-words">
                  {field.value || (
                    <span className="text-[#2D2D2D]/30 italic">Non renseigne</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {photos.length > 0 && (
        <div className="bg-[#FFFBF0] rounded-xl border border-[#E8E0D4]/50 p-4">
          <h3 className="text-sm font-bold text-[#6B3A5B] mb-3 uppercase tracking-wider">
            Photos ({photos.length})
          </h3>
          <div className="flex gap-2 flex-wrap">
            {photos.map((photo, i) => (
              <div
                key={i}
                className="w-16 h-16 rounded-lg overflow-hidden border border-[#E8E0D4]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.preview}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation checkbox */}
      <div className="bg-white rounded-xl border border-[#E8E0D4] p-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="pt-0.5">
            <div
              className={`
                w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                ${
                  confirmed
                    ? 'bg-[#87A878] border-[#87A878]'
                    : 'border-[#E8E0D4] group-hover:border-[#87A878]/50'
                }
              `}
              onClick={() => onConfirm(!confirmed)}
            >
              {confirmed && <Check className="h-4 w-4 text-white" />}
            </div>
          </div>
          <span
            className="text-sm text-[#2D2D2D] leading-relaxed select-none"
            onClick={() => onConfirm(!confirmed)}
          >
            Je confirme que les informations fournies sont exactes et j&apos;autorise
            leur traitement dans le cadre de la mise en relation.
          </span>
        </label>
      </div>
    </div>
  )
}

// ============================================================
// Main page component
// ============================================================

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const supabase = createClient()

  // Invitation state
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorType, setErrorType] = useState<
    'expired' | 'accepted' | 'revoked' | 'not_found' | null
  >(null)

  // Form state
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [photos, setPhotos] = useState<PhotoPreview[]>([])
  const [confirmed, setConfirmed] = useState(false)

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // localStorage key
  const storageKey = `invite_form_${token}`

  // --------------------------------------------------------
  // Fetch invitation on mount
  // --------------------------------------------------------

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const { data, error } = await supabase
          .from('invitations')
          .select('*')
          .eq('token', token)
          .single()

        if (error || !data) {
          setErrorType('not_found')
          setLoading(false)
          return
        }

        const inv = data as Invitation
        const status = inv.status as string

        // Check status
        if (status === 'accepted') {
          setErrorType('accepted')
          setLoading(false)
          return
        }
        if (status === 'revoked') {
          setErrorType('revoked')
          setLoading(false)
          return
        }
        if (status === 'expired') {
          setErrorType('expired')
          setLoading(false)
          return
        }
        if (status !== 'pending') {
          setErrorType('not_found')
          setLoading(false)
          return
        }

        // Check expiration
        if (new Date(inv.expires_at) < new Date()) {
          setErrorType('expired')
          setLoading(false)
          return
        }

        setInvitation(inv)
        setLoading(false)
      } catch {
        setErrorType('not_found')
        setLoading(false)
      }
    }

    fetchInvitation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // --------------------------------------------------------
  // Restore from localStorage on mount
  // --------------------------------------------------------

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.formData) {
          setFormData(parsed.formData)
        }
        if (typeof parsed.currentStep === 'number') {
          setCurrentStep(parsed.currentStep)
        }
      }
    } catch {
      // Ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --------------------------------------------------------
  // Save to localStorage on step change
  // --------------------------------------------------------

  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ formData, currentStep })
      )
    } catch {
      // Ignore storage errors
    }
  }, [storageKey, formData, currentStep])

  // --------------------------------------------------------
  // Handlers
  // --------------------------------------------------------

  const updateFormData = useCallback((patch: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }))
  }, [])

  const goNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      saveToStorage()
      setCurrentStep((s) => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep, saveToStorage])

  const goPrev = useCallback(() => {
    if (currentStep > 1) {
      saveToStorage()
      setCurrentStep((s) => s - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep, saveToStorage])

  const addPhotos = useCallback(
    (fileList: FileList) => {
      const newPhotos: PhotoPreview[] = []
      const remaining = MAX_PHOTOS - photos.length

      for (let i = 0; i < Math.min(fileList.length, remaining); i++) {
        const file = fileList[i]
        if (file.size > MAX_FILE_SIZE) {
          continue
        }
        if (!file.type.startsWith('image/')) {
          continue
        }
        newPhotos.push({ file, preview: URL.createObjectURL(file) })
      }

      setPhotos((prev) => [...prev, ...newPhotos])
    },
    [photos.length]
  )

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => {
      const removed = prev[index]
      if (removed) {
        URL.revokeObjectURL(removed.preview)
      }
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  // --------------------------------------------------------
  // Validate current step
  // --------------------------------------------------------

  const canProceed = useCallback(() => {
    if (currentStep === 1) {
      return formData.first_name.trim() !== '' && formData.last_name.trim() !== ''
    }
    if (currentStep === 7) {
      return confirmed
    }
    return true
  }, [currentStep, formData.first_name, formData.last_name, confirmed])

  // --------------------------------------------------------
  // Submit
  // --------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (!invitation) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      // 1. Calculate age estimate from date_of_birth
      let ageEstimate: number | null = null
      let isAgeEstimate = false
      if (formData.date_of_birth) {
        const dob = new Date(formData.date_of_birth)
        const now = new Date()
        ageEstimate = now.getFullYear() - dob.getFullYear()
        const m = now.getMonth() - dob.getMonth()
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
          ageEstimate--
        }
      }

      // 2. Insert candidate
      const candidatePayload = {
        organization_id: invitation.organization_id,
        gender: 'female' as const,
        status: 'active' as const,
        availability: 'available' as const,
        priority: 0,
        source: 'invitation',
        tags: [],
        custom_fields: {},

        // Identity
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        date_of_birth: formData.date_of_birth || null,
        age_estimate: ageEstimate,
        is_age_estimate: isAgeEstimate,
        city: formData.city.trim() || null,
        country: formData.country.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,

        // Family
        marital_history: formData.marital_history || null,
        has_children: formData.has_children,
        children_count:
          formData.has_children && formData.children_count !== ''
            ? Number(formData.children_count)
            : null,
        children_details:
          formData.has_children && formData.children_details.trim()
            ? formData.children_details.trim()
            : null,
        family_situation: formData.family_situation.trim() || null,

        // Religion
        community: formData.community.trim() || null,
        religious_level: formData.religious_level || null,
        hashkafa: formData.hashkafa || null,
        keeps_shabbat: formData.keeps_shabbat,
        keeps_kashrut: formData.keeps_kashrut,

        // Career
        profession: formData.profession.trim() || null,
        education_level: formData.education_level.trim() || null,
        diploma: formData.diploma.trim() || null,

        // Notes (from personality fields)
        notes: [
          formData.interests.trim() &&
            `Centres d'interet : ${formData.interests.trim()}`,
          formData.temperament.trim() &&
            `Temperament : ${formData.temperament.trim()}`,
        ]
          .filter(Boolean)
          .join('\n\n') || null,

        // Preferences
        preferred_age_min:
          formData.preferred_age_min !== ''
            ? Number(formData.preferred_age_min)
            : null,
        preferred_age_max:
          formData.preferred_age_max !== ''
            ? Number(formData.preferred_age_max)
            : null,
        preferred_location: formData.preferred_location.trim() || null,
        preferred_religious_level:
          formData.preferred_religious_level.trim() || null,
        partner_description: formData.partner_description.trim() || null,
        deal_breakers: formData.deal_breakers.trim() || null,
      }

      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .insert(candidatePayload)
        .select('id')
        .single()

      if (candidateError || !candidateData) {
        throw new Error(
          candidateError?.message || "Erreur lors de la creation du profil"
        )
      }

      const candidateId = candidateData.id

      // 3. Upload photos
      if (photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i]
          const ext = photo.file.name.split('.').pop() || 'jpg'
          const filePath = `${candidateId}/${Date.now()}_${i}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('candidate-photos')
            .upload(filePath, photo.file, {
              cacheControl: '3600',
              upsert: false,
            })

          if (uploadError) {
            console.error('Photo upload error:', uploadError)
            continue
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from('candidate-photos').getPublicUrl(filePath)

          await supabase.from('candidate_photos').insert({
            candidate_id: candidateId,
            url: publicUrl,
            is_primary: i === 0,
            order_index: i,
            caption: null,
          })
        }
      }

      // 4. Update invitation status
      await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id)

      // 5. Clear localStorage
      try {
        localStorage.removeItem(storageKey)
      } catch {
        // Ignore
      }

      // 6. Revoke photo object URLs
      photos.forEach((p) => URL.revokeObjectURL(p.preview))

      setSubmitted(true)
    } catch (err) {
      console.error('Submit error:', err)
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue. Veuillez reessayer."
      )
    } finally {
      setSubmitting(false)
    }
  }, [invitation, formData, photos, supabase, storageKey])

  // --------------------------------------------------------
  // Render
  // --------------------------------------------------------

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-[#6B3A5B] animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#2D2D2D]/50">Chargement...</p>
        </div>
      </div>
    )
  }

  // Error states
  if (errorType) {
    const messages: Record<string, { title: string; message: string }> = {
      expired: {
        title: 'Ce lien d\'invitation a expire',
        message:
          'Le delai pour remplir ce formulaire est depasse. Veuillez contacter votre referente pour obtenir un nouveau lien.',
      },
      accepted: {
        title: 'Cette invitation a deja ete utilisee',
        message:
          'Un dossier a deja ete soumis avec ce lien d\'invitation. Si vous pensez qu\'il s\'agit d\'une erreur, contactez-nous.',
      },
      revoked: {
        title: 'Cette invitation a ete annulee',
        message:
          'Ce lien d\'invitation n\'est plus valide. Veuillez contacter votre referente pour plus d\'informations.',
      },
      not_found: {
        title: 'Lien d\'invitation invalide',
        message:
          'Ce lien ne correspond a aucune invitation. Verifiez que vous avez utilise le bon lien ou contactez votre referente.',
      },
    }
    const msg = messages[errorType]
    return <ErrorPage title={msg.title} message={msg.message} />
  }

  // Submitted
  if (submitted) {
    return <ConfirmationPage />
  }

  // Main form
  return (
    <div className="min-h-screen bg-[#FFFBF0]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E0D4]">
        <div className="max-w-xl mx-auto px-4 py-4">
          <Logo />
          <p className="text-center text-xs text-[#2D2D2D]/40 mt-1">
            Formulaire d&apos;inscription confidentiel
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-xl mx-auto px-4 py-6">
        <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      </div>

      {/* Form content */}
      <div className="max-w-xl mx-auto px-4 pb-32">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D4] p-6 sm:p-8">
          {currentStep === 1 && (
            <Step1Identity data={formData} onChange={updateFormData} />
          )}
          {currentStep === 2 && (
            <Step2Family data={formData} onChange={updateFormData} />
          )}
          {currentStep === 3 && (
            <Step3Religion data={formData} onChange={updateFormData} />
          )}
          {currentStep === 4 && (
            <Step4Personality data={formData} onChange={updateFormData} />
          )}
          {currentStep === 5 && (
            <Step5Preferences data={formData} onChange={updateFormData} />
          )}
          {currentStep === 6 && (
            <Step6Photos
              photos={photos}
              onAdd={addPhotos}
              onRemove={removePhoto}
            />
          )}
          {currentStep === 7 && (
            <Step7Review
              data={formData}
              photos={photos}
              confirmed={confirmed}
              onConfirm={setConfirmed}
            />
          )}

          {/* Submit error */}
          {submitError && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation buttons - fixed at bottom */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-[#E8E0D4] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={goPrev}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[#E8E0D4] text-[#2D2D2D]
                hover:bg-[#FFFBF0] transition-colors text-sm font-medium disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Precedent
            </button>
          ) : (
            <div />
          )}

          {currentStep < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6B3A5B] text-white
                hover:bg-[#5a3050] transition-colors text-sm font-medium
                disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!confirmed || submitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#87A878] text-white
                hover:bg-[#759a66] transition-colors text-sm font-medium
                disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4" />
                  Envoyer mon dossier
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
