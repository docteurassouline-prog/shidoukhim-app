'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import type { CompatibilityResult, DimensionScore, ScoreLevel } from '@/lib/scoring/types'
import ScoreBadge from './ScoreBadge'

const levelColors: Record<ScoreLevel, string> = {
  excellent: 'bg-[#87A878]',
  bon: 'bg-blue-500',
  moyen: 'bg-[#C5A55A]',
  faible: 'bg-[#C45B5B]',
  incompatible: 'bg-red-600',
  inconnu: 'bg-gray-300',
}

function DimensionBar({ dim }: { dim: DimensionScore }) {
  if (dim.score < 0) {
    return (
      <div className="flex items-center justify-between py-1.5">
        <span className="text-xs text-[#6B7280]">{dim.label}</span>
        <span className="text-xs text-gray-400 italic">Donnees manquantes</span>
      </div>
    )
  }
  const barColor = levelColors[dim.level]
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#2D2D2D]">{dim.label}</span>
        <span className="text-xs font-medium text-[#2D2D2D]">{Math.round(dim.score)}%</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(dim.score, 100)}%` }}
        />
      </div>
    </div>
  )
}

interface ScoreDetailsProps {
  result: CompatibilityResult
  compact?: boolean
}

export default function ScoreDetails({ result, compact = false }: ScoreDetailsProps) {
  const [expanded, setExpanded] = useState(false)

  const knownDimensions = result.dimensions.filter((d) => d.score >= 0)
  const unknownDimensions = result.dimensions.filter((d) => d.score < 0)

  return (
    <div>
      <div className="flex items-center gap-3">
        <ScoreBadge score={result.total} level={result.level} size={compact ? 'sm' : 'md'} />
        <span className="text-xs text-[#6B7280]">
          {result.coveredDimensions}/{result.totalDimensions} criteres evalues
        </span>
        {!compact && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="ml-auto text-xs text-[#87A878] hover:underline flex items-center gap-1"
          >
            {expanded ? 'Masquer' : 'Details'}
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>

      {result.dealBreakers.length > 0 && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-[#C45B5B] bg-[#C45B5B]/5 border border-[#C45B5B]/15 rounded-md px-2.5 py-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Blocages : </span>
            {result.dealBreakers.join(' ; ')}
          </div>
        </div>
      )}

      {expanded && (
        <div className="mt-3 space-y-0.5 border-t border-[#E8E0D4] pt-3">
          {knownDimensions.map((dim) => (
            <DimensionBar key={dim.key} dim={dim} />
          ))}
          {unknownDimensions.length > 0 && (
            <div className="pt-2 border-t border-dashed border-[#E8E0D4] mt-2">
              <p className="text-xs text-gray-400 mb-1">Non evalues :</p>
              {unknownDimensions.map((dim) => (
                <DimensionBar key={dim.key} dim={dim} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
