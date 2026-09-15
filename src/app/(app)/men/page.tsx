'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Users, MapPin, Briefcase, BookOpen } from 'lucide-react'
import { getMenCandidates } from '@/lib/candidates-men/actions'
import type { CandidateMan, CandidateStatus } from '@/lib/types'
import { calculateAge, getStatusLabel, getStatusColor, cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'En pause' },
  { value: 'matched', label: 'En couple' },
  { value: 'married', label: 'Marie' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archive' },
]

export default function MenPage() {
  const router = useRouter()
  const [men, setMen] = useState<CandidateMan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    async function fetchMen() {
      setLoading(true)
      setError(null)
      try {
        const data = await getMenCandidates()
        setMen(data as unknown as CandidateMan[])
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erreur lors du chargement des fiches.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchMen()
  }, [])

  const filteredMen = useMemo(() => {
    let results = men

    if (statusFilter) {
      results = results.filter((m) => m.status === statusFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      results = results.filter((m) => {
        const fullName = `${m.first_name} ${m.last_name}`.toLowerCase()
        return fullName.includes(query)
      })
    }

    return results
  }, [men, searchQuery, statusFilter])

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[30px] font-semibold text-ink">Fiches hommes</h1>
            <p className="mt-1 text-sm text-ink-soft">
              {loading
                ? 'Chargement...'
                : `${filteredMen.length} fiche${filteredMen.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link href="/men/new">
            <Button icon={<Plus className="h-4 w-4" />}>Nouveau profil</Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par nom..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery((e.target as HTMLInputElement).value)
              }
            />
          </div>
          <div className="w-full sm:w-56">
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="Filtrer par statut"
            />
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <svg
              className="animate-spin h-8 w-8 text-sage mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-ink-soft text-sm">Chargement des fiches...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="rounded-lg border border-danger/30 bg-danger/5 p-6 text-center">
            <p className="text-danger font-medium mb-1">Erreur</p>
            <p className="text-sm text-ink-soft">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredMen.length === 0 && (
          <div className="rounded-lg border border-line bg-surface p-12 text-center">
            <Users className="h-12 w-12 text-line mx-auto mb-4" />
            <h3 className="text-lg font-medium text-ink mb-1">
              Aucune fiche trouvee
            </h3>
            <p className="text-sm text-ink-soft mb-6">
              {searchQuery || statusFilter
                ? 'Aucun resultat ne correspond a vos criteres de recherche.'
                : 'Commencez par creer un premier profil.'}
            </p>
            {!searchQuery && !statusFilter && (
              <Link href="/men/new">
                <Button icon={<Plus className="h-4 w-4" />}>
                  Creer un profil
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Card grid */}
        {!loading && !error && filteredMen.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMen.map((man) => (
              <Link
                key={man.id}
                href={`/men/${man.id}`}
                className="block group"
              >
                <div
                  className={cn(
                    'bg-surface rounded-[14px] border border-line p-5',
                    'transition-all duration-150',
                    'hover:shadow-card-hover hover:border-sage/40',
                    'cursor-pointer'
                  )}
                >
                  {/* Name + status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-base font-semibold text-ink group-hover:text-plum transition-colors">
                      {man.first_name} {man.last_name}
                    </h3>
                    <Badge className={getStatusColor(man.status)} dot>
                      {getStatusLabel(man.status)}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-sm text-ink-soft">
                    {/* Age */}
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 shrink-0 text-gold" />
                      <span>
                        {calculateAge(
                          man.date_of_birth,
                          man.age_estimate,
                          man.is_age_estimate
                        )}
                      </span>
                    </div>

                    {/* City */}
                    {man.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" />
                        <span>{man.city}</span>
                      </div>
                    )}

                    {/* Profession */}
                    {man.profession && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 shrink-0 text-gold" />
                        <span>{man.profession}</span>
                      </div>
                    )}

                    {/* Community */}
                    {man.community && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 shrink-0 text-gold" />
                        <span>{man.community}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
