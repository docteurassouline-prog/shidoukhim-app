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
      <dt className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">
        {label}
      </dt>
      <dd
        className={cn(
          'mt-0.5 text-sm',
          isEmpty ? 'text-[#6B7280]/50 italic' : 'text-[#2D2D2D]'
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
    { label: 'Prenom', value: c.first_name as string },
    { label: 'Nom', value: c.last_name as string },
    { label: 'Nom hebraique', value: c.hebrew_name as string | null },
    { label: 'Nom de jeune fille', value: c.maiden_name as string | null },
    { label: 'Date de naissance', value: c.date_of_birth ? formatDate(c.date_of_birth as string) : null },
    { label: 'Nationalite', value: c.nationality as string | null },
    { label: 'Pays d\'origine', value: c.country_of_origin as string | null },
    { label: 'Telephone', value: c.phone as string | null },
    { label: 'Telephone secondaire', value: c.phone_secondary as string | null },
    { label: 'Email', value: c.email as string | null },
    { label: 'Adresse', value: c.address as string | null },
    { label: 'Ville', value: c.city as string | null },
    { label: 'Code postal', value: c.postal_code as string | null },
    { label: 'Pays', value: c.country as string | null },
  ]

  const physicalFields: DetailField[] = [
    { label: 'Taille (cm)', value: c.height_cm as number | null },
    { label: 'Corpulence', value: c.build as string | null },
    { label: 'Couleur de cheveux', value: c.hair_color as string | null },
    { label: 'Couleur des yeux', value: c.eye_color as string | null },
    { label: 'Description physique', value: c.physical_description as string | null },
  ]

  const familyFields: DetailField[] = [
    { label: 'Nom du pere', value: c.father_name as string | null },
    { label: 'Profession du pere', value: c.father_profession as string | null },
    { label: 'Origine du pere', value: c.father_origin as string | null },
    { label: 'Nom de la mere', value: c.mother_name as string | null },
    { label: 'Nom de jeune fille de la mere', value: c.mother_maiden_name as string | null },
    { label: 'Profession de la mere', value: c.mother_profession as string | null },
    { label: 'Origine de la mere', value: c.mother_origin as string | null },
    { label: 'Nombre de freres/soeurs', value: c.siblings_count as number | null },
    { label: 'Detail fratrie', value: c.siblings_details as string | null },
    { label: 'Situation familiale', value: c.family_situation as string | null },
  ]

  const religiousFields: DetailField[] = [
    { label: 'Niveau de pratique', value: c.religious_level as string | null },
    { label: 'Hashkafa', value: c.hashkafa as string | null },
    { label: 'Communaute', value: c.community as string | null },
    { label: 'Synagogue', value: c.synagogue as string | null },
    { label: 'Cohen / Levi / Israel', value: c.cohen_levi_israel as string | null },
    { label: 'Chabbat', value: c.keeps_shabbat as boolean | null },
    { label: 'Cacherout', value: c.keeps_kashrut as boolean | null },
  ]

  const personalityFields: DetailField[] = [
    { label: 'Niveau d\'etudes', value: c.education_level as string | null },
    { label: 'Ecole / Universite', value: c.school as string | null },
    { label: 'Diplome', value: c.diploma as string | null },
    { label: 'Profession', value: c.profession as string | null },
    { label: 'Employeur', value: c.employer as string | null },
    { label: 'Situation matrimoniale', value: c.marital_history as string | null },
    { label: 'Enfants', value: c.has_children ? `Oui (${c.children_count ?? '?'})` : 'Non' },
    { label: 'Souhaite des enfants', value: c.wants_children as boolean | null },
  ]

  const expectationFields: DetailField[] = [
    { label: 'Age souhaite (min)', value: c.preferred_age_min as number | null },
    { label: 'Age souhaite (max)', value: c.preferred_age_max as number | null },
    { label: 'Taille souhaitee (min cm)', value: c.preferred_height_min as number | null },
    { label: 'Taille souhaitee (max cm)', value: c.preferred_height_max as number | null },
    { label: 'Niveau religieux souhaite', value: c.preferred_religious_level as string | null },
    { label: 'Hashkafa souhaitee', value: c.preferred_hashkafa as string | null },
    { label: 'Communaute souhaitee', value: c.preferred_community as string | null },
    { label: 'Lieu souhaite', value: c.preferred_location as string | null },
    { label: 'Profession souhaitee', value: c.preferred_profession as string | null },
    { label: 'Points redhibitoires', value: c.deal_breakers as string | null },
    { label: 'Description du partenaire ideal', value: c.partner_description as string | null },
  ]

  return (
    <>
      {/* Resume */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#2D2D2D]">Resume</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-3">
              Informations cles
            </h3>
            <SectionGrid
              fields={[
                { label: 'Age', value: calculateAge(c.date_of_birth as string | null, c.age_estimate as number | null, c.is_age_estimate as boolean) },
                { label: 'Ville', value: c.city as string | null },
                { label: 'Profession', value: c.profession as string | null },
                { label: 'Communaute', value: c.community as string | null },
                { label: 'Hashkafa', value: c.hashkafa as string | null },
                { label: 'Niveau de pratique', value: c.religious_level as string | null },
              ]}
            />
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-3">
              Notes
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-[#6B7280]">Notes generales</p>
                <p className="text-sm text-[#2D2D2D] mt-0.5 whitespace-pre-wrap">
                  {(c.notes as string) || <span className="text-[#6B7280]/50 italic">Non renseigne</span>}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#6B7280]">Impression de la chadkhanit</p>
                <p className="text-sm text-[#2D2D2D] mt-0.5 whitespace-pre-wrap">
                  {(c.matchmaker_impression as string) || <span className="text-[#6B7280]/50 italic">Non renseigne</span>}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Identite */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#2D2D2D]">Identite et contact</h2>
        <Card>
          <SectionGrid fields={identityFields} />
          <div className="mt-4 pt-4 border-t border-[#E8E0D4]">
            <h3 className="text-sm font-semibold text-[#6B7280] mb-2">Physique</h3>
            <SectionGrid fields={physicalFields} />
          </div>
        </Card>
      </section>

      {/* Famille */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#2D2D2D]">Famille</h2>
        <Card>
          <SectionGrid fields={familyFields} />
        </Card>
      </section>

      {/* Vie religieuse */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#2D2D2D]">Vie religieuse</h2>
        <Card>
          <SectionGrid fields={religiousFields} />
        </Card>
      </section>

      {/* Personnalite */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#2D2D2D]">Personnalite et parcours</h2>
        <Card>
          <SectionGrid fields={personalityFields} />
        </Card>
      </section>

      {/* Attentes */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#2D2D2D]">Attentes</h2>
        <Card>
          <SectionGrid fields={expectationFields} />
        </Card>
      </section>

      {/* References */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#2D2D2D]">References</h2>
        <Card>
          {references.length === 0 ? (
            <p className="text-sm text-[#6B7280] italic py-4 text-center">
              Aucune reference enregistree
            </p>
          ) : (
            <div className="space-y-4">
              {references.map((ref) => (
                <div
                  key={ref.id as string}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 border border-[#E8E0D4]"
                >
                  <Star className="h-5 w-5 text-[#C5A55A] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2D2D2D]">
                      {ref.reference_name as string}
                    </p>
                    {ref.relationship ? (
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        {String(ref.relationship)}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-[#6B7280]">
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
                      <p className="text-sm text-[#2D2D2D] mt-2 whitespace-pre-wrap">
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
        <h2 className="text-lg font-semibold text-[#2D2D2D]">Propositions</h2>
        <Card>
          {proposals.length === 0 ? (
            <p className="text-sm text-[#6B7280] italic py-4 text-center">
              Aucune proposition pour cette candidate
            </p>
          ) : (
            <ul className="divide-y divide-[#E8E0D4]">
              {proposals.map((p) => {
                const man = p.candidate_man as Record<string, unknown> | null
                return (
                  <li key={p.id as string}>
                    <Link
                      href={`/proposals/${p.id}`}
                      className="flex items-center justify-between py-3 hover:bg-gray-50/50 px-2 rounded-lg transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#2D2D2D]">
                          Proposition avec{' '}
                          {man
                            ? `${man.first_name} ${man.last_name}`
                            : 'candidat inconnu'}
                        </p>
                        <p className="text-xs text-[#6B7280] mt-0.5">
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
                        <ChevronRight className="h-4 w-4 text-[#6B7280]" />
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
        <h2 className="text-lg font-semibold text-[#2D2D2D]">Historique</h2>
        <Card>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-[#6B7280] italic py-4 text-center">
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
                    <Clock className="h-4 w-4 text-[#6B7280] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[#2D2D2D]">
                        <span className="font-medium">
                          {logUser?.full_name as string ?? 'Systeme'}
                        </span>
                        {' '}
                        {getStatusLabel(log.action as string)} - {log.entity_type as string}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-0.5">
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
      .from('audit_logs')
      .select(`
        id,
        action,
        entity_type,
        details,
        created_at,
        user:user_profiles!audit_logs_user_id_fkey(full_name)
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
        className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#2D2D2D] transition-colors"
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
            <h1 className="text-2xl font-bold text-[#2D2D2D]">
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

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-[#6B7280]">
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
                className="inline-flex items-center gap-1.5 text-xs text-[#87A878] hover:underline"
              >
                <Phone className="h-3.5 w-3.5" />
                {candidate.phone}
              </a>
            )}
            {candidate.email && (
              <a
                href={`mailto:${candidate.email}`}
                className="inline-flex items-center gap-1.5 text-xs text-[#87A878] hover:underline"
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
                    ? 'border-[#87A878]'
                    : 'border-[#E8E0D4]'
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
      <div className="text-xs text-[#6B7280] flex flex-wrap gap-4 pt-4 border-t border-[#E8E0D4]">
        <span>Cree le {formatDate(candidate.created_at)}</span>
        <span>Mis a jour le {formatDate(candidate.updated_at)}</span>
        {candidate.source && <span>Source : {candidate.source}</span>}
      </div>
    </div>
  )
}
