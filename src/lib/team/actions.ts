'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { UserProfile, UserRole } from '@/lib/types'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

export interface UserWithStats extends UserProfile {
  candidatesWomenCount: number
  candidatesMenCount: number
  activeProposalsCount: number
}

export interface TeamData {
  currentUser: UserProfile
  users: UserWithStats[]
}

export async function getTeamData(): Promise<TeamData> {
  const supabase = createAdminClient()

  // Get first admin as current user (auth bypass fallback)
  const { data: adminProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('role', 'admin')
    .limit(1)
    .single()

  const currentUser = (adminProfile as UserProfile) ?? {
    id: '00000000-0000-0000-0000-000000000000',
    organization_id: ORG_ID,
    auth_user_id: '',
    full_name: 'Admin',
    email: 'admin@shidoukhim.app',
    role: 'admin' as UserRole,
    phone: null,
    avatar_url: null,
    is_active: true,
    last_login_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data: allUsers } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (!allUsers || allUsers.length === 0) {
    return { currentUser, users: [] }
  }

  const terminalStatuses = ['cancelled', 'declined_woman', 'declined_man', 'declined_both', 'married']

  const usersWithStats: UserWithStats[] = await Promise.all(
    (allUsers as UserProfile[]).map(async (user) => {
      const { count: womenCount } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .eq('status', 'active')

      const { count: menCount } = await supabase
        .from('candidates_men')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .eq('status', 'active')

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

  return { currentUser, users: usersWithStats }
}

export async function inviteUser(
  email: string,
  role: UserRole,
  invitedBy: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const supabase = createAdminClient()

  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { error } = await supabase.from('invitations').insert({
    organization_id: ORG_ID,
    invited_by: invitedBy,
    email: email.trim().toLowerCase(),
    role,
    status: 'pending',
    token,
    expires_at: expiresAt.toISOString(),
  })

  if (error) return { success: false, error: error.message }
  return { success: true, token }
}

export async function changeUserRole(
  userId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('user_profiles')
    .update({ role: newRole })
    .eq('id', userId)
    .eq('organization_id', ORG_ID)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
