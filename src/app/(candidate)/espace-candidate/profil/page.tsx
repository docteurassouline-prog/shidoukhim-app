'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Phone, MapPin, Heart, BookOpen, Briefcase } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { Candidate } from '@/lib/types'

export default function CandidateProfilePage() {
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: token } = await supabase
        .from('candidate_portal_tokens')
        .select('candidate_id')
        .eq('auth_user_id', user.id)
        .eq('is_active', true)
        .single()

      if (!token) return

      const { data } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', token.candidate_id)
        .single()

      if (data) setCandidate(data as Candidate)
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

  const religiousLabels: Record<string, string> = {
    tres_pratiquant: 'Très pratiquant(e)',
    pratiquant: 'Pratiquant(e)',
    traditionnel: 'Traditionnel(le)',
    liberal: 'Libéral(e)',
    autre: 'Autre',
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

      {/* Identity */}
      <section className="bg-white rounded-xl border border-[#E8E0D4] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#2D2D2D] flex items-center gap-2">
          <User className="h-5 w-5 text-[#6B3A5B]" />
          Identité
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Prénom" value={candidate.first_name} />
          <InfoField label="Nom" value={candidate.last_name} />
          {candidate.hebrew_name && <InfoField label="Prénom hébraïque" value={candidate.hebrew_name} />}
          {candidate.date_of_birth && <InfoField label="Date de naissance" value={new Date(candidate.date_of_birth).toLocaleDateString('fr-FR')} />}
          {candidate.age_estimate && <InfoField label="Âge" value={`${candidate.age_estimate} ans`} />}
          {candidate.nationality && <InfoField label="Nationalité" value={candidate.nationality} />}
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

      {/* Religious life */}
      <section className="bg-white rounded-xl border border-[#E8E0D4] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#2D2D2D] flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#6B3A5B]" />
          Vie religieuse
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {candidate.religious_level && <InfoField label="Niveau religieux" value={religiousLabels[candidate.religious_level] || candidate.religious_level} />}
          {candidate.community && <InfoField label="Communauté" value={candidate.community} />}
          {candidate.synagogue && <InfoField label="Synagogue" value={candidate.synagogue} />}
        </div>
      </section>

      {/* Professional */}
      <section className="bg-white rounded-xl border border-[#E8E0D4] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#2D2D2D] flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-[#6B3A5B]" />
          Parcours
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {candidate.education_level && <InfoField label="Études" value={candidate.education_level} />}
          {candidate.diploma && <InfoField label="Diplôme" value={candidate.diploma} />}
          {candidate.profession && <InfoField label="Profession" value={candidate.profession} />}
          {candidate.employer && <InfoField label="Employeur" value={candidate.employer} />}
        </div>
      </section>

      {/* What she's looking for */}
      <section className="bg-white rounded-xl border border-[#E8E0D4] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#2D2D2D] flex items-center gap-2">
          <Heart className="h-5 w-5 text-[#6B3A5B]" />
          Ce que je recherche
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(candidate.preferred_age_min || candidate.preferred_age_max) && (
            <InfoField
              label="Tranche d'âge"
              value={`${candidate.preferred_age_min || '?'} – ${candidate.preferred_age_max || '?'} ans`}
            />
          )}
          {candidate.preferred_location && <InfoField label="Lieu souhaité" value={candidate.preferred_location} />}
          {candidate.preferred_profession && <InfoField label="Profession souhaitée" value={candidate.preferred_profession} />}
          {candidate.preferred_religious_level && <InfoField label="Niveau religieux souhaité" value={candidate.preferred_religious_level} />}
        </div>
        {candidate.partner_description && (
          <div className="mt-4 p-4 bg-[#FFFBF0] rounded-lg border border-[#E8E0D4]">
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Description du partenaire idéal</p>
            <p className="text-sm text-[#2D2D2D]">{candidate.partner_description}</p>
          </div>
        )}
        {candidate.deal_breakers && (
          <div className="mt-2 p-4 bg-red-50 rounded-lg border border-red-100">
            <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Points rédhibitoires</p>
            <p className="text-sm text-[#2D2D2D]">{candidate.deal_breakers}</p>
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
