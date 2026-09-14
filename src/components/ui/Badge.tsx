'use client'

import type { ReactNode } from 'react'

// --- Fiche status ---
type FicheStatus =
  | 'invitation_envoyee'
  | 'brouillon'
  | 'a_valider'
  | 'validee'
  | 'archivee'

// --- Disponibilite ---
type Disponibilite =
  | 'a_confirmer'
  | 'disponible'
  | 'en_rencontre'
  | 'en_pause'
  | 'fiancee'
  | 'mariee'

// --- Proposition status ---
type PropositionStatus =
  | 'envisagee'
  | 'accord_demande'
  | 'attente_retour'
  | 'acceptee'
  | 'rencontre_a_organiser'
  | 'rencontre_programmee'
  | 'rencontres_en_cours'
  | 'interrompue'
  | 'refusee'
  | 'aboutie'

type BadgeVariant = FicheStatus | Disponibilite | PropositionStatus | 'default'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
  dot?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  // Fiche statuses
  invitation_envoyee: 'bg-[#C5A55A]/15 text-[#8B7030] border-[#C5A55A]/30',
  brouillon: 'bg-gray-100 text-gray-600 border-gray-200',
  a_valider: 'bg-[#C5A55A]/15 text-[#8B7030] border-[#C5A55A]/30',
  validee: 'bg-[#87A878]/15 text-[#5A7A4A] border-[#87A878]/30',
  archivee: 'bg-gray-50 text-gray-400 border-gray-200',

  // Disponibilites
  a_confirmer: 'bg-gray-100 text-gray-600 border-gray-200',
  disponible: 'bg-[#87A878]/15 text-[#5A7A4A] border-[#87A878]/30',
  en_rencontre: 'bg-[#6B3A5B]/10 text-[#6B3A5B] border-[#6B3A5B]/20',
  en_pause: 'bg-[#C5A55A]/15 text-[#8B7030] border-[#C5A55A]/30',
  fiancee: 'bg-[#C5A55A]/15 text-[#8B7030] border-[#C5A55A]/30',
  mariee: 'bg-[#C5A55A]/20 text-[#8B7030] border-[#C5A55A]/40',

  // Proposition statuses
  envisagee: 'bg-gray-100 text-gray-600 border-gray-200',
  accord_demande: 'bg-blue-50 text-blue-700 border-blue-200',
  attente_retour: 'bg-[#C5A55A]/15 text-[#8B7030] border-[#C5A55A]/30',
  acceptee: 'bg-[#87A878]/15 text-[#5A7A4A] border-[#87A878]/30',
  rencontre_a_organiser: 'bg-blue-50 text-blue-700 border-blue-200',
  rencontre_programmee: 'bg-[#6B3A5B]/10 text-[#6B3A5B] border-[#6B3A5B]/20',
  rencontres_en_cours: 'bg-[#6B3A5B]/10 text-[#6B3A5B] border-[#6B3A5B]/20',
  interrompue: 'bg-[#C45B5B]/10 text-[#C45B5B] border-[#C45B5B]/20',
  refusee: 'bg-[#C45B5B]/10 text-[#C45B5B] border-[#C45B5B]/20',
  aboutie: 'bg-[#C5A55A]/20 text-[#8B7030] border-[#C5A55A]/40',

  // Default
  default: 'bg-gray-100 text-gray-600 border-gray-200',
}

const dotColors: Record<BadgeVariant, string> = {
  invitation_envoyee: 'bg-[#C5A55A]',
  brouillon: 'bg-gray-400',
  a_valider: 'bg-[#C5A55A]',
  validee: 'bg-[#87A878]',
  archivee: 'bg-gray-300',
  a_confirmer: 'bg-gray-400',
  disponible: 'bg-[#87A878]',
  en_rencontre: 'bg-[#6B3A5B]',
  en_pause: 'bg-[#C5A55A]',
  fiancee: 'bg-[#C5A55A]',
  mariee: 'bg-[#C5A55A]',
  envisagee: 'bg-gray-400',
  accord_demande: 'bg-blue-500',
  attente_retour: 'bg-[#C5A55A]',
  acceptee: 'bg-[#87A878]',
  rencontre_a_organiser: 'bg-blue-500',
  rencontre_programmee: 'bg-[#6B3A5B]',
  rencontres_en_cours: 'bg-[#6B3A5B]',
  interrompue: 'bg-[#C45B5B]',
  refusee: 'bg-[#C45B5B]',
  aboutie: 'bg-[#C5A55A]',
  default: 'bg-gray-400',
}

export default function Badge({
  variant = 'default',
  children,
  className = '',
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColors[variant]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
