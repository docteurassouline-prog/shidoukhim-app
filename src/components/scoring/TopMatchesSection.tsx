'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, ChevronDown, ChevronUp, Sparkles, MapPin } from 'lucide-react'
import type { MatchResult } from '@/lib/scoring/actions'
import ScoreBadge from './ScoreBadge'
import type { CompatibilityResult, DimensionScore, ScoreLevel } from '@/lib/scoring/types'

const levelColors: Record<ScoreLevel, string> = {
  excellent: 'bg-sage',
  bon: 'bg-plum',
  moyen: 'bg-gold',
  faible: 'bg-danger',
  incompatible: 'bg-danger',
  inconnu: 'bg-stone-300',
}

function DimensionMiniBar({ dim }: { dim: DimensionScore }) {
  if (dim.score < 0) return null
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-soft w-28 truncate">{dim.label}</span>
      <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${levelColors[dim.level]}`}
          style={{ width: `${Math.min(dim.score, 100)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-ink w-8 text-right">{Math.round(dim.score)}%</span>
    </div>
  )
}

function MatchCard({ match }: { match: MatchResult }) {
  const [expanded, setExpanded] = useState(false)
  const score = match.score as CompatibilityResult
  const knownDims = score.dimensions.filter((d) => d.score >= 0)
  const topDims = knownDims.slice(0, 4)

  return (
    <div className="bg-surface rounded-[14px] border border-line hover:shadow-card-hover transition-shadow">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 text-center">
            <p className="text-xs text-ink-soft uppercase tracking-wider mb-0.5">Elle</p>
            <Link
              href={`/candidates/${match.woman.id}`}
              className="text-sm font-semibold text-ink hover:text-plum transition-colors"
            >
              {match.woman.first_name} {match.woman.last_name}
            </Link>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              {match.woman.city && (
                <span className="text-xs text-ink-soft flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {match.woman.city}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center gap-1">
            <Heart className="h-4 w-4 text-plum" />
            <ScoreBadge score={score.total} level={score.level} size="sm" />
          </div>

          <div className="flex-1 text-center">
            <p className="text-xs text-ink-soft uppercase tracking-wider mb-0.5">Lui</p>
            <Link
              href={`/men/${match.man.id}`}
              className="text-sm font-semibold text-ink hover:text-plum transition-colors"
            >
              {match.man.first_name} {match.man.last_name}
            </Link>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              {match.man.city && (
                <span className="text-xs text-ink-soft flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {match.man.city}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {topDims.map((dim) => (
            <DimensionMiniBar key={dim.key} dim={dim} />
          ))}
        </div>

        {knownDims.length > 4 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-xs text-sage-deep hover:underline flex items-center gap-1 mx-auto"
          >
            {expanded ? 'Masquer' : `${knownDims.length - 4} autres criteres`}
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}

        {expanded && (
          <div className="mt-2 space-y-1 pt-2 border-t border-dashed border-line">
            {knownDims.slice(4).map((dim) => (
              <DimensionMiniBar key={dim.key} dim={dim} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-line px-4 py-2.5">
        <Link
          href={`/proposals/new?woman=${match.woman.id}&man=${match.man.id}`}
          className="text-xs font-medium text-plum hover:text-plum-hover transition-colors flex items-center justify-center gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Creer une proposition
        </Link>
      </div>
    </div>
  )
}

interface TopMatchesSectionProps {
  matches: MatchResult[]
}

export default function TopMatchesSection({ matches }: TopMatchesSectionProps) {
  if (matches.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-ink-soft">
        Pas assez de candidats actifs pour calculer des suggestions.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {matches.map((match) => (
        <MatchCard
          key={`${match.woman.id}-${match.man.id}`}
          match={match}
        />
      ))}
    </div>
  )
}
