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
import type { UserProfile, UserRole } from '@/lib/types'
import { cn, formatDate } from '@/lib/utils'
import { getTeamData, inviteUser, changeUserRole } from '@/lib/team/actions'
import type { UserWithStats } from '@/lib/team/actions'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'

const ROLE_CONFIG: Record<UserRole, { label: string; bg: string; text: string; icon: typeof Crown }> = {
  admin: {
    label: 'Administratrice',
    bg: 'bg-plum-light',
    text: 'text-plum',
    icon: Crown,
  },
  chadkhanit: {
    label: 'Chadkhanit',
    bg: 'bg-sage/15',
    text: 'text-sage-deep',
    icon: Handshake,
  },
  assistante: {
    label: 'Assistante',
    bg: 'bg-plum-light',
    text: 'text-plum',
    icon: Shield,
  },
  viewer: {
    label: 'Lectrice',
    bg: 'bg-stone-100',
    text: 'text-stone-600',
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

  const isAdmin = currentUser?.role === 'admin'

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await getTeamData()
      setCurrentUser(data.currentUser)
      setUsers(data.users)
    } catch {
      setError('Une erreur inattendue est survenue.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
      const result = await inviteUser(
        inviteEmail,
        inviteRole as UserRole,
        currentUser.id
      )

      if (!result.success) {
        setInviteError(`Erreur lors de l'envoi : ${result.error}`)
        return
      }

      const inviteLink = `${window.location.origin}/invite/${result.token}`
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
      const result = await changeUserRole(userId, roleChangeValue as UserRole)

      if (!result.success) {
        setError(`Erreur lors du changement de role : ${result.error}`)
        return
      }

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
      <div className="flex justify-center py-16">
        <LoadingSpinner text="Chargement de l'equipe..." size="lg" />
      </div>
    )
  }

  // ----- Error state -----
  if (error && users.length === 0) {
    return (
      <div className="py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-surface rounded-[14px] border border-line p-8 text-center">
            <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
            <h2 className="font-display text-[22px] font-semibold text-ink mb-2">Erreur</h2>
            <p className="text-sm text-ink-soft mb-4">{error}</p>
            <Button variant="primary" onClick={fetchData}>
              Reessayer
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-plum/10">
              <Users className="h-5 w-5 text-plum" />
            </div>
            <div>
              <h1 className="text-[30px] font-semibold text-ink">Equipe Chadkhaniot</h1>
              <p className="text-sm text-ink-soft">
                {users.length} membre{users.length !== 1 ? 's' : ''} actif{users.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Error banner (non-blocking) */}
        {error && users.length > 0 && (
          <div className="mb-6 bg-danger/10 border border-danger/20 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-danger">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-danger hover:text-danger-deep">
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
                    'bg-surface rounded-[14px] border border-line p-6 transition-shadow hover:shadow-card-hover',
                    isCurrentUser && 'ring-2 ring-sage/30'
                  )}
                >
                  {/* Top: Avatar + Name + Role */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={cn(
                        'flex items-center justify-center h-14 w-14 rounded-full text-lg font-semibold shrink-0',
                        user.role === 'admin' && 'bg-plum-light text-plum',
                        user.role === 'chadkhanit' && 'bg-sage/15 text-sage-deep',
                        user.role === 'assistante' && 'bg-plum-light text-plum',
                        user.role === 'viewer' && 'bg-stone-100 text-stone-600'
                      )}
                    >
                      {getInitials(user.full_name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-ink truncate">
                        {user.full_name}
                        {isCurrentUser && (
                          <span className="text-xs font-normal text-ink-soft ml-2">(vous)</span>
                        )}
                      </h3>

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
                    <div className="flex items-center gap-2 text-sm text-ink-soft">
                      <Mail className="h-4 w-4 shrink-0 text-ink-soft/60" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-sm text-ink-soft">
                        <Phone className="h-4 w-4 shrink-0 text-ink-soft/60" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="bg-canvas rounded-lg p-3 mb-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-semibold text-plum">
                          {user.candidatesWomenCount}
                        </p>
                        <p className="text-xs text-ink-soft">Fiches femmes</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-sage">
                          {user.candidatesMenCount}
                        </p>
                        <p className="text-xs text-ink-soft">Fiches hommes</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gold">
                          {user.activeProposalsCount}
                        </p>
                        <p className="text-xs text-ink-soft">Propositions</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/candidates?created_by=${user.id}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-line bg-surface text-ink hover:bg-stone-50 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      Voir ses fiches
                    </Link>

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
                          <div className="border border-line rounded-lg p-3 bg-canvas">
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
                    <p className="text-xs text-ink-soft/60 mt-3 pt-3 border-t border-line">
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
          <div className="bg-surface rounded-[14px] border border-line p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold/10">
                <UserPlus className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h2 className="font-display text-[22px] font-semibold text-ink">
                  Inviter une nouvelle chadkhanit
                </h2>
                <p className="text-sm text-ink-soft">
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
              <div className="mt-4 bg-sage/10 border border-sage/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-sage shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sage-deep mb-1">
                      Invitation creee avec succes !
                    </p>
                    <p className="text-sm text-ink-soft mb-2">
                      Partagez ce lien avec la personne invitee :
                    </p>
                    <div className="bg-surface rounded-lg border border-line p-3 flex items-center gap-2">
                      <code className="text-xs text-ink flex-1 break-all">
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
