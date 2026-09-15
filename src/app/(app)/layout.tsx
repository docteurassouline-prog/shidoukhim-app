import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profileRow } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, role')
    .eq('auth_user_id', user.id)
    .eq('organization_id', ORG_ID)
    .maybeSingle()

  const profile = profileRow ?? {
    full_name: user.user_metadata?.full_name ?? user.email ?? 'Utilisateur',
    email: user.email ?? '',
    role: 'viewer',
  }

  return (
    <div className="flex h-screen bg-canvas">
      <Sidebar
        user={{
          full_name: profile.full_name,
          email: profile.email,
          role: profile.role,
        }}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full px-4 pt-16 pb-10 sm:px-8 lg:px-10 lg:pt-8 max-w-[1440px]">
          {children}
        </div>
      </main>
    </div>
  )
}
