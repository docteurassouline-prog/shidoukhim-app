'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Phone, MapPin, Heart, BookOpen, Briefcase } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
  getCourantLabel,
  getHassidoutLabel,
  getNousahLabel,
  getKipaTypeLabel,
  getHeadCoveringLabel,
  getShabbatPracticeLabel,
  getKashrutLevelLabel,
  getTsnioutLabel,
  getCommunityEthnicLabel,
  getChildrenEducationLabel,
} from '@/lib/constants/orthodox'

interface CandidateRow {
  first_name: string
  last_name: string
  hebrew_name: string | null
  date_of_birth: string | null
  age_estimate: number | null
  city: string | null
  country: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  courant: string | null
  hassidout: string | null
  nousah: string | null
  community: string | null
  synagogue: string | null
  rabbi_reference: string | null
  school_seminary: string | null
  shabbat_practice: string | null
  kashrut_level: string | null
  tsniout: string | null
  traditions_minhaguim: string | null
  prayer_study: string | null
  religious_home_project: string | null
  children_education: string | null
  profession: string | null
  studies: string | null
  interests: string | null
  temperament: string | null
  age_min: number | null
  age_max: number | null
  preferred_cities: string | null
  expected_qualities: string | null
  expected_values: string | null
  incompatibilities: string | null
  // women-specific
  head_covering?: string | null
  ideal_husband?: string | null
  // men-specific
  kipa_type?: string | null
  torah_study?: string | null
}

export default function CandidateProfilePage() {
  const [candidate, setCandidate] = useState<CandidateRow | null>(null)
  const [candidateType, setCandidateType] = useState<'woman' | 'man'>('woman')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: token } = await supabase
        .from('candidate_portal_tokens')
        .select('candidate_id, candidate_type')
        .eq('auth_user_id', user.id)
        .eq('is_active', true)
        .single()

      if (!token) return

      const type: 'woman' | 'man' = token.candidate_type === 'man' ? 'man' : 'woman'
      setCandidateType(type)

      const table = type === 'woman' ? 'candidates' : 'candidates_men'
      const { data } = await supabase
        .from(table)
        .select('*')
        .eq('id', token.candidate_id)
        .single()

      if (data) setCandidate(data as CandidateRow)
      setLoading(false)
    }
    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="text-center py-16">
        <p className="text-[#6B7280]">Profil introuvable.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#6B3A5B]">Mon profil</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Les informations que votre chadkhanit utilise pour vous trouver la bonne personne.
          Pour toute modification, contactez Hava directement.
        </p>
      </div>

      {/* Identité */}
      <section className="bg-white rounded-xl border border-[#E8E0D4] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#2D2D2D] flex items-center gap-2">
          <User className="h-5 w-5 text-[#6B3A5B]" />
          Identité
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Prénom" value={candidate.first_name} />
          <InfoField label="Nom" value={candidate.last_name} />
          {candidate.hebrew_name && <InfoField label="Nom hébraïque" value={candidate.hebrew_name} />}
          {candidate.date_of_birth && <InfoField label="Date de naissance" value={new Date(candidate.date_of_birth).toLocaleDateString('fr-FR')} />}
          {candidate.age_estimate && <InfoField label="Âge" value={`${candidate.age_estimate} ans`} />}
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white rounded-xl border border-[#E8E0D4] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#2D2D2D] flex items-center gap-2">
          <Mail className="h-5 w-5 text-[#6B3A5B]" />
          Contact
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {candidate.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-[#6B7280]" />
              <span>{candidate.email}</span>
            </div>
          )}
          {candidate.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-[#6B7280]" />
              <span>{candidate.phone}</span>
            </div>
          )}
          {candidate.city && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-[#6B7280]" />
              <span>{candidate.city}{candidate.country ? `, ${candidate.country}` : ''}</span>
            </div>
          )}
        </div>
      </section>

      {/* Vie religieuse */}
      <section className="bg-white rounded-xl border border-[#E8E0D4] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#2D2D2D] flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#6B3A5B]" />
          Vie religieuse
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {candidate.courant && <InfoField label="Courant" value={getCourantLabel(candidate.courant)} />}
          {candidate.hassidout && <InfoField label="Hassidout" value={getHassidoutLabel(candidate.hassidout)} />}
          {candidate.nousah && <InfoField label="Nousah" value={getNousahLabel(candidate.nousah)} />}
          {candidate.community && <InfoField label="Communauté" value={getCommunityEthnicLabel(candidate.community)} />}
          {candidate.synagogue && <InfoField label="Synagogue" value={candidate.synagogue} />}
          {candidate.rabbi_reference && <InfoField label="Référence rabbinique" value={candidate.rabbi_reference} />}
          {candidate.school_seminary && <InfoField label={candidateType === 'man' ? 'Yeshiva / École' : 'Séminaire / École'} value={candidate.school_seminary} />}
          {candidate.shabbat_practice && <InfoField label="Chabbat" value={getShabbatPracticeLabel(candidate.shabbat_practice)} />}
          {candidate.kashrut_level && <InfoField label="Cacheroute" value={getKashrutLevelLabel(candidate.kashrut_level)} />}
          {candidate.tsniout && <InfoField label="Tsniout" value={getTsnioutLabel(candidate.tsniout)} />}
          {candidateType === 'man' && candidate.kipa_type && <InfoField label="Kipa" value={getKipaTypeLabel(candidate.kipa_type)} />}
          {candidateType === 'woman' && candidate.head_covering && <InfoField label="Couverture de cheveux" value={getHeadCoveringLabel(candidate.head_covering)} />}
        </div>
        {candidate.traditions_minhaguim && (
          <div className="mt-2">
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Traditions & Minhaguim</p>
            <p className="text-sm text-[#2D2D2D]">{candidate.traditions_minhaguim}</p>
          </div>
        )}
        {candidate.prayer_study && (
          <div className="mt-2">
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Prière / Étude</p>
            <p className="text-sm text-[#2D2D2D]">{candidate.prayer_study}</p>
          </div>
        )}
        {candidateType === 'man' && candidate.torah_study && (
          <div className="mt-2">
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Étude de Torah</p>
            <p className="text-sm text-[#2D2D2D]">{candidate.torah_study}</p>
          </div>
        )}
      </section>

      {/* Parcours */}
      <section className="bg-white rounded-xl border border-[#E8E0D4] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#2D2D2D] flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-[#6B3A5B]" />
          Parcours
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {candidate.studies && <InfoField label="Études" value={candidate.studies} />}
          {candidate.profession && <InfoField label="Profession" value={candidate.profession} />}
        </div>
        {candidate.interests && (
          <div className="mt-2">
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Centres d'intérêt</p>
            <p className="text-sm text-[#2D2D2D]">{candidate.interests}</p>
          </div>
        )}
        {candidate.temperament && (
          <div className="mt-2">
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Tempérament</p>
            <p className="text-sm text-[#2D2D2D]">{candidate.temperament}</p>
          </div>
        )}
      </section>

      {/* Attentes */}
      <section className="bg-white rounded-xl border border-[#E8E0D4] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#2D2D2D] flex items-center gap-2">
          <Heart className="h-5 w-5 text-[#6B3A5B]" />
          Ce que je recherche
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(candidate.age_min || candidate.age_max) && (
            <InfoField
              label="Tranche d'âge"
              value={`${candidate.age_min || '?'} – ${candidate.age_max || '?'} ans`}
            />
          )}
          {candidate.preferred_cities && <InfoField label="Villes souhaitées" value={candidate.preferred_cities} />}
          {candidate.children_education && <InfoField label="Éducation des enfants" value={getChildrenEducationLabel(candidate.children_education)} />}
        </div>
        {candidate.religious_home_project && (
          <div className="mt-2 p-4 bg-[#FFFBF0] rounded-lg border border-[#E8E0D4]">
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Projet religieux du foyer</p>
            <p className="text-sm text-[#2D2D2D]">{candidate.religious_home_project}</p>
          </div>
        )}
        {candidate.expected_qualities && (
          <div className="mt-2">
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Qualités recherchées</p>
            <p className="text-sm text-[#2D2D2D]">{candidate.expected_qualities}</p>
          </div>
        )}
        {candidate.expected_values && (
          <div className="mt-2">
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Valeurs attendues</p>
            <p className="text-sm text-[#2D2D2D]">{candidate.expected_values}</p>
          </div>
        )}
        {candidateType === 'woman' && candidate.ideal_husband && (
          <div className="mt-2 p-4 bg-[#FFFBF0] rounded-lg border border-[#E8E0D4]">
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Description du mari idéal</p>
            <p className="text-sm text-[#2D2D2D]">{candidate.ideal_husband}</p>
          </div>
        )}
        {candidate.incompatibilities && (
          <div className="mt-2 p-4 bg-red-50 rounded-lg border border-red-100">
            <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Points rédhibitoires</p>
            <p className="text-sm text-[#2D2D2D]">{candidate.incompatibilities}</p>
          </div>
        )}
      </section>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6B7280] uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-[#2D2D2D] mt-0.5">{value}</p>
    </div>
  )
}
