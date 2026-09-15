import type { Candidate, CandidateMan } from '@/lib/types'
import type {
  ScoringConfig,
  CompatibilityResult,
  DimensionScore,
  ScoreLevel,
} from './types'
import { DEFAULT_CONFIG } from './config'

// ═══════════════════════════════════════════════════════════════
// Moteur de scoring de compatibilité
// ═══════════════════════════════════════════════════════════════

function levelFromScore(score: number): ScoreLevel {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'bon'
  if (score >= 40) return 'moyen'
  if (score >= 20) return 'faible'
  return 'incompatible'
}

// ─── Helpers internes ────────────────────────────────────────

function getAge(
  dateOfBirth: string | null,
  ageEstimate: number | null,
  isEstimate: boolean
): number | null {
  if (dateOfBirth && !isEstimate) {
    const diff = Date.now() - new Date(dateOfBirth).getTime()
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
  }
  return ageEstimate
}

function scaleDistance(
  a: string | null,
  b: string | null,
  scale: string[]
): number | null {
  if (!a || !b) return null
  const idxA = scale.indexOf(a)
  const idxB = scale.indexOf(b)
  if (idxA === -1 || idxB === -1) return null
  const maxDist = scale.length - 1
  if (maxDist === 0) return 100
  const dist = Math.abs(idxA - idxB)
  return Math.round(100 * (1 - dist / maxDist))
}

function lookupCourantScore(
  a: string,
  b: string,
  matrix: Record<string, Record<string, number>>
): number | null {
  if (matrix[a]?.[b] !== undefined) return matrix[a][b]
  if (matrix[b]?.[a] !== undefined) return matrix[b][a]
  return null
}

function intersectArrays(a: string[] | null, b: string[] | null): string[] {
  if (!a || !b) return []
  const setB = new Set(b.map((s) => s.toLowerCase()))
  return a.filter((s) => setB.has(s.toLowerCase()))
}

function citiesOverlap(
  womanCity: string | null,
  manCity: string | null,
  womanPref: string | null,
  manPref: string | null
): { score: number; detail: string } | null {
  if (!womanCity && !manCity) return null

  const normalize = (s: string) => s.trim().toLowerCase()
  const toSet = (csv: string | null) =>
    csv
      ? new Set(csv.split(/[,;/]/).map(normalize).filter(Boolean))
      : new Set<string>()

  const wCity = womanCity ? normalize(womanCity) : null
  const mCity = manCity ? normalize(manCity) : null
  const wPref = toSet(womanPref)
  const mPref = toSet(manPref)

  if (wCity && mCity && wCity === mCity)
    return { score: 100, detail: 'Même ville' }

  if (wCity && mPref.has(wCity) && mCity && wPref.has(mCity))
    return { score: 90, detail: 'Chacun dans les villes souhaitées de l\'autre' }

  if ((wCity && mPref.has(wCity)) || (mCity && wPref.has(mCity)))
    return { score: 70, detail: 'Un des deux dans les préférences de l\'autre' }

  const commonPref = [...wPref].filter((c) => mPref.has(c))
  if (commonPref.length > 0)
    return { score: 50, detail: `Villes communes souhaitées : ${commonPref.join(', ')}` }

  if (wCity && mCity)
    return { score: 20, detail: `${womanCity} / ${manCity} — villes différentes` }

  return { score: 30, detail: 'Données insuffisantes' }
}

// ═══════════════════════════════════════════════════════════════
// Fonction principale
// ═══════════════════════════════════════════════════════════════

export function computeCompatibility(
  woman: Candidate,
  man: CandidateMan,
  config: ScoringConfig = DEFAULT_CONFIG
): CompatibilityResult {
  const dimensions: DimensionScore[] = []
  const dealBreakers: string[] = []
  const w = config.weights

  // ── 1. Courant religieux ──────────────────────────────────
  if (woman.courant && man.courant) {
    const raw = lookupCourantScore(
      woman.courant,
      man.courant,
      config.courantCompatibility
    )
    const score = raw ?? (woman.courant === man.courant ? 100 : 30)
    dimensions.push({
      key: 'courant',
      label: 'Courant religieux',
      score,
      weight: w.courant,
      detail:
        score >= 80
          ? 'Courants très proches'
          : score >= 50
            ? 'Courants compatibles'
            : 'Courants éloignés',
      level: levelFromScore(score),
    })
    if (score < config.dealBreakers.courantMismatchBelow) {
      dealBreakers.push('Courants religieux incompatibles')
    }
  } else {
    dimensions.push({
      key: 'courant',
      label: 'Courant religieux',
      score: -1,
      weight: w.courant,
      detail: 'Non renseigné',
      level: 'inconnu',
    })
  }

  // ── 2. Communauté ethnique ────────────────────────────────
  if (woman.community && man.community) {
    const same = woman.community === man.community
    const mixteOk =
      woman.community === 'mixte' || man.community === 'mixte'
    const score = same ? 100 : mixteOk ? 70 : 40
    dimensions.push({
      key: 'community',
      label: 'Communauté',
      score,
      weight: w.community,
      detail: same
        ? 'Même communauté'
        : mixteOk
          ? 'Un des deux est mixte'
          : 'Communautés différentes',
      level: levelFromScore(score),
    })
  } else {
    dimensions.push({
      key: 'community',
      label: 'Communauté',
      score: -1,
      weight: w.community,
      detail: 'Non renseigné',
      level: 'inconnu',
    })
  }

  // ── 3. Âge ────────────────────────────────────────────────
  const wAge = getAge(woman.date_of_birth, woman.age_estimate, woman.is_age_estimate)
  const mAge = getAge(man.date_of_birth, man.age_estimate, man.is_age_estimate)

  if (wAge !== null && mAge !== null) {
    const tol = config.ageTolerance
    const wInMRange =
      man.age_min !== null && man.age_max !== null
        ? wAge >= man.age_min - tol && wAge <= man.age_max + tol
        : null
    const mInWRange =
      woman.age_min !== null && woman.age_max !== null
        ? mAge >= woman.age_min - tol && mAge <= woman.age_max + tol
        : null

    let score: number
    let detail: string

    if (wInMRange === null && mInWRange === null) {
      score = 60
      detail = `Elle ${wAge} ans, Lui ${mAge} ans — pas de préférence renseignée`
    } else if (wInMRange && mInWRange) {
      score = 100
      detail = `Elle ${wAge} ans, Lui ${mAge} ans — dans les deux fourchettes`
    } else if (wInMRange || mInWRange) {
      score = 65
      detail = `Elle ${wAge} ans, Lui ${mAge} ans — dans une seule fourchette`
    } else {
      score = 15
      detail = `Elle ${wAge} ans, Lui ${mAge} ans — hors des deux fourchettes`
      if (config.dealBreakers.ageOutOfRange) {
        dealBreakers.push('Âges hors des fourchettes souhaitées')
      }
    }

    dimensions.push({
      key: 'age',
      label: 'Âge',
      score,
      weight: w.age,
      detail,
      level: levelFromScore(score),
    })
  } else {
    dimensions.push({
      key: 'age',
      label: 'Âge',
      score: -1,
      weight: w.age,
      detail: 'Âge non renseigné',
      level: 'inconnu',
    })
  }

  // ── 4. Ville / localisation ───────────────────────────────
  const cityResult = citiesOverlap(
    woman.city,
    man.city,
    woman.preferred_cities,
    man.preferred_cities
  )
  if (cityResult) {
    dimensions.push({
      key: 'city',
      label: 'Localisation',
      score: cityResult.score,
      weight: w.city,
      detail: cityResult.detail,
      level: levelFromScore(cityResult.score),
    })
  } else {
    dimensions.push({
      key: 'city',
      label: 'Localisation',
      score: -1,
      weight: w.city,
      detail: 'Non renseigné',
      level: 'inconnu',
    })
  }

  // ── 5. Chabbat ────────────────────────────────────────────
  const shabbatScore = scaleDistance(
    woman.shabbat_practice,
    man.shabbat_practice,
    config.orderedScales.shabbat
  )
  dimensions.push({
    key: 'shabbat',
    label: 'Pratique du Chabbat',
    score: shabbatScore ?? -1,
    weight: w.shabbat,
    detail:
      shabbatScore !== null
        ? shabbatScore >= 80
          ? 'Pratique très similaire'
          : shabbatScore >= 50
            ? 'Pratique compatible'
            : 'Écart de pratique significatif'
        : 'Non renseigné',
    level: shabbatScore !== null ? levelFromScore(shabbatScore) : 'inconnu',
  })

  // ── 6. Cacheroute ─────────────────────────────────────────
  const kashrutScore = scaleDistance(
    woman.kashrut_level,
    man.kashrut_level,
    config.orderedScales.kashrut
  )
  dimensions.push({
    key: 'kashrut',
    label: 'Cacheroute',
    score: kashrutScore ?? -1,
    weight: w.kashrut,
    detail:
      kashrutScore !== null
        ? kashrutScore >= 80
          ? 'Niveau très similaire'
          : kashrutScore >= 50
            ? 'Niveaux compatibles'
            : 'Écart de cacheroute important'
        : 'Non renseigné',
    level: kashrutScore !== null ? levelFromScore(kashrutScore) : 'inconnu',
  })

  // ── 7. Tsniout ────────────────────────────────────────────
  const tsnioutScore = scaleDistance(
    woman.tsniout,
    man.tsniout,
    config.orderedScales.tsniout
  )
  dimensions.push({
    key: 'tsniout',
    label: 'Tsniout',
    score: tsnioutScore ?? -1,
    weight: w.tsniout,
    detail:
      tsnioutScore !== null
        ? tsnioutScore >= 80
          ? 'Attentes très proches'
          : tsnioutScore >= 50
            ? 'Attentes compatibles'
            : 'Attentes éloignées'
        : 'Non renseigné',
    level: tsnioutScore !== null ? levelFromScore(tsnioutScore) : 'inconnu',
  })

  // ── 8. Éducation des enfants ──────────────────────────────
  if (woman.children_education && man.children_education) {
    const same = woman.children_education === man.children_education
    const flexOk =
      woman.children_education === 'flexible' ||
      man.children_education === 'flexible'
    const score = same ? 100 : flexOk ? 75 : 35
    dimensions.push({
      key: 'childrenEducation',
      label: 'Éducation des enfants',
      score,
      weight: w.childrenEducation,
      detail: same
        ? 'Même vision'
        : flexOk
          ? 'Un des deux est flexible'
          : 'Visions différentes',
      level: levelFromScore(score),
    })
  } else {
    dimensions.push({
      key: 'childrenEducation',
      label: 'Éducation des enfants',
      score: -1,
      weight: w.childrenEducation,
      detail: 'Non renseigné',
      level: 'inconnu',
    })
  }

  // ── 9. Hassidout ──────────────────────────────────────────
  const bothHassidique =
    woman.courant === 'haredi_hassidique' &&
    man.courant === 'haredi_hassidique'
  if (bothHassidique && woman.hassidout && man.hassidout) {
    const same = woman.hassidout === man.hassidout
    const score = same ? 100 : 50
    dimensions.push({
      key: 'hassidout',
      label: 'Hassidout',
      score,
      weight: w.hassidout,
      detail: same ? 'Même hassidout' : 'Hassidouyot différentes',
      level: levelFromScore(score),
    })
  } else if (bothHassidique) {
    dimensions.push({
      key: 'hassidout',
      label: 'Hassidout',
      score: -1,
      weight: w.hassidout,
      detail: 'Non renseigné',
      level: 'inconnu',
    })
  }
  // Si pas les deux hassidiques, la dimension est ignorée (pas ajoutée)

  // ── 10. Nousah ────────────────────────────────────────────
  if (woman.nousah && man.nousah) {
    const same = woman.nousah === man.nousah
    const mixteOk = woman.nousah === 'mixte' || man.nousah === 'mixte'
    const score = same ? 100 : mixteOk ? 80 : 50
    dimensions.push({
      key: 'nousah',
      label: 'Nousah',
      score,
      weight: w.nousah,
      detail: same
        ? 'Même nousah'
        : mixteOk
          ? 'Un des deux est mixte'
          : 'Nousah différents',
      level: levelFromScore(score),
    })
  } else {
    dimensions.push({
      key: 'nousah',
      label: 'Nousah',
      score: -1,
      weight: w.nousah,
      detail: 'Non renseigné',
      level: 'inconnu',
    })
  }

  // ── 11. Situation matrimoniale ────────────────────────────
  if (woman.marital_status && man.marital_status) {
    const accepted = woman.accepted_marital_status
    let score: number
    let detail: string

    if (Array.isArray(accepted) && accepted.length > 0) {
      const ok = accepted.includes(man.marital_status)
      score = ok ? 90 : 20
      detail = ok
        ? 'Statut du candidat accepté par la candidate'
        : 'Statut du candidat non accepté par la candidate'
    } else {
      const same = woman.marital_status === man.marital_status
      score = same ? 100 : 50
      detail = same ? 'Même situation' : 'Situations différentes'
    }

    dimensions.push({
      key: 'maritalStatus',
      label: 'Situation matrimoniale',
      score,
      weight: w.maritalStatus,
      detail,
      level: levelFromScore(score),
    })
  } else {
    dimensions.push({
      key: 'maritalStatus',
      label: 'Situation matrimoniale',
      score: -1,
      weight: w.maritalStatus,
      detail: 'Non renseigné',
      level: 'inconnu',
    })
  }

  // ── 12. Langues ───────────────────────────────────────────
  if (woman.languages && man.languages) {
    const common = intersectArrays(woman.languages, man.languages)
    const score = common.length > 0 ? Math.min(100, 60 + common.length * 20) : 20
    dimensions.push({
      key: 'languages',
      label: 'Langues',
      score,
      weight: w.languages,
      detail:
        common.length > 0
          ? `Langues communes : ${common.join(', ')}`
          : 'Aucune langue commune',
      level: levelFromScore(score),
    })
  } else {
    dimensions.push({
      key: 'languages',
      label: 'Langues',
      score: -1,
      weight: w.languages,
      detail: 'Non renseigné',
      level: 'inconnu',
    })
  }

  // ── 13. Enfants existants ─────────────────────────────────
  {
    const wHas = woman.has_children
    const mHas = man.has_children
    const same = wHas === mHas
    const score = same ? 90 : 45
    dimensions.push({
      key: 'hasChildren',
      label: 'Enfants existants',
      score,
      weight: w.hasChildren,
      detail: same
        ? wHas
          ? 'Les deux ont des enfants'
          : 'Aucun des deux n\'a d\'enfants'
        : 'Un des deux a des enfants',
      level: levelFromScore(score),
    })
  }

  // ═══════════════════════════════════════════════════════════
  // Calcul du score total (moyenne pondérée, ignore les inconnus)
  // ═══════════════════════════════════════════════════════════

  const knownDimensions = dimensions.filter((d) => d.score >= 0)
  const totalWeight = knownDimensions.reduce((sum, d) => sum + d.weight, 0)
  const weightedSum = knownDimensions.reduce(
    (sum, d) => sum + d.score * d.weight,
    0
  )

  const total =
    totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0

  return {
    total: dealBreakers.length > 0 ? Math.min(total, 15) : total,
    level: dealBreakers.length > 0 ? 'incompatible' : levelFromScore(total),
    dimensions,
    dealBreakers,
    coveredDimensions: knownDimensions.length,
    totalDimensions: dimensions.length,
  }
}
