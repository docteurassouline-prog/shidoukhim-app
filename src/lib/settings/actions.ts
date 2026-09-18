'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { UserProfile, Organization } from '@/lib/types'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

export async function getSettingsData(): Promise<{
  profile: UserProfile | null
  organization: Organization | null
  isAdmin: boolean
}> {
  const admin = createAdminClient()

  const [profileResult, orgResult] = await Promise.all([
    admin
      .from('user_profiles')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle(),
    admin.from('organizations').select('*').eq('id', ORG_ID).single(),
  ])

  const profile = (profileResult.data as UserProfile) ?? null
  const organization = (orgResult.data as Organization) ?? null

  return { profile, organization, isAdmin: true }
}

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

export async function updateOrganizationSettings(
  settings: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient()

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
