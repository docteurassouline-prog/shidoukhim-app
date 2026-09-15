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
import {
  courantOptions,
  hassidoutOptions,
  nousahOptions,
  headCoveringOptions,
  shabbatPracticeOptions,
  kashrutLevelOptions,
  tsnioutOptions,
  communityEthnicOptions,
  childrenEducationOptions,
  getCourantLabel,
  getHassidoutLabel,
  getNousahLabel,
  getHeadCoveringLabel,
  getShabbatPracticeLabel,
  getKashrutLevelLabel,
  getTsnioutLabel,
  getCommunityEthnicLabel,
  getChildrenEducationLabel,
} from '@/lib/constants/orthodox'

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

const MARITAL_STATUS_OPTIONS = [
  { value: '', label: 'Sélectionnez...' },
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'divorcee', label: 'Divorcée' },
  { value: 'veuve', label: 'Veuve' },
]

// ============================================================
// Form data shape
// ============================================================

interface FormData {
  // Step 1 - Identité
  first_name: string
  last_name: string
  date_of_birth: string
  city: string
  country: string
  phone: string
  email: string

  // Step 2 - Situation familiale
  marital_status: string
  has_children: boolean
  children_details: string
  family_context: string

  // Step 3 - Vie religieuse
  courant: string
  hassidout: string
  nousah: string
  community: string
  head_covering: string
  shabbat_practice: string
  kashrut_level: string
  tsniout: string
  traditions_minhaguim: string

  // Step 4 - Personnalité et parcours
  profession: string
  studies: string
  interests: string
  temperament: string

  // Step 5 - Ce que vous recherchez
  age_min: number | ''
  age_max: number | ''
  preferred_cities: string
  children_education: string
  religious_home_project: string
  ideal_husband: string
  incompatibilities: string
}

const INITIAL_FORM_DATA: FormData = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  city: '',
  country: '',
  phone: '',
  email: '',
  marital_status: '',
  has_children: false,
  children_details: '',
  family_context: '',
  courant: '',
  hassidout: '',
  nousah: '',
  community: '',
  head_covering: '',
  shabbat_practice: '',
  kashrut_level: '',
  tsniout: '',
  traditions_minhaguim: '',
  profession: '',
  studies: '',
  interests: '',
  temperament: '',
  age_min: '',
  age_max: '',
  preferred_cities: '',
  children_education: '',
  religious_home_project: '',
  ideal_husband: '',
  incompatibilities: '',
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
      <Heart className="h-7 w-7 text-plum fill-plum/20" />
      <span className="text-2xl font-bold tracking-tight text-ink">
        Hava Dahan
      </span>
      <Sparkles className="h-5 w-5 text-gold" />
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
                      ? 'bg-sage text-white'
                      : isCurrent
                        ? 'bg-plum text-white ring-4 ring-plum/20'
                        : 'bg-line text-ink/50'
                  }
                `}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step}
              </div>
              <span
                className={`
                  text-[10px] mt-1 text-center leading-tight hidden sm:block
                  ${isCurrent ? 'text-plum font-semibold' : 'text-ink/50'}
                `}
              >
                {STEP_LABELS[i]}
              </span>
            </div>
          )
        })}
      </div>
      {/* Progress bar */}
      <div className="h-2 bg-line rounded-full overflow-hidden mt-2">
        <div
          className="h-full bg-gradient-to-r from-sage to-plum rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
          }}
        />
      </div>
      {/* Mobile step label */}
      <p className="text-center text-sm text-plum font-medium mt-2 sm:hidden">
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
      <label className="block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-danger-deep ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-ink/50">{hint}</p>}
    </div>
  )
}

const inputClass =
  'w-full px-4 py-3 rounded-[14px] border border-line bg-surface text-ink text-base ' +
  'placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-sage/40 ' +
  'focus:border-sage transition-all'

const selectClass =
  'w-full px-4 py-3 rounded-[14px] border border-line bg-surface text-ink text-base ' +
  'focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage transition-all ' +
  'appearance-none cursor-pointer'

const textareaClass =
  'w-full px-4 py-3 rounded-[14px] border border-line bg-surface text-ink text-base ' +
  'placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-sage/40 ' +
  'focus:border-sage transition-all resize-none'

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
          ${checked ? 'bg-sage' : 'bg-line'}
        `}
      >
        <div
          className={`
            absolute top-0.5 w-6 h-6 rounded-full bg-surface shadow-card-hover transition-transform duration-200
            ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}
          `}
        />
      </div>
      <span className="text-sm font-medium text-ink group-hover:text-plum transition-colors">
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
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-surface rounded-3xl shadow-lg p-8 border border-line">
          <div className="w-20 h-20 rounded-full bg-plum/10 flex items-center justify-center mx-auto mb-6">
            <Heart className="h-10 w-10 text-plum" />
          </div>
          <h1 className="text-[26px] font-semibold text-ink mb-3">{title}</h1>
          <p className="text-ink/60 leading-relaxed">{message}</p>
          <div className="mt-8 flex items-center justify-center gap-1 text-sm text-ink/30">
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
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-surface rounded-3xl shadow-lg p-8 border border-line">
          <div className="w-20 h-20 rounded-full bg-sage/10 flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-sage" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-gold" />
            <h1 className="text-[30px] font-semibold text-ink">Merci !</h1>
            <Sparkles className="h-5 w-5 text-gold" />
          </div>
          <p className="text-ink/70 leading-relaxed text-lg mb-2">
            Votre dossier a ete transmis avec succes.
          </p>
          <p className="text-ink/50 text-sm leading-relaxed">
            Nous examinons votre profil avec soin et vous contacterons prochainement.
            Que ce soit le debut d&apos;une belle histoire...
          </p>
          <div className="mt-8 pt-6 border-t border-line">
            <div className="flex items-center justify-center gap-2 text-sm text-plum">
              <Heart className="h-4 w-4 fill-plum/20" />
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
        <h2 className="font-display text-[24px] font-semibold text-ink">Votre identite</h2>
        <p className="text-sm text-ink/50 mt-1">
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
        <h2 className="font-display text-[24px] font-semibold text-ink">Situation familiale</h2>
        <p className="text-sm text-ink/50 mt-1">
          Ces informations restent strictement confidentielles
        </p>
      </div>

      <FormField label="Situation matrimoniale">
        <select
          className={selectClass}
          value={data.marital_status}
          onChange={(e) => onChange({ marital_status: e.target.value })}
        >
          {MARITAL_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>

      <div className="bg-canvas rounded-xl p-4 border border-line/50">
        <Toggle
          checked={data.has_children}
          onChange={(v) =>
            onChange({
              has_children: v,
              ...(!v ? { children_details: '' } : {}),
            })
          }
          label="Avez-vous des enfants ?"
        />

        {data.has_children && (
          <div className="mt-4 space-y-4 pl-1">
            <FormField label="Détails (nombre, âges, garde, etc.)" hint="Informations utiles pour le shidoukh">
              <textarea
                className={textareaClass}
                rows={3}
                placeholder="Ex : 2 enfants (8 ans et 5 ans), garde alternée"
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
          value={data.family_context}
          onChange={(e) => onChange({ family_context: e.target.value })}
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
        <h2 className="font-display text-[24px] font-semibold text-ink">Vie religieuse</h2>
        <p className="text-sm text-ink/50 mt-1">
          Pour mieux vous connaitre et trouver la compatibilite ideale
        </p>
      </div>

      <FormField label="Courant religieux">
        <select
          className={selectClass}
          value={data.courant}
          onChange={(e) => onChange({ courant: e.target.value })}
        >
          {courantOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>

      {data.courant === 'haredi_hassidique' && (
        <FormField label="Hassidout">
          <select
            className={selectClass}
            value={data.hassidout}
            onChange={(e) => onChange({ hassidout: e.target.value })}
          >
            {hassidoutOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>
      )}

      <FormField label="Communauté ethnique">
        <select
          className={selectClass}
          value={data.community}
          onChange={(e) => onChange({ community: e.target.value })}
        >
          {communityEthnicOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Nousah (rite de prière)">
        <select
          className={selectClass}
          value={data.nousah}
          onChange={(e) => onChange({ nousah: e.target.value })}
        >
          {nousahOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Pratique du Chabbat">
        <select
          className={selectClass}
          value={data.shabbat_practice}
          onChange={(e) => onChange({ shabbat_practice: e.target.value })}
        >
          {shabbatPracticeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Niveau de cacheroute">
        <select
          className={selectClass}
          value={data.kashrut_level}
          onChange={(e) => onChange({ kashrut_level: e.target.value })}
        >
          {kashrutLevelOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Tsniout (pudeur vestimentaire)">
        <select
          className={selectClass}
          value={data.tsniout}
          onChange={(e) => onChange({ tsniout: e.target.value })}
        >
          {tsnioutOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Couverture de cheveux">
        <select
          className={selectClass}
          value={data.head_covering}
          onChange={(e) => onChange({ head_covering: e.target.value })}
        >
          {headCoveringOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Traditions et minhaguim" hint="Coutumes familiales particulières">
        <textarea
          className={textareaClass}
          rows={3}
          placeholder="Ex : minhag marocain, kiddouch le vendredi soir en famille..."
          value={data.traditions_minhaguim}
          onChange={(e) => onChange({ traditions_minhaguim: e.target.value })}
        />
      </FormField>
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
        <h2 className="font-display text-[24px] font-semibold text-ink">Personnalite et parcours</h2>
        <p className="text-sm text-ink/50 mt-1">
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

      <FormField label="Études / Diplômes">
        <input
          type="text"
          className={inputClass}
          placeholder="Ex : Master en droit, Séminaire Beth Yaakov..."
          value={data.studies}
          onChange={(e) => onChange({ studies: e.target.value })}
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
        <h2 className="font-display text-[24px] font-semibold text-ink">Ce que vous recherchez</h2>
        <p className="text-sm text-ink/50 mt-1">
          Decrivez le partenaire avec qui vous vous verriez partager votre vie
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Âge minimum">
          <input
            type="number"
            min={18}
            max={99}
            className={inputClass}
            placeholder="25"
            value={data.age_min}
            onChange={(e) =>
              onChange({
                age_min: e.target.value === '' ? '' : Number(e.target.value),
              })
            }
          />
        </FormField>
        <FormField label="Âge maximum">
          <input
            type="number"
            min={18}
            max={99}
            className={inputClass}
            placeholder="40"
            value={data.age_max}
            onChange={(e) =>
              onChange({
                age_max: e.target.value === '' ? '' : Number(e.target.value),
              })
            }
          />
        </FormField>
      </div>

      <FormField label="Villes souhaitées">
        <input
          type="text"
          className={inputClass}
          placeholder="Paris, Tel Aviv, Londres..."
          value={data.preferred_cities}
          onChange={(e) => onChange({ preferred_cities: e.target.value })}
        />
      </FormField>

      <FormField label="Éducation des enfants souhaitée">
        <select
          className={selectClass}
          value={data.children_education}
          onChange={(e) => onChange({ children_education: e.target.value })}
        >
          {childrenEducationOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Projet religieux du foyer" hint="Comment imaginez-vous la vie religieuse de votre couple ?">
        <textarea
          className={textareaClass}
          rows={3}
          placeholder="Ex : foyer chaleureux, table de Chabbat ouverte..."
          value={data.religious_home_project}
          onChange={(e) => onChange({ religious_home_project: e.target.value })}
        />
      </FormField>

      <FormField label="Description du mari idéal" hint="Personnalité, valeurs, mode de vie...">
        <textarea
          className={textareaClass}
          rows={4}
          placeholder="Je recherche quelqu'un qui..."
          value={data.ideal_husband}
          onChange={(e) => onChange({ ideal_husband: e.target.value })}
        />
      </FormField>

      <FormField label="Points rédhibitoires" hint="Ce que vous ne pourriez pas accepter">
        <textarea
          className={textareaClass}
          rows={3}
          placeholder="Il est important pour moi que..."
          value={data.incompatibilities}
          onChange={(e) => onChange({ incompatibilities: e.target.value })}
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
        <h2 className="font-display text-[24px] font-semibold text-ink">Photos</h2>
        <p className="text-sm text-ink/50 mt-1">
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
                ? 'border-sage bg-sage/5'
                : 'border-line hover:border-sage/50 hover:bg-sage/5'
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
          <Upload className="h-10 w-10 text-sage mx-auto mb-3" />
          <p className="text-sm text-ink/70 font-medium">
            Glissez vos photos ici ou cliquez pour selectionner
          </p>
          <p className="text-xs text-ink/40 mt-1">
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
              className="relative group aspect-square rounded-xl overflow-hidden border border-line bg-line/20"
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
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-danger text-white flex items-center justify-center
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
        <p className="text-center text-sm text-ink/40 italic">
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
            MARITAL_STATUS_OPTIONS.find((o) => o.value === data.marital_status)
              ?.label || data.marital_status,
        },
        { label: 'Enfants', value: data.has_children ? 'Oui' : 'Non' },
        ...(data.has_children
          ? [{ label: 'Détails', value: data.children_details }]
          : []),
        { label: 'Contexte familial', value: data.family_context },
      ],
    },
    {
      title: 'Vie religieuse',
      fields: [
        { label: 'Courant', value: getCourantLabel(data.courant) },
        ...(data.hassidout ? [{ label: 'Hassidout', value: getHassidoutLabel(data.hassidout) }] : []),
        { label: 'Communauté', value: getCommunityEthnicLabel(data.community) },
        { label: 'Nousah', value: getNousahLabel(data.nousah) },
        { label: 'Chabbat', value: getShabbatPracticeLabel(data.shabbat_practice) },
        { label: 'Cacheroute', value: getKashrutLevelLabel(data.kashrut_level) },
        { label: 'Tsniout', value: getTsnioutLabel(data.tsniout) },
        { label: 'Couverture', value: getHeadCoveringLabel(data.head_covering) },
        { label: 'Traditions', value: data.traditions_minhaguim },
      ],
    },
    {
      title: 'Personnalité et parcours',
      fields: [
        { label: 'Profession', value: data.profession },
        { label: 'Études', value: data.studies },
        { label: "Centres d'intérêt", value: data.interests },
        { label: 'Tempérament', value: data.temperament },
      ],
    },
    {
      title: 'Ce que vous recherchez',
      fields: [
        {
          label: "Tranche d'âge",
          value:
            data.age_min || data.age_max
              ? `${data.age_min || '?'} - ${data.age_max || '?'} ans`
              : '',
        },
        { label: 'Villes souhaitées', value: data.preferred_cities },
        { label: 'Éducation des enfants', value: getChildrenEducationLabel(data.children_education) },
        { label: 'Projet religieux du foyer', value: data.religious_home_project },
        { label: 'Mari idéal', value: data.ideal_husband },
        { label: 'Points rédhibitoires', value: data.incompatibilities },
      ],
    },
  ]

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="font-display text-[24px] font-semibold text-ink">Verification</h2>
        <p className="text-sm text-ink/50 mt-1">
          Relisez vos informations avant envoi
        </p>
      </div>

      {sections.map((section) => (
        <div
          key={section.title}
          className="bg-canvas rounded-[14px] border border-line/50 p-4"
        >
          <h3 className="text-sm font-bold text-plum mb-3 uppercase tracking-wider">
            {section.title}
          </h3>
          <div className="space-y-2">
            {section.fields.map((field) => (
              <div
                key={field.label}
                className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2"
              >
                <span className="text-xs font-medium text-ink/50 sm:w-40 shrink-0">
                  {field.label}
                </span>
                <span className="text-sm text-ink break-words">
                  {field.value || (
                    <span className="text-ink/30 italic">Non renseigne</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {photos.length > 0 && (
        <div className="bg-canvas rounded-[14px] border border-line/50 p-4">
          <h3 className="text-sm font-bold text-plum mb-3 uppercase tracking-wider">
            Photos ({photos.length})
          </h3>
          <div className="flex gap-2 flex-wrap">
            {photos.map((photo, i) => (
              <div
                key={i}
                className="w-16 h-16 rounded-lg overflow-hidden border border-line"
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
      <div className="bg-surface rounded-[14px] border border-line p-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="pt-0.5">
            <div
              className={`
                w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                ${
                  confirmed
                    ? 'bg-sage border-sage'
                    : 'border-line group-hover:border-sage/50'
                }
              `}
              onClick={() => onConfirm(!confirmed)}
            >
              {confirmed && <Check className="h-4 w-4 text-white" />}
            </div>
          </div>
          <span
            className="text-sm text-ink leading-relaxed select-none"
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
        status: 'brouillon' as const,
        availability: 'a_confirmer' as const,

        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        date_of_birth: formData.date_of_birth || null,
        age_estimate: ageEstimate,
        is_age_estimate: isAgeEstimate,
        city: formData.city.trim() || null,
        country: formData.country.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,

        marital_status: formData.marital_status || null,
        has_children: formData.has_children,
        children_details:
          formData.has_children && formData.children_details.trim()
            ? formData.children_details.trim()
            : null,
        family_context: formData.family_context.trim() || null,

        courant: formData.courant || null,
        hassidout: formData.courant === 'haredi_hassidique' ? (formData.hassidout || null) : null,
        nousah: formData.nousah || null,
        community: formData.community || null,
        head_covering: formData.head_covering || null,
        shabbat_practice: formData.shabbat_practice || null,
        kashrut_level: formData.kashrut_level || null,
        tsniout: formData.tsniout || null,
        traditions_minhaguim: formData.traditions_minhaguim.trim() || null,

        profession: formData.profession.trim() || null,
        studies: formData.studies.trim() || null,
        interests: formData.interests.trim() || null,
        temperament: formData.temperament.trim() || null,

        age_min:
          formData.age_min !== ''
            ? Number(formData.age_min)
            : null,
        age_max:
          formData.age_max !== ''
            ? Number(formData.age_max)
            : null,
        preferred_cities: formData.preferred_cities.trim() || null,
        children_education: formData.children_education || null,
        religious_home_project: formData.religious_home_project.trim() || null,
        ideal_husband: formData.ideal_husband.trim() || null,
        incompatibilities: formData.incompatibilities.trim() || null,
        origin_channel: 'invitation',
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
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-plum animate-spin mx-auto mb-4" />
          <p className="text-sm text-ink/50">Chargement...</p>
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
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="bg-surface border-b border-line">
        <div className="max-w-xl mx-auto px-4 py-4">
          <Logo />
          <p className="text-center text-xs text-ink/40 mt-1">
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
        <div className="bg-surface rounded-2xl shadow-card border border-line p-6 sm:p-8">
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
            <div className="mt-4 p-4 rounded-xl bg-danger-light border border-danger/25 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-danger-deep shrink-0 mt-0.5" />
              <p className="text-sm text-danger-deep">{submitError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation buttons - fixed at bottom */}
      <div className="fixed bottom-0 inset-x-0 bg-surface border-t border-line shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={goPrev}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-3 rounded-[14px] border border-line text-ink
                hover:bg-canvas transition-colors text-sm font-medium disabled:opacity-50"
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
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-plum text-white
                hover:bg-plum-hover transition-colors text-sm font-medium
                disabled:opacity-40 disabled:cursor-not-allowed shadow-card"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!confirmed || submitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-sage text-white
                hover:bg-sage-hover transition-colors text-sm font-medium
                disabled:opacity-40 disabled:cursor-not-allowed shadow-card"
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
