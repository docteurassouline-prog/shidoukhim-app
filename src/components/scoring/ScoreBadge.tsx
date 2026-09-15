'use client'

import type { ScoreLevel } from '@/lib/scoring/types'

const levelConfig: Record<ScoreLevel, { label: string; bg: string; text: string; border: string }> = {
  excellent: { label: 'Excellent', bg: 'bg-sage/20', text: 'text-sage-deep', border: 'border-sage/40' },
  bon: { label: 'Bon', bg: 'bg-plum-light', text: 'text-plum', border: 'border-plum/25' },
  moyen: { label: 'Moyen', bg: 'bg-gold/20', text: 'text-gold-deep', border: 'border-gold/40' },
  faible: { label: 'Faible', bg: 'bg-danger/10', text: 'text-danger-deep', border: 'border-danger/25' },
  incompatible: { label: 'Incompatible', bg: 'bg-danger-light', text: 'text-danger-deep', border: 'border-danger/40' },
  inconnu: { label: 'Insuffisant', bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-300' },
}

interface ScoreBadgeProps {
  score: number
  level: ScoreLevel
  size?: 'sm' | 'md' | 'lg'
}

export default function ScoreBadge({ score, level, size = 'md' }: ScoreBadgeProps) {
  const config = levelConfig[level]
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5 font-semibold',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      <span className="font-bold">{Math.round(score)}%</span>
      <span>{config.label}</span>
    </span>
  )
}
