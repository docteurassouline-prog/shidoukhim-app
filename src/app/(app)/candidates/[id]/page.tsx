import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  calculateAge,
  formatDate,
  formatDateTime,
  getStatusLabel,
  getAvailabilityLabel,
  getStatusColor,
  getAvailabilityColor,
  cn,
} from '@/lib/utils'
import {
  getCourantLabel,
  getCommunityEthnicLabel,
  getShabbatPracticeLabel,
  getKashrutLevelLabel,
  getHassidoutLabel,
  getNousahLabel,
  getHeadCoveringLabel,
  getTsnioutLabel,
  getChildrenEducationLabel,
} from '@/lib/constants/orthodox'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import {
  ArrowLeft,
  Edit,
  Heart,
  Share2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Briefcase,
  GraduationCap,
  BookOpen,
  Users,
  Star,
  Clock,
  ChevronRight,
} from 'lucide-react'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

interface DetailField {
  label: string
  value: string | number | boolean | null | undefined
}

function FieldRow({ label, value }: DetailField) {
  let displayValue: string

  if (value === null || value === undefined || value === '') {
    displayValue = 'Non renseigne'
  } else if (typeof value === 'boolean') {
    displayValue = value ? 'Oui' : 'Non'
  } else {
    displayValue = String(value)
  }

  const isEmpty = value === null || value === undefined || value === ''

  return (
    <div className="py-2">
      <dt className="text-xs font-medium text-ink-soft uppercase tracking-wider">
        {label}
      </dt>
      <dd
        className={cn(
          'mt-0.5 text-sm',
          isEmpty ? 'text-ink-soft/50 italic' : 'text-ink'
        )}
      >
        {displayValue}
      </dd>
    </div>
  )
}

function SectionGrid({ fields }: { fields: DetailField[] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
      {fields.map((f) => (
        <FieldRow key={f.label} {...f} />
      ))}
    </dl>
  )
}

// Client-side tabs wrapper
function CandidateDetailTabs({
  candidate,
  references,
  proposals,
  auditLogs,
}: {
  candidate: Record<string, unknown>
  references: Array<Record<string, unknown>>
  proposals: Array<Record<string, unknown>>
  auditLogs: Array<Record<string, unknown>>
}) {
  // This is a server component — we build all tabs statically
  // and use CSS-only tab switching via anchor targets

  const c = candidate

  const identityFields: DetailField[] = [
    { label: 'Prénom', value: c.first_name as string },
    { label: 'Nom', value: c.last_name as string },
    { label: 'Nom hébraïque', value: c.hebrew_name as string | null },
    { label: 'Date de naissance', value: c.date_of_birth ? formatDate(c.date_of_birth as string) : null },
    { label: 'Âge estimé', value: c.age_estimate as number | null },
    { label: 'Téléphone', value: c.phone as string | null },
    { label: 'WhatsApp', value: c.whatsapp as string | null },
    { label: 'Email', value: c.email as string | null },
    { label: 'Ville', value: c.city as string | null },
    { label: 'Pays', value: c.country as string | null },
    { label: 'Langues', value: Array.isArray(c.languages) ? (c.languages as string[]).join(', ') : c.languages as string | null },
    { label: 'Contact préféré', value: c.preferred_contact as string | null },
  ]

  const familyFields: DetailField[] = [
    { label: 'Situation matrimoniale', value: c.marital_status as string | null },
    { label: 'Enfants', value: c.has_children ? 'Oui' : 'Non' },
    { label: 'Détails enfants', value: c.children_details as string | null },
    { label: 'Fratrie', value: c.siblings as string | null },
    { label: 'Villes famille', value: c.family_cities as string | null },
    { label: 'Traditions familiales', value: c.family_traditions as string | null },
    { label: 'Rôle famille dans le projet', value: c.family_role_in_project as string | null },
    { label: 'Contexte familial', value: c.family_context as string | null },
  ]

  const religiousFields: DetailField[] = [
    { label: 'Courant', value: getCourantLabel(c.courant as string | null) },
    { label: 'Hassidout', value: getHassidoutLabel(c.hassidout as string | null) },
    { label: 'Nousah', value: getNousahLabel(c.nousah as string | null) },
    { label: 'Couverture de tete', value: getHeadCoveringLabel(c.head_covering as string | null) },
    { label: 'Communaute', value: getCommunityEthnicLabel(c.community as string | null) },
    { label: 'Synagogue', value: c.synagogue as string | null },
    { label: 'Rav de reference', value: c.rabbi_reference as string | null },
    { label: 'Ecole / Seminaire', value: c.school_seminary as string | null },
    { label: 'Traditions et minhaguim', value: c.traditions_minhaguim as string | null },
    { label: 'Pratique du Chabbat', value: getShabbatPracticeLabel(c.shabbat_practice as string | null) },
    { label: 'Niveau de Cacheroute', value: getKashrutLevelLabel(c.kashrut_level as string | null) },
    { label: 'Priere et etude', value: c.prayer_study as string | null },
    { label: 'Tsniout', value: getTsnioutLabel(c.tsniout as string | null) },
    { label: 'Projet de foyer religieux', value: c.religious_home_project as string | null },
    { label: 'Education des enfants', value: getChildrenEducationLabel(c.children_education as string | null) },
  ]

  const personalityFields: DetailField[] = [
    { label: 'Études', value: c.studies as string | null },
    { label: 'Profession', value: c.profession as string | null },
    { label: 'Emploi du temps', value: c.work_schedule as string | null },
    { label: 'Centres d\'intérêt', value: c.interests as string | null },
    { label: 'Tempérament', value: c.temperament as string | null },
    { label: 'Vie sociale', value: c.social_life as string | null },
    { label: 'Hobbies / Voyages', value: c.hobbies_travel as string | null },
    { label: 'Tabac', value: c.smoking as string | null },
    { label: 'Équilibre travail-vie', value: c.work_life_balance as string | null },
    { label: 'Implication communautaire', value: c.community_involvement as string | null },
    { label: 'Valeurs de couple', value: c.couple_values as string | null },
    { label: 'Vision du foyer', value: c.home_vision as string | null },
    { label: 'Note personnelle', value: c.personal_note as string | null },
  ]

  const expectationFields: DetailField[] = [
    { label: 'Âge souhaité (min)', value: c.age_min as number | null },
    { label: 'Âge souhaité (max)', value: c.age_max as number | null },
    { label: 'Villes souhaitées', value: c.preferred_cities as string | null },
    { label: 'Mobilité', value: c.mobility as string | null },
    { label: 'Statut matrimonial accepté', value: Array.isArray(c.accepted_marital_status) ? (c.accepted_marital_status as string[]).join(', ') : c.accepted_marital_status as string | null },
    { label: 'Projet religieux', value: c.religious_project as string | null },
    { label: 'Importance étude Torah', value: c.torah_study_importance as string | null },
    { label: 'Importance travail', value: c.work_importance as string | null },
    { label: 'Qualités attendues', value: c.expected_qualities as string | null },
    { label: 'Valeurs attendues', value: c.expected_values as string | null },
    { label: 'Style de vie attendu', value: c.expected_lifestyle as string | null },
    { label: 'Projet familial', value: c.family_project as string | null },
    { label: 'Mari idéal', value: c.ideal_husband as string | null },
    { label: 'Incompatibilités', value: c.incompatibilities as string | null },
    { label: 'Critères physiques', value: c.physical_criteria as string | null },
  ]

  return (
    <>
      {/* Resume */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] font-semibold text-ink">Resume</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-sm font-semibold text-ink-soft uppercase tracking-wider mb-3">
              Informations cles
            </h3>
            <SectionGrid
              fields={[
                { label: 'Age', value: calculateAge(c.date_of_birth as string | null, c.age_estimate as number | null, c.is_age_estimate as boolean) },
                { label: 'Ville', value: c.city as string | null },
                { label: 'Profession', value: c.profession as string | null },
                { label: 'Communaute', value: getCommunityEthnicLabel(c.community as string | null) },
                { label: 'Courant', value: getCourantLabel(c.courant as string | null) },
              ]}
            />
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-ink-soft uppercase tracking-wider mb-3">
              Note personnelle
            </h3>
            <p className="text-sm text-ink whitespace-pre-wrap">
              {(c.personal_note as string) || <span className="text-ink-soft/50 italic">Non renseigné</span>}
            </p>
          </Card>
        </div>
      </section>

      {/* Identite */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] font-semibold text-ink">Identite et contact</h2>
        <Card>
          <SectionGrid fields={identityFields} />
        </Card>
      </section>

      {/* Famille */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] font-semibold text-ink">Famille</h2>
        <Card>
          <SectionGrid fields={familyFields} />
        </Card>
      </section>

      {/* Vie religieuse */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] font-semibold text-ink">Vie religieuse</h2>
        <Card>
          <SectionGrid fields={religiousFields} />
        </Card>
      </section>

      {/* Personnalite */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] font-semibold text-ink">Personnalite et parcours</h2>
        <Card>
          <SectionGrid fields={personalityFields} />
        </Card>
      </section>

      {/* Attentes */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] font-semibold text-ink">Attentes</h2>
        <Card>
          <SectionGrid fields={expectationFields} />
        </Card>
      </section>

      {/* References */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] font-semibold text-ink">References</h2>
        <Card>
          {references.length === 0 ? (
            <p className="text-sm text-ink-soft italic py-4 text-center">
              Aucune reference enregistree
            </p>
          ) : (
            <div className="space-y-4">
              {references.map((ref) => (
                <div
                  key={ref.id as string}
                  className="flex items-start gap-3 p-3 rounded-lg bg-stone-50/50 border border-line"
                >
                  <Star className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {ref.reference_name as string}
                    </p>
                    {ref.relationship ? (
                      <p className="text-xs text-ink-soft mt-0.5">
                        {String(ref.relationship)}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-ink-soft">
                      {ref.reference_phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {String(ref.reference_phone)}
                        </span>
                      ) : null}
                      {ref.reference_email ? (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {String(ref.reference_email)}
                        </span>
                      ) : null}
                    </div>
                    {ref.feedback ? (
                      <p className="text-sm text-ink mt-2 whitespace-pre-wrap">
                        {String(ref.feedback)}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* Propositions */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] font-semibold text-ink">Propositions</h2>
        <Card>
          {proposals.length === 0 ? (
            <p className="text-sm text-ink-soft italic py-4 text-center">
              Aucune proposition pour cette candidate
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {proposals.map((p) => {
                const man = p.candidate_man as Record<string, unknown> | null
                return (
                  <li key={p.id as string}>
                    <Link
                      href={`/proposals/${p.id}`}
                      className="flex items-center justify-between py-3 hover:bg-stone-50/50 px-2 rounded-lg transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">
                          Proposition avec{' '}
                          {man
                            ? `${man.first_name} ${man.last_name}`
                            : 'candidat inconnu'}
                        </p>
                        <p className="text-xs text-ink-soft mt-0.5">
                          {formatDate(p.created_at as string)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            getStatusColor(p.status as string)
                          )}
                        >
                          {getStatusLabel(p.status as string)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-ink-soft" />
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </section>

      {/* Historique */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] font-semibold text-ink">Historique</h2>
        <Card>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-ink-soft italic py-4 text-center">
              Aucune entree dans l'historique
            </p>
          ) : (
            <ul className="space-y-3">
              {auditLogs.map((log) => {
                const logUser = log.user as Record<string, unknown> | null
                return (
                  <li
                    key={log.id as string}
                    className="flex items-start gap-3 text-sm"
                  >
                    <Clock className="h-4 w-4 text-ink-soft shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-ink">
                        <span className="font-medium">
                          {logUser?.full_name as string ?? 'Systeme'}
                        </span>
                        {' '}
                        {getStatusLabel(log.action as string)} - {log.entity_type as string}
                      </p>
                      <p className="text-xs text-ink-soft mt-0.5">
                        {formatDateTime(log.created_at as string)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </section>
    </>
  )
}

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch candidate
  const { data: candidate, error } = await supabase
    .from('candidates')
    .select(`
      *,
      assignments:candidate_assignments(
        user_id,
        is_primary,
        user_profiles(full_name, avatar_url)
      ),
      photos:candidate_photos(id, url, is_primary, order_index)
    `)
    .eq('id', id)
    .eq('organization_id', ORG_ID)
    .single()

  if (error || !candidate) {
    notFound()
  }

  // Fetch references, proposals, and audit logs in parallel
  const [refsRes, proposalsRes, logsRes] = await Promise.all([
    supabase
      .from('candidate_references')
      .select('*')
      .eq('candidate_id', id)
      .eq('candidate_type', 'woman')
      .order('created_at', { ascending: false }),

    supabase
      .from('proposals')
      .select(`
        id,
        status,
        created_at,
        candidate_man:candidates!proposals_candidate_man_id_fkey(
          id, first_name, last_name
        )
      `)
      .eq('candidate_woman_id', id)
      .eq('organization_id', ORG_ID)
      .order('created_at', { ascending: false }),

    supabase
      .from('audit_log')
      .select(`
        id,
        action,
        entity_type,
        details,
        created_at,
        user:user_profiles!audit_log_user_id_fkey(full_name)
      `)
      .eq('entity_id', id)
      .eq('entity_type', 'candidate')
      .eq('organization_id', ORG_ID)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const references = refsRes.data ?? []
  const proposals = proposalsRes.data ?? []
  const auditLogs = logsRes.data ?? []

  const primaryPhoto = (candidate.photos as Array<Record<string, unknown>>)?.find(
    (p) => p.is_primary
  )

  const assigneeName =
    (candidate.assignments as Array<Record<string, unknown>>)?.find(
      (a) => a.is_primary
    ) ??
    (candidate.assignments as Array<Record<string, unknown>>)?.[0]
  const assigneeProfile = assigneeName?.user_profiles as Record<string, unknown> | null

  return (
    <div className="space-y-6">
      {/* Retour */}
      <Link
        href="/candidates"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour a la liste
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <Avatar
          src={primaryPhoto?.url as string | undefined}
          name={`${candidate.first_name} ${candidate.last_name}`}
          size="xl"
        />

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h1 className="text-[30px] font-semibold text-ink">
              {candidate.first_name} {candidate.last_name}
            </h1>
            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  getAvailabilityColor(candidate.availability)
                )}
              >
                {getAvailabilityLabel(candidate.availability)}
              </span>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  getStatusColor(candidate.status)
                )}
              >
                {getStatusLabel(candidate.status)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-ink-soft">
            <span>
              {calculateAge(
                candidate.date_of_birth,
                candidate.age_estimate,
                candidate.is_age_estimate
              )}
            </span>
            {candidate.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {candidate.city}
              </span>
            )}
            {candidate.profession && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {candidate.profession}
              </span>
            )}
            {assigneeProfile && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {assigneeProfile.full_name as string}
              </span>
            )}
          </div>

          {/* Contact rapide */}
          <div className="flex flex-wrap gap-2 mt-3">
            {candidate.phone && (
              <a
                href={`tel:${candidate.phone}`}
                className="inline-flex items-center gap-1.5 text-xs text-sage hover:underline"
              >
                <Phone className="h-3.5 w-3.5" />
                {candidate.phone}
              </a>
            )}
            {candidate.email && (
              <a
                href={`mailto:${candidate.email}`}
                className="inline-flex items-center gap-1.5 text-xs text-sage hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                {candidate.email}
              </a>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link href={`/candidates/${id}/edit`}>
            <Button variant="secondary" size="sm" icon={<Edit className="h-4 w-4" />}>
              Modifier
            </Button>
          </Link>
          <Link href={`/proposals/new?woman=${id}`}>
            <Button variant="accent" size="sm" icon={<Heart className="h-4 w-4" />}>
              Proposer
            </Button>
          </Link>
        </div>
      </div>

      {/* Photo gallery */}
      {(candidate.photos as Array<Record<string, unknown>>)?.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {(candidate.photos as Array<Record<string, unknown>>)
            .sort((a, b) => (a.order_index as number) - (b.order_index as number))
            .map((photo) => (
              <div
                key={photo.id as string}
                className={cn(
                  'shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2',
                  photo.is_primary
                    ? 'border-sage'
                    : 'border-line'
                )}
              >
                <img
                  src={photo.url as string}
                  alt={`Photo de ${candidate.first_name}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
        </div>
      )}

      {/* Tabs content (all sections) */}
      <CandidateDetailTabs
        candidate={candidate as unknown as Record<string, unknown>}
        references={references as unknown as Array<Record<string, unknown>>}
        proposals={proposals as unknown as Array<Record<string, unknown>>}
        auditLogs={auditLogs as unknown as Array<Record<string, unknown>>}
      />

      {/* Meta */}
      <div className="text-xs text-ink-soft flex flex-wrap gap-4 pt-4 border-t border-line">
        <span>Cree le {formatDate(candidate.created_at)}</span>
        <span>Mis a jour le {formatDate(candidate.updated_at)}</span>
        {candidate.source && <span>Source : {candidate.source}</span>}
      </div>
    </div>
  )
}
