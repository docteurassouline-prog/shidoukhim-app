'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { UserProfile, Organization } from '@/lib/types'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

// ---------------------------------------------------------------------------
// Load settings data (profile + organization + isAdmin)
// ---------------------------------------------------------------------------
export async function getSettingsData(): Promise<{
  profile: UserProfile | null
  organization: Organization | null
  isAdmin: boolean
}> {
  // Use session-aware client to get the current user
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { profile: null, organization: null, isAdmin: false }
  }

  // Use admin client for data queries (bypasses RLS)
  const admin = createAdminClient()

  const [profileResult, orgResult] = await Promise.all([
    admin
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .eq('organization_id', ORG_ID)
      .single(),
    admin.from('organizations').select('*').eq('id', ORG_ID).single(),
  ])

  const profile = (profileResult.data as UserProfile) ?? null
  const organization = (orgResult.data as Organization) ?? null
  const isAdmin = profile?.role === 'admin'

  return { profile, organization, isAdmin }
}

// ---------------------------------------------------------------------------
// Update organization name
// ---------------------------------------------------------------------------
export async function updateOrganizationName(
  name: string
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient()

  const { error } = await admin
    .from('organizations')
    .update({ name: name.trim() })
    .eq('id', ORG_ID)

  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}

// ---------------------------------------------------------------------------
// Update user profile
// ---------------------------------------------------------------------------
export async function updateProfile(
  profileId: string,
  fullName: string,
  phone: string
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient()

  const { error } = await admin
    .from('user_profiles')
    .update({
      full_name: fullName.trim(),
      phone: phone.trim() || null,
    })
    .eq('id', profileId)

  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}

// ---------------------------------------------------------------------------
// Update password — uses session-aware server client (NOT admin)
// ---------------------------------------------------------------------------
export async function updatePassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}

// ---------------------------------------------------------------------------
// Update organization settings (delays)
// ---------------------------------------------------------------------------
export async function updateOrganizationSettings(
  settings: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient()

  // Fetch current settings to merge
  const { data: org } = await admin
    .from('organizations')
    .select('settings')
    .eq('id', ORG_ID)
    .single()

  const currentSettings = ((org?.settings as Record<string, unknown>) || {})
  const updatedSettings = { ...currentSettings, ...settings }

  const { error } = await admin
    .from('organizations')
    .update({ settings: updatedSettings })
    .eq('id', ORG_ID)

  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}
