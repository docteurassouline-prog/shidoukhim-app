'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  getSettingsData,
  updateOrganizationName,
  updateProfile,
  updateOrganizationSettings,
} from '@/lib/settings/actions'
import type { UserProfile, Organization } from '@/lib/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import {
  Settings,
  Building2,
  User,
  Clock,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Feedback message component
// ---------------------------------------------------------------------------
function FeedbackMessage({
  type,
  message,
}: {
  type: 'success' | 'error'
  message: string
}) {
  if (!message) return null
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
        type === 'success'
          ? 'bg-sage-light text-sage-deep border border-sage/30'
          : 'bg-danger-light text-danger-deep border border-danger/25'
      }`}
      role="alert"
    >
      {type === 'success' ? (
        <CheckCircle className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      {message}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------
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
    <div className="rounded-[14px] border border-line bg-surface p-6 shadow-card">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-canvas">
          {icon}
        </div>
        <h2 className="font-display text-[22px] font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main settings page
// ---------------------------------------------------------------------------
export default function SettingsPage() {
  // ---- Global loading state ----
  const [pageLoading, setPageLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // ---- Organization form ----
  const [orgName, setOrgName] = useState('')
  const [orgSaving, setOrgSaving] = useState(false)
  const [orgFeedback, setOrgFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // ---- Profile form ----
  const [profileFullName, setProfileFullName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileFeedback, setProfileFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)


  // ---- Delays form ----
  const [relanceSansNouvellesJours, setRelanceSansNouvellesJours] = useState(30)
  const [relancePropositionJours, setRelancePropositionJours] = useState(7)
  const [expirationInvitationJours, setExpirationInvitationJours] = useState(7)
  const [delaysSaving, setDelaysSaving] = useState(false)
  const [delaysFeedback, setDelaysFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // ---- Fetch data on mount ----
  const loadData = useCallback(async () => {
    try {
      setPageLoading(true)

      const { profile: p, organization: o, isAdmin: admin } = await getSettingsData()

      if (p) {
        setProfile(p)
        setProfileFullName(p.full_name)
        setProfilePhone(p.phone || '')
        setIsAdmin(admin)
      }

      if (o) {
        setOrganization(o)
        setOrgName(o.name)

        // Load delay settings
        const settings = (o.settings || {}) as Record<string, unknown>
        setRelanceSansNouvellesJours(
          typeof settings.relance_sans_nouvelles_jours === 'number'
            ? settings.relance_sans_nouvelles_jours
            : 30
        )
        setRelancePropositionJours(
          typeof settings.relance_proposition_jours === 'number'
            ? settings.relance_proposition_jours
            : 7
        )
        setExpirationInvitationJours(
          typeof settings.expiration_invitation_jours === 'number'
            ? settings.expiration_invitation_jours
            : 7
        )
      }
    } finally {
      setPageLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ---- Clear feedback after 4s ----
  useEffect(() => {
    if (orgFeedback) {
      const t = setTimeout(() => setOrgFeedback(null), 4000)
      return () => clearTimeout(t)
    }
  }, [orgFeedback])

  useEffect(() => {
    if (profileFeedback) {
      const t = setTimeout(() => setProfileFeedback(null), 4000)
      return () => clearTimeout(t)
    }
  }, [profileFeedback])

  useEffect(() => {
    if (delaysFeedback) {
      const t = setTimeout(() => setDelaysFeedback(null), 4000)
      return () => clearTimeout(t)
    }
  }, [delaysFeedback])

  // ---- Save organization name ----
  async function handleSaveOrganization() {
    if (!orgName.trim()) return
    setOrgSaving(true)
    setOrgFeedback(null)

    const result = await updateOrganizationName(orgName)

    if (!result.success) {
      setOrgFeedback({
        type: 'error',
        message: `Erreur lors de la sauvegarde : ${result.error}`,
      })
    } else {
      setOrgFeedback({
        type: 'success',
        message: 'Nom de l’organisation mis à jour avec succès.',
      })
    }

    setOrgSaving(false)
  }

  // ---- Save profile ----
  async function handleSaveProfile() {
    if (!profile) return
    setProfileSaving(true)
    setProfileFeedback(null)

    const result = await updateProfile(profile.id, profileFullName, profilePhone)

    if (!result.success) {
      setProfileFeedback({
        type: 'error',
        message: `Erreur lors de la sauvegarde : ${result.error}`,
      })
    } else {
      setProfileFeedback({
        type: 'success',
        message: 'Profil mis à jour avec succès.',
      })
    }

    setProfileSaving(false)
  }

  // ---- Save delays ----
  async function handleSaveDelays() {
    if (!organization) return
    setDelaysSaving(true)
    setDelaysFeedback(null)

    const delaySettings = {
      relance_sans_nouvelles_jours: relanceSansNouvellesJours,
      relance_proposition_jours: relancePropositionJours,
      expiration_invitation_jours: expirationInvitationJours,
    }

    const result = await updateOrganizationSettings(delaySettings)

    if (!result.success) {
      setDelaysFeedback({
        type: 'error',
        message: `Erreur lors de la sauvegarde : ${result.error}`,
      })
    } else {
      // Update local org state with merged settings
      const currentSettings = (organization.settings || {}) as Record<string, unknown>
      const updatedSettings = { ...currentSettings, ...delaySettings }
      setOrganization({ ...organization, settings: updatedSettings })
      setDelaysFeedback({
        type: 'success',
        message: 'Délais de relance mis à jour avec succès.',
      })
    }

    setDelaysSaving(false)
  }

  // ---- Loading state ----
  if (pageLoading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-ink-soft">
          <Loader2 className="h-8 w-8 animate-spin text-sage" />
          <p className="text-sm">Chargement des paramètres...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage/10">
          <Settings className="h-5 w-5 text-sage" />
        </div>
        <div>
          <h1 className="text-[30px] font-semibold text-ink">
            Paramètres
          </h1>
          <p className="text-sm text-ink-soft">
            Gérez votre profil, votre organisation et vos préférences.
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1 — Organisation (admin only) */}
      {/* ============================================================ */}
      {isAdmin && (
        <SectionCard
          title="Organisation"
          icon={<Building2 className="h-5 w-5 text-gold" />}
        >
          <div className="space-y-4">
            <Input
              label="Nom de l'organisation"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Nom de votre organisation"
            />

            {orgFeedback && (
              <FeedbackMessage
                type={orgFeedback.type}
                message={orgFeedback.message}
              />
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleSaveOrganization}
                loading={orgSaving}
                disabled={!orgName.trim()}
                icon={<Save className="h-4 w-4" />}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ============================================================ */}
      {/* SECTION 2 — Mon profil */}
      {/* ============================================================ */}
      <SectionCard
        title="Mon profil"
        icon={<User className="h-5 w-5 text-sage" />}
      >
        <div className="space-y-4">
          <Input
            label="Nom complet"
            value={profileFullName}
            onChange={(e) => setProfileFullName(e.target.value)}
            placeholder="Votre nom complet"
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-ink mb-1.5">
              Adresse e-mail
            </label>
            <div className="flex h-10 items-center rounded-lg border border-line bg-stone-50 px-3 text-sm text-ink-soft">
              {profile?.email || '—'}
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              L&apos;adresse e-mail ne peut pas être modifiée ici.
            </p>
          </div>

          <Input
            label="Téléphone"
            inputType="tel"
            value={profilePhone}
            onChange={(e) => setProfilePhone(e.target.value)}
            placeholder="+33 6 12 34 56 78"
          />

          {profileFeedback && (
            <FeedbackMessage
              type={profileFeedback.type}
              message={profileFeedback.message}
            />
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSaveProfile}
              loading={profileSaving}
              disabled={!profileFullName.trim()}
              icon={<Save className="h-4 w-4" />}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* ============================================================ */}
      {/* SECTION 3 — Délais de relance (admin only) */}
      {/* ============================================================ */}
      {isAdmin && (
        <SectionCard
          title="Délais de relance"
          icon={<Clock className="h-5 w-5 text-gold" />}
        >
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">
              Configurez les délais automatiques utilisés pour les relances et
              les invitations.
            </p>

            <Input
              label="Jours sans nouvelles avant relance"
              inputType="number"
              value={relanceSansNouvellesJours}
              onChange={(e) =>
                setRelanceSansNouvellesJours(
                  Math.max(1, parseInt(e.target.value) || 1)
                )
              }
              min={1}
              helperText="Nombre de jours d'inactivité d'un candidat avant qu'une relance soit suggérée."
            />

            <Input
              label="Jours sans retour sur proposition"
              inputType="number"
              value={relancePropositionJours}
              onChange={(e) =>
                setRelancePropositionJours(
                  Math.max(1, parseInt(e.target.value) || 1)
                )
              }
              min={1}
              helperText="Nombre de jours sans réponse à une proposition avant relance."
            />

            <Input
              label="Durée de validité des invitations (jours)"
              inputType="number"
              value={expirationInvitationJours}
              onChange={(e) =>
                setExpirationInvitationJours(
                  Math.max(1, parseInt(e.target.value) || 1)
                )
              }
              min={1}
              helperText="Nombre de jours avant qu'une invitation d'équipe expire."
            />

            {delaysFeedback && (
              <FeedbackMessage
                type={delaysFeedback.type}
                message={delaysFeedback.message}
              />
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleSaveDelays}
                loading={delaysSaving}
                icon={<Save className="h-4 w-4" />}
              >
                Enregistrer les délais
              </Button>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  )
}
