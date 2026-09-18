'use client'

import { useEffect, useState, useCallback, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  LayoutGrid,
  Table,
  Columns3,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  MapPin,
  Calendar,
  User,
  Users,
} from 'lucide-react'
import { getCandidates, getMatchmakers } from '@/lib/candidates/actions'
import type {
  Candidate,
  CandidateStatus,
  CandidateAvailability,
  UserProfile,
} from '@/lib/types'
import {
  calculateAge,
  formatDate,
  getStatusLabel,
  getAvailabilityLabel,
  getStatusColor,
  getAvailabilityColor,
  cn,
  truncate,
} from '@/lib/utils'
import {
  getCourantLabel,
  getCommunityEthnicLabel,
  courantOptions,
  communityEthnicOptions,
} from '@/lib/constants/orthodox'
import Button from '@/components/ui/Button'
import SearchInput from '@/components/ui/SearchInput'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'

const ORG_ID = '00000000-0000-0000-0000-000000000001'
const PER_PAGE = 20

type ViewMode = 'cards' | 'table' | 'status'
type SortField = 'last_name' | 'date_of_birth' | 'city' | 'availability' | 'status' | 'updated_at'
type SortOrder = 'asc' | 'desc'

const statusOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'a_valider', label: 'A valider' },
  { value: 'validee', label: 'Validee' },
  { value: 'archivee', label: 'Archivee' },
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'invitation_envoyee', label: 'Invitation envoyee' },
]

const availabilityOptions = [
  { value: '', label: 'Toutes les disponibilites' },
  { value: 'disponible', label: 'Disponible' },
  { value: 'en_rencontre', label: 'En rencontre' },
  { value: 'en_pause', label: 'En pause' },
  { value: 'a_confirmer', label: 'A confirmer' },
  { value: 'fiancee', label: 'Fiancee' },
  { value: 'mariee', label: 'Mariee' },
]

const availabilityColumns: CandidateAvailability[] = [
  'a_confirmer',
  'disponible',
  'en_rencontre',
  'en_pause',
  'fiancee',
  'mariee',
]

interface CandidateWithAssignment extends Candidate {
  assignments?: Array<{
    chadkhanit_id: string | null
    role: string | null
    user_profiles: { full_name: string } | null
  }>
}

export default function CandidatesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  // Filters from URL
  const search = searchParams.get('search') ?? ''
  const statusFilter = searchParams.get('status') ?? ''
  const availabilityFilter = searchParams.get('availability') ?? ''
  const cityFilter = searchParams.get('city') ?? ''
  const courantFilter = searchParams.get('courant') ?? ''
  const communityFilter = searchParams.get('community') ?? ''
  const maritalFilter = searchParams.get('marital') ?? ''
  const assigneeFilter = searchParams.get('assignee') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1', 10)

  // Sort
  const [sortField, setSortField] = useState<SortField>('updated_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Data
  const [candidates, setCandidates] = useState<CandidateWithAssignment[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [matchmakers, setMatchmakers] = useState<
    Pick<UserProfile, 'id' | 'full_name'>[]
  >([])

  // Update URL params
  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      // Reset page when filters change (unless page itself is being set)
      if (!('page' in updates)) {
        params.delete('page')
      }
      startTransition(() => {
        router.push(`/candidates?${params.toString()}`, { scroll: false })
      })
    },
    [searchParams, router, startTransition]
  )

  // Load matchmakers for filter
  useEffect(() => {
    async function loadMatchmakers() {
      const data = await getMatchmakers()
      if (data) setMatchmakers(data)
    }
    loadMatchmakers()
  }, [])

  // Load candidates
  useEffect(() => {
    async function loadCandidates() {
      setLoading(true)

      const result = await getCandidates({
        search: search || undefined,
        status: statusFilter || undefined,
        availability: availabilityFilter || undefined,
        city: cityFilter || undefined,
        courant: courantFilter || undefined,
        community: communityFilter || undefined,
        marital_status: maritalFilter || undefined,
        sortField,
        sortOrder,
        page,
        perPage: PER_PAGE,
      })

      setCandidates(result.candidates as unknown as CandidateWithAssignment[])
      setTotalCount(result.totalCount)
      setLoading(false)
    }

    loadCandidates()
  }, [search, statusFilter, availabilityFilter, cityFilter, courantFilter, communityFilter, maritalFilter, assigneeFilter, page, sortField, sortOrder])

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE))

  function getAssigneeName(c: CandidateWithAssignment): string | null {
    const primary = c.assignments?.find((a) => a.role === 'principale' || a.role === 'primary')
    return primary?.user_profiles?.full_name ?? c.assignments?.[0]?.user_profiles?.full_name ?? null
  }

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // =================== Render helpers ===================

  function renderFilters() {
    return (
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
        <SearchInput
          value={search}
          onChange={(val) => updateParams({ search: val })}
          placeholder="Rechercher par nom..."
          className="w-full sm:w-64"
        />
        <Select
          options={availabilityOptions}
          value={availabilityFilter}
          onChange={(e) => updateParams({ availability: e.target.value })}
          className="w-full sm:w-auto"
        />
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => updateParams({ status: e.target.value })}
          className="w-full sm:w-auto"
        />
        <input
          type="text"
          value={cityFilter}
          onChange={(e) => updateParams({ city: e.target.value })}
          placeholder="Ville..."
          className="w-full sm:w-40 rounded-lg border border-line bg-surface px-3 py-2 text-sm h-10 placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage"
        />
        <Select
          options={[
            { value: '', label: 'Tous les courants' },
            ...courantOptions.filter(o => o.value),
          ]}
          value={courantFilter}
          onChange={(e) => updateParams({ courant: e.target.value })}
          className="w-full sm:w-auto"
        />
        <Select
          options={[
            { value: '', label: 'Toutes communautes' },
            ...communityEthnicOptions.filter(o => o.value),
          ]}
          value={communityFilter}
          onChange={(e) => updateParams({ community: e.target.value })}
          className="w-full sm:w-auto"
        />
        <Select
          options={[
            { value: '', label: 'Toute situation' },
            { value: 'celibataire', label: 'Celibataire' },
            { value: 'divorce', label: 'Divorce(e)' },
            { value: 'veuf', label: 'Veuf/Veuve' },
          ]}
          value={maritalFilter}
          onChange={(e) => updateParams({ marital: e.target.value })}
          className="w-full sm:w-auto"
        />
        {matchmakers.length > 0 && (
          <Select
            options={[
              { value: '', label: 'Toutes les chadkhaniot' },
              ...matchmakers.map((m) => ({ value: m.id, label: m.full_name })),
            ]}
            value={assigneeFilter}
            onChange={(e) => updateParams({ assignee: e.target.value })}
            className="w-full sm:w-auto"
          />
        )}
      </div>
    )
  }

  function renderPagination() {
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-ink-soft">
          {totalCount} resultat{totalCount > 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => updateParams({ page: String(page - 1) })}
            icon={<ChevronLeft className="h-4 w-4" />}
          >
            Precedent
          </Button>
          <span className="text-sm text-ink-soft px-2">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => updateParams({ page: String(page + 1) })}
            iconRight={<ChevronRight className="h-4 w-4" />}
          >
            Suivant
          </Button>
        </div>
      </div>
    )
  }

  function renderCardView() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {candidates.map((c) => (
          <Link key={c.id} href={`/candidates/${c.id}`}>
            <Card className="card-hover cursor-pointer h-full">
              <div className="flex items-start gap-3">
                <Avatar
                  src={null}
                  name={`${c.first_name} ${c.last_name}`}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-ink truncate">
                    {c.first_name} {c.last_name}
                  </h3>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {calculateAge(c.date_of_birth, c.age_estimate, c.is_age_estimate)}
                  </p>
                  {c.city && (
                    <p className="text-xs text-ink-soft flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {c.city}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    getAvailabilityColor(c.availability)
                  )}
                >
                  {getAvailabilityLabel(c.availability)}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    getStatusColor(c.status)
                  )}
                >
                  {getStatusLabel(c.status)}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-line flex items-center justify-between text-xs text-ink-soft">
                {getAssigneeName(c) ? (
                  <span className="flex items-center gap-1 truncate">
                    <User className="h-3 w-3" />
                    {getAssigneeName(c)}
                  </span>
                ) : (
                  <span className="italic">Non assignee</span>
                )}
                <span className="flex items-center gap-1 shrink-0">
                  <Calendar className="h-3 w-3" />
                  {formatDate(c.updated_at)}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    )
  }

  function renderTableView() {
    const sortableColumns: { key: SortField; label: string }[] = [
      { key: 'last_name', label: 'Nom' },
      { key: 'date_of_birth', label: 'Age' },
      { key: 'city', label: 'Ville' },
    ]

    const fixedColumns = ['Profession', 'Courant', 'Communaute', 'Situation', 'Disponibilite', 'Statut']

    const dash = <span className="text-ink-soft/40">--</span>

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              {sortableColumns.map((col) => (
                <th
                  key={col.key}
                  className="text-left py-3 px-3 text-xs font-medium text-ink-soft uppercase tracking-wider whitespace-nowrap"
                >
                  <button
                    onClick={() => handleSort(col.key)}
                    className="flex items-center gap-1 hover:text-ink transition-colors"
                  >
                    {col.label}
                    <ArrowUpDown className={cn(
                      'h-3 w-3',
                      sortField === col.key ? 'text-sage' : 'text-ink-soft/40'
                    )} />
                  </button>
                </th>
              ))}
              {fixedColumns.map((label) => (
                <th key={label} className="text-left py-3 px-3 text-xs font-medium text-ink-soft uppercase tracking-wider whitespace-nowrap">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {candidates.map((c) => {
              const raw = c as unknown as Record<string, unknown>
              return (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/candidates/${c.id}`)}
                  className="hover:bg-stone-50/50 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={null} name={`${c.first_name} ${c.last_name}`} size="sm" />
                      <span className="font-medium text-ink whitespace-nowrap">
                        {c.first_name} {c.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-ink-soft whitespace-nowrap">
                    {calculateAge(c.date_of_birth, c.age_estimate, c.is_age_estimate)}
                  </td>
                  <td className="py-2.5 px-3 text-ink-soft whitespace-nowrap">
                    {c.city || dash}
                  </td>
                  <td className="py-2.5 px-3 text-ink-soft whitespace-nowrap">
                    {(raw.profession as string) || dash}
                  </td>
                  <td className="py-2.5 px-3 text-ink-soft whitespace-nowrap">
                    {getCourantLabel(raw.courant as string | null) !== (raw.courant as string | null)
                      ? getCourantLabel(raw.courant as string | null)
                      : (raw.courant as string) || dash}
                  </td>
                  <td className="py-2.5 px-3 text-ink-soft whitespace-nowrap">
                    {getCommunityEthnicLabel(raw.community as string | null) !== (raw.community as string | null)
                      ? getCommunityEthnicLabel(raw.community as string | null)
                      : (raw.community as string) || dash}
                  </td>
                  <td className="py-2.5 px-3 text-ink-soft whitespace-nowrap">
                    {(raw.marital_status as string) || dash}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      getAvailabilityColor(c.availability)
                    )}>
                      {getAvailabilityLabel(c.availability)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      getStatusColor(c.status)
                    )}>
                      {getStatusLabel(c.status)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  function renderStatusView() {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {availabilityColumns.map((avail) => {
          const colCandidates = candidates.filter(
            (c) => c.availability === avail
          )
          return (
            <div
              key={avail}
              className="shrink-0 w-72 bg-stone-50/50 rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-ink">
                  {getAvailabilityLabel(avail)}
                </h3>
                <span className="text-xs text-ink-soft bg-surface rounded-full px-2 py-0.5 border border-line">
                  {colCandidates.length}
                </span>
              </div>
              <div className="space-y-2">
                {colCandidates.map((c) => (
                  <Link key={c.id} href={`/candidates/${c.id}`}>
                    <div className="bg-surface rounded-lg border border-line p-3 hover:shadow-card transition-shadow cursor-pointer">
                      <p className="text-sm font-medium text-ink truncate">
                        {c.first_name} {c.last_name}
                      </p>
                      <p className="text-xs text-ink-soft mt-0.5">
                        {calculateAge(c.date_of_birth, c.age_estimate, c.is_age_estimate)}
                        {c.city && ` - ${c.city}`}
                      </p>
                    </div>
                  </Link>
                ))}
                {colCandidates.length === 0 && (
                  <p className="text-xs text-ink-soft text-center py-4 italic">
                    Aucune candidate
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // =================== Main render ===================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-ink">Candidates</h1>
          <p className="text-sm text-ink-soft mt-1">
            {totalCount} fiche{totalCount > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-surface border border-line rounded-lg p-0.5">
            {(
              [
                { mode: 'cards' as ViewMode, icon: LayoutGrid, label: 'Cartes' },
                { mode: 'table' as ViewMode, icon: Table, label: 'Tableau' },
                { mode: 'status' as ViewMode, icon: Columns3, label: 'Par statut' },
              ] as const
            ).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  viewMode === mode
                    ? 'bg-sage/10 text-sage'
                    : 'text-ink-soft hover:bg-stone-100'
                )}
                title={label}
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          <Link href="/candidates/new">
            <Button icon={<Plus className="h-4 w-4" />}>Nouvelle fiche</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Content */}
      <Card padding="none" className={viewMode !== 'table' && !loading && candidates.length > 0 ? 'hidden' : 'overflow-hidden'}>
        {loading ? (
          <LoadingSpinner text="Chargement des candidates..." />
        ) : candidates.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="Aucune candidate trouvee"
            description={
              search || statusFilter || availabilityFilter || cityFilter
                ? 'Essayez de modifier vos filtres de recherche.'
                : 'Commencez par creer une nouvelle fiche candidate.'
            }
            actionLabel={
              !search && !statusFilter && !availabilityFilter && !cityFilter
                ? 'Creer une fiche'
                : undefined
            }
            onAction={
              !search && !statusFilter && !availabilityFilter && !cityFilter
                ? () => router.push('/candidates/new')
                : undefined
            }
          />
        ) : viewMode === 'table' ? (
          renderTableView()
        ) : null}
      </Card>
      {!loading && candidates.length > 0 && viewMode === 'cards' && renderCardView()}
      {!loading && candidates.length > 0 && viewMode === 'status' && renderStatusView()}

      {/* Pagination */}
      {!loading && candidates.length > 0 && renderPagination()}
    </div>
  )
}
