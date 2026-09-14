'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Heart,
  Calendar,
  BookUser,
  UserCog,
  Settings,
  LogOut,
  X,
  Menu,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SidebarUser {
  full_name: string
  role: string
  email: string
}

interface SidebarProps {
  user: SidebarUser
}

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/candidates', label: 'Fiches femmes', icon: Users },
  { href: '/men', label: 'Fiches hommes', icon: UserCheck },
  { href: '/proposals', label: 'Propositions', icon: Heart },
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/contacts', label: 'Contacts', icon: BookUser },
  { href: '/chadkhaniot', label: 'Chadkhaniot', icon: UserCog },
  { href: '/settings', label: 'Paramètres', icon: Settings },
]

export default function Sidebar({ user }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const currentPath = usePathname()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#E8E0D4]">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-[#E8E0D4]">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <span className="text-lg font-bold text-[#6B3A5B] truncate">
            Hava Dahan
          </span>
          <span className="text-xs text-[#6B7280] hidden sm:inline">Shidoukhim</span>
        </Link>
        {/* Close button — mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden rounded-lg p-1.5 text-[#6B7280] hover:bg-gray-100 transition-colors"
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3" aria-label="Navigation principale">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              currentPath === item.href ||
              (item.href !== '/dashboard' && currentPath.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={[
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#6B3A5B]/10 text-[#6B3A5B]'
                      : 'text-[#6B7280] hover:bg-gray-50 hover:text-[#2D2D2D]',
                  ].join(' ')}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon
                    className={[
                      'h-5 w-5 shrink-0',
                      isActive ? 'text-[#87A878]' : '',
                    ].join(' ')}
                  />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User info */}
      <div className="border-t border-[#E8E0D4] px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-[#6B3A5B] flex items-center justify-center text-white text-sm font-medium shrink-0">
            {user.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#2D2D2D] truncate">
              {user.full_name}
            </p>
            <p className="text-xs text-[#6B7280] truncate">{user.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#6B7280] hover:text-[#C45B5B] hover:bg-[#C45B5B]/5 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger (visible below lg) */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 rounded-lg p-2 bg-white border border-[#E8E0D4] shadow-sm text-[#6B7280] hover:bg-gray-50 transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={[
          'lg:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-label="Navigation"
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0 lg:h-screen lg:sticky lg:top-0" aria-label="Navigation">
        {sidebarContent}
      </aside>
    </>
  )
}
