'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Users,
  Mail,
  Phone,
  FileText,
  Send,
  UserPlus,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  X,
  Shield,
  Crown,
  Eye,
  Handshake,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile, UserRole } from '@/lib/types'
import { cn, formatDate } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

interface UserWithStats extends UserProfile {
  candidatesWomenCount: number
  candidatesMenCount: number
  activeProposalsCount: number
}

const ROLE_CONFIG: Record<UserRole, { label: string; bg: string; text: string; icon: typeof Crown }> = {
  admin: {
    label: 'Administratrice',
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    icon: Crown,
  },
  chadkhanit: {
    label: 'Chadkhanit',
    bg: 'bg-[#87A878]/15',
    text: 'text-[#5A7A4A]',
    icon: Handshake,
  },
  assistante: {
    label: 'Assistante',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    icon: Shield,
  },
  viewer: {
    label: 'Lectrice',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    icon: Eye,
  },
}

const ROLE_OPTIONS = [
  { value: 'chadkhanit', label: 'Chadkhanit' },
  { value: 'assistante', label: 'Assistante' },
  { value: 'viewer', label: 'Lectrice' },
]

const ROLE_OPTIONS_WITH_ADMIN = [
  { value: 'admin', label: 'Administratrice' },
  ...ROLE_OPTIONS,
]

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export default function ChadkhaniotPage() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Invitation form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('chadkhanit')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)

  // Role change state
  const [roleChangeUserId, setRoleChangeUserId] = useState<string | null>(null)
  const [roleChangeValue, setRoleChangeValue] = useState<string>('')
  const [roleChangeLoading, setRoleChangeLoading] = useState(false)

  const supabase = createClient()

  const isAdmin = currentUser?.role === 'admin'

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get authenticated user
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData.user) {
        setError('Impossible de recuperer votre session. Veuillez vous reconnecter.')
        setLoading(false)
        return
      }

      // Get current user profile
      const { data: currentProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .eq('organization_id', ORG_ID)
        .single()

      if (profileError || !currentProfile) {
        setError('Profil utilisateur introuvable.')
        setLoading(false)
        return
      }

      setCurrentUser(currentProfile as UserProfile)

      // Fetch all active users in the organization
      const { data: allUsers, error: usersError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('organization_id', ORG_ID)
        .eq('is_active', true)
        .order('full_name', { ascending: true })

      if (usersError) {
        setError('Erreur lors du chargement de l\'equipe.')
        setLoading(false)
        return
      }

      if (!allUsers || allUsers.length === 0) {
        setUsers([])
        setLoading(false)
        return
      }

      // Fetch stats for each user
      const usersWithStats: UserWithStats[] = await Promise.all(
        (allUsers as UserProfile[]).map(async (user) => {
          // Count active women candidates
          const { count: womenCount } = await supabase
            .from('candidates')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', user.id)
            .eq('status', 'active')

          // Count active men candidates
          const { count: menCount } = await supabase
            .from('candidates_men')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', user.id)
            .eq('status', 'active')

          // Count active proposals (not in terminal statuses)
          const terminalStatuses = [
            'cancelled',
            'declined_woman',
            'declined_man',
            'declined_both',
            'married',
          ]
          const { count: proposalsCount } = await supabase
            .from('proposals')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', user.id)
            .not('status', 'in', `(${terminalStatuses.join(',')})`)

          return {
            ...user,
            candidatesWomenCount: womenCount ?? 0,
            candidatesMenCount: menCount ?? 0,
            activeProposalsCount: proposalsCount ?? 0,
          }
        })
      )

      setUsers(usersWithStats)
    } catch {
      setError('Une erreur inattendue est survenue.')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteError('Veuillez saisir une adresse email.')
      return
    }

    if (!currentUser) return

    setInviteLoading(true)
    setInviteError(null)
    setInviteSuccess(null)

    try {
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { error: insertError } = await supabase.from('invitations').insert({
        organization_id: ORG_ID,
        invited_by: currentUser.id,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole as UserRole,
        status: 'pending',
        token,
        expires_at: expiresAt.toISOString(),
      })

      if (insertError) {
        setInviteError(`Erreur lors de l'envoi : ${insertError.message}`)
        return
      }

      const inviteLink = `${window.location.origin}/invite/${token}`
      setInviteSuccess(inviteLink)
      setInviteEmail('')
      setInviteRole('chadkhanit')
    } catch {
      setInviteError('Erreur inattendue lors de la creation de l\'invitation.')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRoleChange = async (userId: string) => {
    if (!roleChangeValue || roleChangeValue === '') return

    setRoleChangeLoading(true)

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: roleChangeValue as UserRole })
        .eq('id', userId)
        .eq('organization_id', ORG_ID)

      if (updateError) {
        setError(`Erreur lors du changement de role : ${updateError.message}`)
        return
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: roleChangeValue as UserRole } : u
        )
      )
      setRoleChangeUserId(null)
      setRoleChangeValue('')
    } catch {
      setError('Erreur inattendue lors du changement de role.')
    } finally {
      setRoleChangeLoading(false)
    }
  }

  // ----- Loading state -----
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <LoadingSpinner text="Chargement de l'equipe..." size="lg" />
      </div>
    )
  }

  // ----- Error state -----
  if (error && users.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-[#E8E0D4] p-8 text-center">
            <AlertCircle className="h-12 w-12 text-[#C45B5B] mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-[#2D2D2D] mb-2">Erreur</h2>
            <p className="text-sm text-[#6B7280] mb-4">{error}</p>
            <Button variant="primary" onClick={fetchData}>
              Reessayer
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFBF0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#6B3A5B]/10">
              <Users className="h-5 w-5 text-[#6B3A5B]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#2D2D2D]">Equipe Chadkhaniot</h1>
              <p className="text-sm text-[#6B7280]">
                {users.length} membre{users.length !== 1 ? 's' : ''} actif{users.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Error banner (non-blocking) */}
        {error && users.length > 0 && (
          <div className="mb-6 bg-[#C45B5B]/10 border border-[#C45B5B]/20 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[#C45B5B] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-[#C45B5B]">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-[#C45B5B] hover:text-[#B04A4A]">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Empty state */}
        {users.length === 0 && !loading && (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="Aucun membre dans l'equipe"
            description="Invitez votre premiere chadkhanit pour commencer."
          />
        )}

        {/* Users grid */}
        {users.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {users.map((user) => {
              const roleConfig = ROLE_CONFIG[user.role]
              const RoleIcon = roleConfig.icon
              const isCurrentUser = user.id === currentUser?.id
              const showingRoleChange = roleChangeUserId === user.id

              return (
                <div
                  key={user.id}
                  className={cn(
                    'bg-white rounded-xl border border-[#E8E0D4] p-6 transition-shadow hover:shadow-md',
                    isCurrentUser && 'ring-2 ring-[#87A878]/30'
                  )}
                >
                  {/* Top: Avatar + Name + Role */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Avatar circle with initials */}
                    <div
                      className={cn(
                        'flex items-center justify-center h-14 w-14 rounded-full text-lg font-semibold shrink-0',
                        user.role === 'admin' && 'bg-purple-100 text-purple-700',
                        user.role === 'chadkhanit' && 'bg-[#87A878]/15 text-[#5A7A4A]',
                        user.role === 'assistante' && 'bg-blue-100 text-blue-700',
                        user.role === 'viewer' && 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {getInitials(user.full_name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-[#2D2D2D] truncate">
                        {user.full_name}
                        {isCurrentUser && (
                          <span className="text-xs font-normal text-[#6B7280] ml-2">(vous)</span>
                        )}
                      </h3>

                      {/* Role badge */}
                      <Badge
                        variant="default"
                        className={cn(
                          'mt-1',
                          roleConfig.bg,
                          roleConfig.text,
                          'border-transparent'
                        )}
                      >
                        <RoleIcon className="h-3 w-3 mr-1 inline-block" />
                        {roleConfig.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                      <Mail className="h-4 w-4 shrink-0 text-[#6B7280]/60" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                        <Phone className="h-4 w-4 shrink-0 text-[#6B7280]/60" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="bg-[#FFFBF0] rounded-lg p-3 mb-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-semibold text-[#6B3A5B]">
                          {user.candidatesWomenCount}
                        </p>
                        <p className="text-xs text-[#6B7280]">Fiches femmes</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-[#87A878]">
                          {user.candidatesMenCount}
                        </p>
                        <p className="text-xs text-[#6B7280]">Fiches hommes</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-[#C5A55A]">
                          {user.activeProposalsCount}
                        </p>
                        <p className="text-xs text-[#6B7280]">Propositions</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/candidates?created_by=${user.id}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-[#E8E0D4] bg-white text-[#2D2D2D] hover:bg-gray-50 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      Voir ses fiches
                    </Link>

                    {/* Role change (admin only, not for self) */}
                    {isAdmin && !isCurrentUser && (
                      <>
                        {!showingRoleChange ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRoleChangeUserId(user.id)
                              setRoleChangeValue(user.role)
                            }}
                            icon={<ChevronDown className="h-4 w-4" />}
                          >
                            Changer le role
                          </Button>
                        ) : (
                          <div className="border border-[#E8E0D4] rounded-lg p-3 bg-[#FFFBF0]">
                            <Select
                              label="Nouveau role"
                              options={ROLE_OPTIONS_WITH_ADMIN}
                              value={roleChangeValue}
                              onChange={(e) => setRoleChangeValue(e.target.value)}
                            />
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant="primary"
                                size="sm"
                                loading={roleChangeLoading}
                                onClick={() => handleRoleChange(user.id)}
                                disabled={roleChangeValue === user.role}
                              >
                                Confirmer
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setRoleChangeUserId(null)
                                  setRoleChangeValue('')
                                }}
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Last login */}
                  {user.last_login_at && (
                    <p className="text-xs text-[#6B7280]/60 mt-3 pt-3 border-t border-[#E8E0D4]">
                      Derniere connexion : {formatDate(user.last_login_at)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Admin section: Invite new chadkhanit */}
        {isAdmin && (
          <div className="bg-white rounded-xl border border-[#E8E0D4] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#C5A55A]/10">
                <UserPlus className="h-5 w-5 text-[#C5A55A]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#2D2D2D]">
                  Inviter une nouvelle chadkhanit
                </h2>
                <p className="text-sm text-[#6B7280]">
                  L&apos;invitation sera valable 7 jours.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  label="Adresse email"
                  inputType="email"
                  placeholder="exemple@email.com"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail((e.target as HTMLInputElement).value)
                    setInviteError(null)
                    setInviteSuccess(null)
                  }}
                  error={inviteError ?? undefined}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select
                  label="Role"
                  options={ROLE_OPTIONS}
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="accent"
                  onClick={handleInvite}
                  loading={inviteLoading}
                  disabled={!inviteEmail.trim()}
                  icon={<Send className="h-4 w-4" />}
                >
                  Envoyer l&apos;invitation
                </Button>
              </div>
            </div>

            {/* Success message */}
            {inviteSuccess && (
              <div className="mt-4 bg-[#87A878]/10 border border-[#87A878]/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#87A878] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#5A7A4A] mb-1">
                      Invitation creee avec succes !
                    </p>
                    <p className="text-sm text-[#6B7280] mb-2">
                      Partagez ce lien avec la personne invitee :
                    </p>
                    <div className="bg-white rounded-lg border border-[#E8E0D4] p-3 flex items-center gap-2">
                      <code className="text-xs text-[#2D2D2D] flex-1 break-all">
                        {inviteSuccess}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(inviteSuccess)
                        }}
                      >
                        Copier
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
