'use server'

import { createAdminClient } from '@/lib/supabase/admin'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

export async function uploadCandidatePhoto(
  candidateId: string,
  table: 'candidates' | 'candidates_men',
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = createAdminClient()

  const file = formData.get('photo') as File | null
  if (!file) {
    return { success: false, error: 'Aucun fichier fourni' }
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filePath = `${table}/${candidateId}/photo.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('candidate-photos')
    .upload(filePath, buffer, {
      upsert: true,
      contentType: file.type || 'image/jpeg',
    })

  if (uploadError) {
    return { success: false, error: uploadError.message }
  }

  const { data: urlData } = supabase.storage
    .from('candidate-photos')
    .getPublicUrl(filePath)

  const url = urlData.publicUrl

  const { error: updateError } = await supabase
    .from(table)
    .update({ photo_url: url })
    .eq('id', candidateId)
    .eq('organization_id', ORG_ID)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true, url }
}

export async function getCandidatePhotoUrl(
  candidateId: string,
  table: 'candidates' | 'candidates_men'
): Promise<string | null> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from(table)
    .select('photo_url')
    .eq('id', candidateId)
    .eq('organization_id', ORG_ID)
    .single()

  return (data as Record<string, unknown> | null)?.photo_url as string | null
}
