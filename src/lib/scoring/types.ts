export type ScoreLevel = 'excellent' | 'bon' | 'moyen' | 'faible' | 'incompatible' | 'inconnu'

export interface DimensionScore {
  key: string
  label: string
  score: number // 0–100
  weight: number
  detail: string
  level: ScoreLevel
}

export interface CompatibilityResult {
  total: number // 0–100
  level: ScoreLevel
  dimensions: DimensionScore[]
  dealBreakers: string[]
  coveredDimensions: number
  totalDimensions: number
}

export interface ScoringWeights {
  courant: number
  community: number
  age: number
  city: number
  shabbat: number
  kashrut: number
  tsniout: number
  childrenEducation: number
  hassidout: number
  nousah: number
  maritalStatus: number
  languages: number
  hasChildren: number
}

export interface ScoringConfig {
  weights: ScoringWeights
  courantCompatibility: Record<string, Record<string, number>>
  orderedScales: {
    shabbat: string[]
    kashrut: string[]
    tsniout: string[]
  }
  ageTolerance: number
  dealBreakers: {
    courantMismatchBelow: number
    ageOutOfRange: boolean
  }
}
