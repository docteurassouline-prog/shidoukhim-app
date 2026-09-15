import { differenceInYears, format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export function calculateAge(
  dateOfBirth: string | null,
  ageEstimate: number | null,
  isEstimate: boolean
): string {
  if (dateOfBirth && !isEstimate) {
    const age = differenceInYears(new Date(), parseISO(dateOfBirth))
    return `${age} ans`
  }
  if (ageEstimate !== null) {
    return `~${ageEstimate} ans`
  }
  return 'Non renseigné'
}

export function formatDate(date: string): string {
  try {
    return format(parseISO(date), 'd MMMM yyyy', { locale: fr })
  } catch {
    return date
  }
}

export function formatDateTime(date: string): string {
  try {
    return format(parseISO(date), "d MMMM yyyy 'à' HH:mm", { locale: fr })
  } catch {
    return date
  }
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    invitation_envoyee: 'Invitation envoyée',
    brouillon: 'Brouillon',
    a_valider: 'À valider',
    validee: 'Validée',
    archivee: 'Archivée',

    envisagee: 'Envisagée',
    accord_demande: 'Accord demandé',
    attente_retour: 'Attente retour',
    acceptee: 'Acceptée',
    rencontre_a_organiser: 'Rencontre à organiser',
    rencontre_programmee: 'Rencontre programmée',
    rencontres_en_cours: 'Rencontres en cours',
    interrompue: 'Interrompue',
    refusee: 'Refusée',
    aboutie: 'Aboutie',

    a_planifier: 'À planifier',
    planifiee: 'Planifiée',
    confirmee: 'Confirmée',
    effectuee: 'Effectuée',
    annulee: 'Annulée',
    absent: 'Absent',

    a_faire: 'À faire',
    en_cours: 'En cours',
    terminee: 'Terminée',

    positif: 'Positif',
    neutre: 'Neutre',
    negatif: 'Négatif',
    mitige: 'Mitigé',

    en_attente: 'En attente',
    expiree: 'Expirée',
    revoquee: 'Révoquée',
  }
  return labels[status] || status
}

export function getAvailabilityLabel(availability: string): string {
  const labels: Record<string, string> = {
    a_confirmer: 'À confirmer',
    disponible: 'Disponible',
    en_rencontre: 'En rencontre',
    en_pause: 'En pause',
    fiancee: 'Fiancée',
    mariee: 'Mariée',
  }
  return labels[availability] || availability
}

const TONE = {
  neutral: 'bg-stone-100 text-stone-600',
  faded: 'bg-stone-100 text-stone-500',
  gold: 'bg-gold-light text-gold-deep',
  sage: 'bg-sage-light text-sage-deep',
  plum: 'bg-plum-light text-plum',
  danger: 'bg-danger-light text-danger-deep',
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    invitation_envoyee: TONE.gold,
    brouillon: TONE.neutral,
    a_valider: TONE.gold,
    validee: TONE.sage,
    archivee: TONE.faded,

    envisagee: TONE.neutral,
    accord_demande: TONE.plum,
    attente_retour: TONE.gold,
    acceptee: TONE.sage,
    rencontre_a_organiser: TONE.plum,
    rencontre_programmee: TONE.plum,
    rencontres_en_cours: TONE.plum,
    interrompue: TONE.danger,
    refusee: TONE.danger,
    aboutie: TONE.gold,

    a_planifier: TONE.neutral,
    planifiee: TONE.plum,
    confirmee: TONE.sage,
    effectuee: TONE.sage,
    annulee: TONE.faded,
    absent: TONE.danger,

    a_faire: TONE.gold,
    en_cours: TONE.plum,
    terminee: TONE.sage,

    positif: TONE.sage,
    neutre: TONE.neutral,
    negatif: TONE.danger,
    mitige: TONE.gold,
  }
  return colors[status] || TONE.neutral
}

export function getAvailabilityColor(availability: string): string {
  const colors: Record<string, string> = {
    a_confirmer: TONE.gold,
    disponible: TONE.sage,
    en_rencontre: TONE.plum,
    en_pause: TONE.gold,
    fiancee: TONE.gold,
    mariee: TONE.gold,
  }
  return colors[availability] || TONE.neutral
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function truncate(str: string, n: number): string {
  if (str.length <= n) return str
  return str.slice(0, n).trimEnd() + '…'
}
