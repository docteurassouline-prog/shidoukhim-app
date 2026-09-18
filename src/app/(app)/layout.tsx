import { createAdminClient } from '@/lib/supabase/admin'
import Sidebar from '@/components/layout/Sidebar'

export const dynamic = 'force-dynamic'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createAdminClient()

  const { data: profileRow } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, role')
    .eq('organization_id', ORG_ID)
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle()

  const profile = profileRow ?? {
    full_name: 'Hava Dahan',
    email: '',
    role: 'admin',
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
