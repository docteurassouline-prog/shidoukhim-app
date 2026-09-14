'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function CandidateNavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isActive =
    href === '/espace-candidate'
      ? pathname === '/espace-candidate'
      : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? 'border-gold text-white'
          : 'border-transparent text-white/70 hover:border-gold hover:text-white'
      }`}
    >
      {children}
    </Link>
  )
}
