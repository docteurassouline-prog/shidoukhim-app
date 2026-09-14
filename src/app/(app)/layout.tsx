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

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, role, phone, avatar_url, organization_id')
    .eq('auth_user_id', user.id)
    .eq('organization_id', ORG_ID)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-[#FFFBF0]">
      <Sidebar
        user={{
          full_name: profile.full_name,
          email: profile.email,
          role: profile.role,
        }}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
