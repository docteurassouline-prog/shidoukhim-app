'use client'

import type { ScoreLevel } from '@/lib/scoring/types'

const levelConfig: Record<ScoreLevel, { label: string; bg: string; text: string; border: string }> = {
  excellent: { label: 'Excellent', bg: 'bg-[#87A878]/15', text: 'text-[#5A7A4A]', border: 'border-[#87A878]/30' },
  bon: { label: 'Bon', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  moyen: { label: 'Moyen', bg: 'bg-[#C5A55A]/15', text: 'text-[#8B7030]', border: 'border-[#C5A55A]/30' },
  faible: { label: 'Faible', bg: 'bg-[#C45B5B]/10', text: 'text-[#C45B5B]', border: 'border-[#C45B5B]/20' },
  incompatible: { label: 'Incompatible', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  inconnu: { label: 'Insuffisant', bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
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
      <span className="opacity-75">{config.label}</span>
    </span>
  )
}
