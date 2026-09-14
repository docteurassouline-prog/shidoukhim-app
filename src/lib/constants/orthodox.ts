// Constantes pour le monde orthodoxe et ses sous-courants
// Chaque option a une valeur (stockée en DB) et un label (affiché)

export const courantOptions = [
  { value: '', label: 'Choisir...' },
  { value: 'haredi_lituanien', label: 'Haredi Lituanien (Yeshivish)' },
  { value: 'haredi_hassidique', label: 'Haredi Hassidique' },
  { value: 'haredi_sefarade', label: 'Haredi Séfarade' },
  { value: 'dati_torani', label: 'Dati Torani (Hardal)' },
  { value: 'dati_leumi', label: 'Dati Léoumi (Sioniste religieux)' },
  { value: 'orthodoxe_moderne', label: 'Orthodoxe Moderne' },
  { value: 'massorti', label: 'Massorti (Conservative)' },
  { value: 'traditionnel', label: 'Traditionnel' },
  { value: 'baal_teshuva', label: "Ba'al Téchouva" },
  { value: 'en_cheminement', label: 'En cheminement' },
  { value: 'autre', label: 'Autre' },
]

export const hassidoutOptions = [
  { value: '', label: 'Non applicable' },
  { value: 'loubavitch', label: 'Loubavitch (Habad)' },
  { value: 'breslev', label: 'Breslev' },
  { value: 'gour', label: 'Gour' },
  { value: 'satmar', label: 'Satmar' },
  { value: 'belz', label: 'Belz' },
  { value: 'vizhnitz', label: 'Vizhnitz' },
  { value: 'amshinov', label: 'Amshinov' },
  { value: 'karlin_stolin', label: 'Karlin-Stolin' },
  { value: 'sanz_klausenburg', label: 'Sanz-Klausenburg' },
  { value: 'bobov', label: 'Bobov' },
  { value: 'skver', label: 'Skver' },
  { value: 'munkatch', label: 'Munkatch' },
  { value: 'toldot_aharon', label: 'Toldot Aharon' },
  { value: 'erlau', label: 'Erlau' },
  { value: 'pittsburg', label: 'Pittsburgh' },
  { value: 'autre', label: 'Autre hassidout' },
]

export const nousahOptions = [
  { value: '', label: 'Choisir...' },
  { value: 'ashkenaz', label: 'Ashkénaz (Nousah Ashkénaz)' },
  { value: 'sefarad_hassidi', label: 'Séfarad Hassidi (Nousah Sfard)' },
  { value: 'edot_hamizrah', label: 'Edot Hamizrah (Séfarade oriental)' },
  { value: 'teimani', label: 'Téimani (Yéménite)' },
  { value: 'italien', label: 'Italien (Minhag Italki)' },
  { value: 'mixte', label: 'Mixte / Indéterminé' },
]

export const kipaTypeOptions = [
  { value: '', label: 'Choisir...' },
  { value: 'kipa_srouga', label: 'Kipa srouga (tricotée)' },
  { value: 'kipa_srouga_grande', label: 'Kipa srouga grande' },
  { value: 'kipa_noire', label: 'Kipa noire (velours/satin)' },
  { value: 'chapeau', label: 'Chapeau' },
  { value: 'streimel', label: 'Streimel' },
  { value: 'spodik', label: 'Spodik' },
  { value: 'casquette', label: 'Casquette' },
  { value: 'aucune', label: 'Ne porte pas de kipa' },
]

export const headCoveringOptions = [
  { value: '', label: 'Non applicable (célibataire)' },
  { value: 'perruque', label: 'Perruque (Sheitel)' },
  { value: 'foulard', label: 'Foulard (Mitpa\'hat)' },
  { value: 'chapeau', label: 'Chapeau' },
  { value: 'beret', label: 'Béret' },
  { value: 'turban', label: 'Turban' },
  { value: 'snood', label: 'Snood' },
  { value: 'mixte', label: 'Perruque + Foulard selon les occasions' },
  { value: 'aucun', label: 'Pas de couverture' },
  { value: 'apres_mariage', label: 'Prête à couvrir après le mariage' },
]

export const shabbatPracticeOptions = [
  { value: '', label: 'Choisir...' },
  { value: 'shomer_complet', label: 'Chomer Chabbat complet' },
  { value: 'shomer_principal', label: 'Chomer Chabbat (principalement)' },
  { value: 'kidoush_repas', label: 'Kidouch et repas de Chabbat' },
  { value: 'partiel', label: 'Pratique partielle' },
  { value: 'en_cheminement', label: 'En cheminement' },
  { value: 'non', label: 'Non pratiquant' },
]

export const kashrutLevelOptions = [
  { value: '', label: 'Choisir...' },
  { value: 'mehadrin', label: 'Méhadrin (stricte)' },
  { value: 'glatt', label: 'Glatt / Halak Beit Yossef' },
  { value: 'rabbanout', label: 'Rabbanout (Cacheroute standard)' },
  { value: 'maison_stricte', label: 'Cachère strict à la maison' },
  { value: 'maison', label: 'Cachère à la maison' },
  { value: 'partiel', label: 'Cacheroute partielle' },
  { value: 'en_cheminement', label: 'En cheminement' },
  { value: 'non', label: 'Non cachère' },
]

export const tsnioutOptions = [
  { value: '', label: 'Choisir...' },
  { value: 'stricte', label: 'Stricte (manches longues, jupes longues, collants)' },
  { value: 'classique', label: 'Classique (coudes couverts, genoux couverts)' },
  { value: 'moderee', label: 'Modérée' },
  { value: 'liberale', label: 'Tenue libre' },
]

export const torahStudyOptions = [
  { value: '', label: 'Choisir...' },
  { value: 'kolel_plein', label: 'Kolel à plein temps' },
  { value: 'kolel_demi', label: 'Kolel demi-journée + travail' },
  { value: 'yeshiva_gevoha', label: "Yeshiva Guevoha (post-mariage)" },
  { value: 'seder_quotidien', label: 'Séder quotidien (matin ou soir)' },
  { value: 'daf_yomi', label: 'Daf Yomi' },
  { value: 'cours_hebdo', label: 'Cours hebdomadaires' },
  { value: 'chabbat', label: 'Étude le Chabbat' },
  { value: 'occasionnel', label: 'Occasionnel' },
  { value: 'non', label: 'Pas d\'étude régulière' },
]

export const cohenLeviIsraelOptions = [
  { value: '', label: 'Choisir...' },
  { value: 'cohen', label: 'Cohen' },
  { value: 'levi', label: 'Lévi' },
  { value: 'israel', label: 'Israël' },
]

export const communityEthnicOptions = [
  { value: '', label: 'Choisir...' },
  { value: 'ashkenaze', label: 'Ashkénaze' },
  { value: 'sefarade_nord_afrique', label: 'Séfarade (Afrique du Nord)' },
  { value: 'sefarade_moyen_orient', label: 'Séfarade (Moyen-Orient)' },
  { value: 'teimani', label: 'Téimani (Yéménite)' },
  { value: 'ethiopien', label: 'Éthiopien (Beta Israel)' },
  { value: 'mixte', label: 'Mixte' },
  { value: 'autre', label: 'Autre' },
]

export const childrenEducationOptions = [
  { value: '', label: 'Choisir...' },
  { value: 'talmud_torah', label: 'Talmud Torah / Heder' },
  { value: 'ecole_juive_orthodoxe', label: 'École juive orthodoxe' },
  { value: 'ecole_juive_moderne', label: 'École juive moderne' },
  { value: 'ecole_publique_complement', label: 'École publique + complément juif' },
  { value: 'flexible', label: 'Flexible / À discuter' },
]

// Labels pour l'affichage (profil, listes)
export function getCourantLabel(value: string | null): string {
  if (!value) return ''
  return courantOptions.find(o => o.value === value)?.label ?? value
}

export function getHassidoutLabel(value: string | null): string {
  if (!value) return ''
  return hassidoutOptions.find(o => o.value === value)?.label ?? value
}

export function getNousahLabel(value: string | null): string {
  if (!value) return ''
  return nousahOptions.find(o => o.value === value)?.label ?? value
}

export function getKipaTypeLabel(value: string | null): string {
  if (!value) return ''
  return kipaTypeOptions.find(o => o.value === value)?.label ?? value
}

export function getHeadCoveringLabel(value: string | null): string {
  if (!value) return ''
  return headCoveringOptions.find(o => o.value === value)?.label ?? value
}

export function getShabbatPracticeLabel(value: string | null): string {
  if (!value) return ''
  return shabbatPracticeOptions.find(o => o.value === value)?.label ?? value
}

export function getKashrutLevelLabel(value: string | null): string {
  if (!value) return ''
  return kashrutLevelOptions.find(o => o.value === value)?.label ?? value
}

export function getTsnioutLabel(value: string | null): string {
  if (!value) return ''
  return tsnioutOptions.find(o => o.value === value)?.label ?? value
}

export function getTorahStudyLabel(value: string | null): string {
  if (!value) return ''
  return torahStudyOptions.find(o => o.value === value)?.label ?? value
}

export function getCohenLeviIsraelLabel(value: string | null): string {
  if (!value) return ''
  return cohenLeviIsraelOptions.find(o => o.value === value)?.label ?? value
}

export function getCommunityEthnicLabel(value: string | null): string {
  if (!value) return ''
  return communityEthnicOptions.find(o => o.value === value)?.label ?? value
}

export function getChildrenEducationLabel(value: string | null): string {
  if (!value) return ''
  return childrenEducationOptions.find(o => o.value === value)?.label ?? value
}
