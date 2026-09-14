'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function CandidateLogoutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/candidate-login')
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-md border border-white/25 px-3 py-1 text-xs font-medium text-white/80 transition-colors hover:border-white/50 hover:text-white"
    >
      Deconnexion
    </button>
  )
}
