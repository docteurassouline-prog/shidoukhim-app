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

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    invitation_envoyee: 'bg-blue-100 text-blue-800',
    brouillon: 'bg-gray-100 text-gray-600',
    a_valider: 'bg-yellow-100 text-yellow-800',
    validee: 'bg-green-100 text-green-800',
    archivee: 'bg-gray-100 text-gray-500',

    envisagee: 'bg-gray-100 text-gray-600',
    accord_demande: 'bg-amber-100 text-amber-800',
    attente_retour: 'bg-yellow-100 text-yellow-800',
    acceptee: 'bg-emerald-100 text-emerald-800',
    rencontre_a_organiser: 'bg-sky-100 text-sky-800',
    rencontre_programmee: 'bg-indigo-100 text-indigo-800',
    rencontres_en_cours: 'bg-pink-100 text-pink-800',
    interrompue: 'bg-orange-100 text-orange-800',
    refusee: 'bg-red-100 text-red-700',
    aboutie: 'bg-violet-100 text-violet-800',

    a_planifier: 'bg-gray-100 text-gray-600',
    planifiee: 'bg-blue-100 text-blue-800',
    confirmee: 'bg-green-100 text-green-800',
    effectuee: 'bg-emerald-100 text-emerald-800',
    annulee: 'bg-gray-100 text-gray-500',
    absent: 'bg-red-100 text-red-700',

    a_faire: 'bg-yellow-100 text-yellow-800',
    en_cours: 'bg-blue-100 text-blue-800',
    terminee: 'bg-green-100 text-green-800',

    positif: 'bg-green-100 text-green-800',
    neutre: 'bg-gray-100 text-gray-600',
    negatif: 'bg-red-100 text-red-700',
    mitige: 'bg-orange-100 text-orange-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-600'
}

export function getAvailabilityColor(availability: string): string {
  const colors: Record<string, string> = {
    a_confirmer: 'bg-yellow-100 text-yellow-800',
    disponible: 'bg-green-100 text-green-800',
    en_rencontre: 'bg-pink-100 text-pink-800',
    en_pause: 'bg-orange-100 text-orange-800',
    fiancee: 'bg-violet-100 text-violet-800',
    mariee: 'bg-purple-100 text-purple-800',
  }
  return colors[availability] || 'bg-gray-100 text-gray-600'
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function truncate(str: string, n: number): string {
  if (str.length <= n) return str
  return str.slice(0, n).trimEnd() + '…'
}
