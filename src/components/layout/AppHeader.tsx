'use client'

import { Menu, Search } from 'lucide-react'

interface AppHeaderProps {
  title: string
  onMenuToggle: () => void
  onSearchToggle?: () => void
}

export default function AppHeader({
  title,
  onMenuToggle,
  onSearchToggle,
}: AppHeaderProps) {
  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-surface/90 backdrop-blur border-b border-line">
      <button
        onClick={onMenuToggle}
        className="rounded-lg p-2 text-ink-soft hover:bg-ink/[0.05] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-plum/40"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="font-display text-xl font-semibold text-ink truncate px-2">
        {title}
      </h1>

      {onSearchToggle ? (
        <button
          onClick={onSearchToggle}
          className="rounded-lg p-2 text-ink-soft hover:bg-ink/[0.05] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-plum/40"
          aria-label="Rechercher"
        >
          <Search className="h-5 w-5" />
        </button>
      ) : (
        <div className="w-9" aria-hidden="true" />
      )}
    </header>
  )
}
