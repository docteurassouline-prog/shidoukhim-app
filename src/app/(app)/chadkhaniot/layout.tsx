'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Users, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/chadkhaniot', label: 'Equipe', icon: Users },
  { href: '/chadkhaniot/comptabilite', label: 'Comptabilite', icon: Receipt },
]

export default function ChadkhaniotLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div>
      <nav className="flex gap-1 border-b border-line mb-6">
        {tabs.map((tab) => {
          const isActive =
            tab.href === '/chadkhaniot'
              ? pathname === '/chadkhaniot'
              : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-plum text-plum'
                  : 'border-transparent text-ink-soft hover:text-ink hover:border-line'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          )
        })}
      </nav>
      {children}
    </div>
  )
}
