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

const navSections = [
  {
    label: 'Pilotage',
    items: [
      { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { href: '/agenda', label: 'Agenda', icon: Calendar },
    ],
  },
  {
    label: 'Dossiers',
    items: [
      { href: '/candidates', label: 'Fiches femmes', icon: Users },
      { href: '/men', label: 'Fiches hommes', icon: UserCheck },
      { href: '/proposals', label: 'Propositions', icon: Heart },
    ],
  },
  {
    label: 'Réseau',
    items: [
      { href: '/contacts', label: 'Contacts', icon: BookUser },
      { href: '/chadkhaniot', label: 'Chadkhaniot', icon: UserCog },
    ],
  },
]

const roleLabels: Record<string, string> = {
  admin: 'Administratrice',
  chadkhanit: 'Chadkhanit',
  assistante: 'Assistante',
  viewer: 'Lecture seule',
}

export default function Sidebar({ user }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const currentPath = usePathname()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  function isActive(href: string) {
    return (
      currentPath === href ||
      (href !== '/dashboard' && currentPath.startsWith(href))
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-plum-deep text-white">
      {/* Marque */}
      <div className="flex items-center justify-between px-6 pt-7 pb-6">
        <Link href="/dashboard" className="min-w-0 group">
          <span className="block font-display text-[26px] leading-none font-semibold tracking-tight text-white truncate">
            Hava Dahan
          </span>
          <span className="mt-1.5 block text-[10.5px] uppercase tracking-[0.22em] text-white/50">
            Shidoukhim
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-6 h-px bg-white/10" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navigation principale">
        {navSections.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="px-3 mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/35">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={[
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors',
                        active
                          ? 'bg-white/[0.12] text-white'
                          : 'text-white/65 hover:bg-white/[0.06] hover:text-white',
                      ].join(' ')}
                      aria-current={active ? 'page' : undefined}
                    >
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-gold"
                          aria-hidden="true"
                        />
                      )}
                      <item.icon
                        className={[
                          'h-[18px] w-[18px] shrink-0 transition-colors',
                          active ? 'text-gold' : 'text-white/45 group-hover:text-white/80',
                        ].join(' ')}
                        strokeWidth={1.75}
                      />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        <div className="mb-2">
          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
            className={[
              'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors',
              isActive('/settings')
                ? 'bg-white/[0.12] text-white'
                : 'text-white/65 hover:bg-white/[0.06] hover:text-white',
            ].join(' ')}
            aria-current={isActive('/settings') ? 'page' : undefined}
          >
            <Settings
              className={[
                'h-[18px] w-[18px] shrink-0',
                isActive('/settings') ? 'text-gold' : 'text-white/45 group-hover:text-white/80',
              ].join(' ')}
              strokeWidth={1.75}
            />
            Paramètres
          </Link>
        </div>
      </nav>

      {/* Utilisateur */}
      <div className="px-4 pb-5 pt-3">
        <div className="rounded-xl bg-white/[0.06] p-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gold/90 text-plum-deep flex items-center justify-center text-xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
              <p className="text-[11.5px] text-white/50 truncate">
                {roleLabels[user.role] ?? user.role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Déconnexion"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Hamburger mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 rounded-xl p-2.5 bg-surface border border-line shadow-card text-ink-soft hover:text-ink transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Voile mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-ink/50 backdrop-blur-[2px]"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Tiroir mobile */}
      <aside
        className={[
          'lg:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 shadow-float',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-label="Navigation"
      >
        {sidebarContent}
      </aside>

      {/* Barre latérale bureau */}
      <aside
        className="hidden lg:block lg:w-[264px] lg:shrink-0 lg:h-screen lg:sticky lg:top-0"
        aria-label="Navigation"
      >
        {sidebarContent}
      </aside>
    </>
  )
}
