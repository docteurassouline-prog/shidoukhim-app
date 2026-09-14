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
import { createClient } from '@/lib/supabase/client'
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
    user_id: string
    is_primary: boolean
    user_profiles: { full_name: string } | null
  }>
}

export default function CandidatesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('cards')

  // Filters from URL
  const search = searchParams.get('search') ?? ''
  const statusFilter = searchParams.get('status') ?? ''
  const availabilityFilter = searchParams.get('availability') ?? ''
  const cityFilter = searchParams.get('city') ?? ''
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
      const supabase = createClient()
      const { data } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .eq('organization_id', ORG_ID)
        .eq('is_active', true)
        .in('role', ['admin', 'matchmaker'])
        .order('full_name')

      if (data) setMatchmakers(data)
    }
    loadMatchmakers()
  }, [])

  // Load candidates
  useEffect(() => {
    async function loadCandidates() {
      setLoading(true)
      const supabase = createClient()

      let query = supabase
        .from('candidates')
        .select(
          `
          *,
          assignments:candidate_assignments(
            user_id,
            is_primary,
            user_profiles(full_name)
          )
        `,
          { count: 'exact' }
        )
        .eq('organization_id', ORG_ID)
        .eq('gender', 'female')

      // Apply filters
      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%`
        )
      }
      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }
      if (availabilityFilter) {
        query = query.eq('availability', availabilityFilter)
      }
      if (cityFilter) {
        query = query.ilike('city', `%${cityFilter}%`)
      }

      // Sort
      query = query.order(sortField, { ascending: sortOrder === 'asc' })

      // Pagination
      const from = (page - 1) * PER_PAGE
      query = query.range(from, from + PER_PAGE - 1)

      const { data, count, error } = await query

      if (error) {
        console.error('Erreur chargement candidates:', error)
        setCandidates([])
        setTotalCount(0)
      } else {
        setCandidates((data as CandidateWithAssignment[]) ?? [])
        setTotalCount(count ?? 0)
      }

      setLoading(false)
    }

    loadCandidates()
  }, [search, statusFilter, availabilityFilter, cityFilter, assigneeFilter, page, sortField, sortOrder])

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE))

  function getAssigneeName(c: CandidateWithAssignment): string | null {
    const primary = c.assignments?.find((a) => a.is_primary)
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
          className="w-full sm:w-40 rounded-lg border border-[#E8E0D4] bg-white px-3 py-2 text-sm h-10 placeholder:text-[#6B7280]/60 focus:outline-none focus:ring-2 focus:ring-[#87A878] focus:border-[#87A878]"
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
        <p className="text-sm text-[#6B7280]">
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
          <span className="text-sm text-[#6B7280] px-2">
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
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="flex items-start gap-3">
                <Avatar
                  src={null}
                  name={`${c.first_name} ${c.last_name}`}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[#2D2D2D] truncate">
                    {c.first_name} {c.last_name}
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {calculateAge(c.date_of_birth, c.age_estimate, c.is_age_estimate)}
                  </p>
                  {c.city && (
                    <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-0.5">
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

              <div className="mt-3 pt-3 border-t border-[#E8E0D4] flex items-center justify-between text-xs text-[#6B7280]">
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
    const columns: { key: SortField; label: string }[] = [
      { key: 'last_name', label: 'Nom' },
      { key: 'date_of_birth', label: 'Age' },
      { key: 'city', label: 'Ville' },
      { key: 'availability', label: 'Disponibilite' },
      { key: 'status', label: 'Statut' },
      { key: 'updated_at', label: 'Mise a jour' },
    ]

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E8E0D4]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left py-3 px-4 text-xs font-medium text-[#6B7280] uppercase tracking-wider"
                >
                  <button
                    onClick={() => handleSort(col.key)}
                    className="flex items-center gap-1 hover:text-[#2D2D2D] transition-colors"
                  >
                    {col.label}
                    <ArrowUpDown className={cn(
                      'h-3 w-3',
                      sortField === col.key ? 'text-[#87A878]' : 'text-[#6B7280]/40'
                    )} />
                  </button>
                </th>
              ))}
              <th className="text-left py-3 px-4 text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                Chadkhanit
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E0D4]">
            {candidates.map((c) => (
              <tr
                key={c.id}
                onClick={() => router.push(`/candidates/${c.id}`)}
                className="hover:bg-gray-50/50 cursor-pointer transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={null}
                      name={`${c.first_name} ${c.last_name}`}
                      size="sm"
                    />
                    <span className="font-medium text-[#2D2D2D]">
                      {c.first_name} {c.last_name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-[#6B7280]">
                  {calculateAge(c.date_of_birth, c.age_estimate, c.is_age_estimate)}
                </td>
                <td className="py-3 px-4 text-[#6B7280]">
                  {c.city ?? <span className="italic text-[#6B7280]/50">--</span>}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      getAvailabilityColor(c.availability)
                    )}
                  >
                    {getAvailabilityLabel(c.availability)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      getStatusColor(c.status)
                    )}
                  >
                    {getStatusLabel(c.status)}
                  </span>
                </td>
                <td className="py-3 px-4 text-[#6B7280] text-xs">
                  {formatDate(c.updated_at)}
                </td>
                <td className="py-3 px-4 text-[#6B7280] text-xs">
                  {getAssigneeName(c) ?? <span className="italic">--</span>}
                </td>
              </tr>
            ))}
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
              className="shrink-0 w-72 bg-gray-50/50 rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#2D2D2D]">
                  {getAvailabilityLabel(avail)}
                </h3>
                <span className="text-xs text-[#6B7280] bg-white rounded-full px-2 py-0.5 border border-[#E8E0D4]">
                  {colCandidates.length}
                </span>
              </div>
              <div className="space-y-2">
                {colCandidates.map((c) => (
                  <Link key={c.id} href={`/candidates/${c.id}`}>
                    <div className="bg-white rounded-lg border border-[#E8E0D4] p-3 hover:shadow-sm transition-shadow cursor-pointer">
                      <p className="text-sm font-medium text-[#2D2D2D] truncate">
                        {c.first_name} {c.last_name}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        {calculateAge(c.date_of_birth, c.age_estimate, c.is_age_estimate)}
                        {c.city && ` - ${c.city}`}
                      </p>
                    </div>
                  </Link>
                ))}
                {colCandidates.length === 0 && (
                  <p className="text-xs text-[#6B7280] text-center py-4 italic">
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
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Candidates</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {totalCount} fiche{totalCount > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-white border border-[#E8E0D4] rounded-lg p-0.5">
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
                    ? 'bg-[#87A878]/10 text-[#87A878]'
                    : 'text-[#6B7280] hover:bg-gray-100'
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
      <Card padding="none" className="overflow-hidden">
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
        ) : (
          <div className={viewMode === 'table' ? '' : 'p-4'}>
            {viewMode === 'cards' && renderCardView()}
            {viewMode === 'table' && renderTableView()}
            {viewMode === 'status' && renderStatusView()}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {!loading && candidates.length > 0 && renderPagination()}
    </div>
  )
}
