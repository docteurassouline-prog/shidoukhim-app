import type { ScoringConfig } from './types'

// ═══════════════════════════════════════════════════════════════
// Configuration par défaut du scoring
// Chaque poids (0–100) reflète l'importance relative de la dimension.
// La matrice courantCompatibility et les échelles ordonnées peuvent
// être ajustées sans toucher au moteur.
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_CONFIG: ScoringConfig = {
  weights: {
    courant: 95,
    community: 40,
    age: 70,
    city: 50,
    shabbat: 80,
    kashrut: 75,
    tsniout: 60,
    childrenEducation: 65,
    hassidout: 55,
    nousah: 30,
    maritalStatus: 45,
    languages: 35,
    hasChildren: 50,
  },

  // ─── Matrice de compatibilité des courants ──────────────────
  // Chaque valeur = score 0–100 de la paire.
  // La matrice est symétrique : on ne stocke qu'un sens,
  // le moteur vérifie les deux directions.
  courantCompatibility: {
    haredi_lituanien: {
      haredi_lituanien: 100,
      haredi_hassidique: 60,
      haredi_sefarade: 65,
      dati_torani: 40,
      dati_leumi: 20,
      orthodoxe_moderne: 15,
      massorti: 5,
      traditionnel: 5,
      baal_teshuva: 55,
      en_cheminement: 30,
    },
    haredi_hassidique: {
      haredi_hassidique: 100,
      haredi_sefarade: 50,
      dati_torani: 35,
      dati_leumi: 15,
      orthodoxe_moderne: 10,
      massorti: 5,
      traditionnel: 5,
      baal_teshuva: 50,
      en_cheminement: 25,
    },
    haredi_sefarade: {
      haredi_sefarade: 100,
      dati_torani: 55,
      dati_leumi: 30,
      orthodoxe_moderne: 20,
      massorti: 10,
      traditionnel: 10,
      baal_teshuva: 60,
      en_cheminement: 35,
    },
    dati_torani: {
      dati_torani: 100,
      dati_leumi: 75,
      orthodoxe_moderne: 45,
      massorti: 15,
      traditionnel: 15,
      baal_teshuva: 65,
      en_cheminement: 40,
    },
    dati_leumi: {
      dati_leumi: 100,
      orthodoxe_moderne: 70,
      massorti: 30,
      traditionnel: 25,
      baal_teshuva: 60,
      en_cheminement: 45,
    },
    orthodoxe_moderne: {
      orthodoxe_moderne: 100,
      massorti: 55,
      traditionnel: 40,
      baal_teshuva: 60,
      en_cheminement: 50,
    },
    massorti: {
      massorti: 100,
      traditionnel: 65,
      baal_teshuva: 45,
      en_cheminement: 55,
    },
    traditionnel: {
      traditionnel: 100,
      baal_teshuva: 40,
      en_cheminement: 60,
    },
    baal_teshuva: {
      baal_teshuva: 85,
      en_cheminement: 70,
    },
    en_cheminement: {
      en_cheminement: 80,
    },
  },

  // ─── Échelles ordonnées (du plus strict au moins strict) ────
  // Le moteur calcule la distance relative sur l'échelle.
  orderedScales: {
    shabbat: [
      'shomer_complet',
      'shomer_principal',
      'kidoush_repas',
      'partiel',
      'en_cheminement',
      'non',
    ],
    kashrut: [
      'mehadrin',
      'glatt',
      'rabbanout',
      'maison_stricte',
      'maison',
      'partiel',
      'en_cheminement',
      'non',
    ],
    tsniout: ['stricte', 'classique', 'moderee', 'liberale'],
  },

  ageTolerance: 2,

  dealBreakers: {
    courantMismatchBelow: 10,
    ageOutOfRange: false,
  },
}
