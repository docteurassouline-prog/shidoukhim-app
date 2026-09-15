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

// Cinq tonalités seulement : neutre, or (attente), sauge (positif), prune (en cours), danger.
const tone = {
  neutral: 'bg-stone-100 text-stone-600 border-stone-200',
  gold: 'bg-gold-light text-gold-deep border-gold/30',
  sage: 'bg-sage-light text-sage-deep border-sage/30',
  plum: 'bg-plum-light text-plum border-plum/20',
  danger: 'bg-danger-light text-danger-deep border-danger/25',
  faded: 'bg-stone-50 text-stone-400 border-stone-200',
}

const variantStyles: Record<BadgeVariant, string> = {
  invitation_envoyee: tone.gold,
  brouillon: tone.neutral,
  a_valider: tone.gold,
  validee: tone.sage,
  archivee: tone.faded,

  a_confirmer: tone.neutral,
  disponible: tone.sage,
  en_rencontre: tone.plum,
  en_pause: tone.gold,
  fiancee: tone.gold,
  mariee: tone.gold,

  envisagee: tone.neutral,
  accord_demande: tone.plum,
  attente_retour: tone.gold,
  acceptee: tone.sage,
  rencontre_a_organiser: tone.plum,
  rencontre_programmee: tone.plum,
  rencontres_en_cours: tone.plum,
  interrompue: tone.danger,
  refusee: tone.danger,
  aboutie: tone.gold,

  default: tone.neutral,
}

const dotColors: Record<BadgeVariant, string> = {
  invitation_envoyee: 'bg-gold',
  brouillon: 'bg-stone-400',
  a_valider: 'bg-gold',
  validee: 'bg-sage',
  archivee: 'bg-stone-300',
  a_confirmer: 'bg-stone-400',
  disponible: 'bg-sage',
  en_rencontre: 'bg-plum',
  en_pause: 'bg-gold',
  fiancee: 'bg-gold',
  mariee: 'bg-gold',
  envisagee: 'bg-stone-400',
  accord_demande: 'bg-plum',
  attente_retour: 'bg-gold',
  acceptee: 'bg-sage',
  rencontre_a_organiser: 'bg-plum',
  rencontre_programmee: 'bg-plum',
  rencontres_en_cours: 'bg-plum',
  interrompue: 'bg-danger',
  refusee: 'bg-danger',
  aboutie: 'bg-gold',
  default: 'bg-stone-400',
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
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[11.5px] font-medium leading-4 whitespace-nowrap',
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
