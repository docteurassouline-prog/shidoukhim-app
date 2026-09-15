'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  Heart,
  ArrowRight,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getStatusLabel, getStatusColor, formatDate, cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import SearchInput from '@/components/ui/SearchInput'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const ORG_ID = '00000000-0000-0000-0000-000000000001'
const PER_PAGE = 20

const statusOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'envisagee', label: 'Envisagee' },
  { value: 'accord_demande', label: 'Accord demande' },
  { value: 'attente_retour', label: 'Attente retour' },
  { value: 'acceptee', label: 'Acceptee' },
  { value: 'rencontre_a_organiser', label: 'Rencontre a organiser' },
  { value: 'rencontre_programmee', label: 'Rencontre programmee' },
  { value: 'rencontres_en_cours', label: 'Rencontres en cours' },
  { value: 'interrompue', label: 'Interrompue' },
  { value: 'refusee', label: 'Refusee' },
  { value: 'aboutie', label: 'Aboutie' },
]

interface ProposalRow {
  id: string
  status: string
  proposed_at: string | null
  matchmaker_notes: string | null
  woman_response: string | null
  man_response: string | null
  next_action: string | null
  next_action_date: string | null
  created_at: string
  updated_at: string
  candidate_woman: {
    id: string
    first_name: string
    last_name: string
    city: string | null
    age_estimate: number | null
  } | null
  candidate_man: {
    id: string
    first_name: string
    last_name: string
    city: string | null
    age_estimate: number | null
  } | null
  creator: {
    full_name: string
  } | null
}

export default function ProposalsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [proposals, setProposals] = useState<ProposalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const statusFilter = searchParams.get('status') || ''
  const searchQuery = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      if (key !== 'page') params.delete('page')
      router.push(`/proposals?${params.toString()}`)
    },
    [searchParams, router]
  )

  useEffect(() => {
    async function fetchProposals() {
      setLoading(true)
      const supabase = createClient()

      let query = supabase
        .from('proposals')
        .select(
          `
          id,
          status,
          proposed_at:created_at,
          matchmaker_notes:notes,
          woman_response:agreement_f,
          man_response:agreement_m,
          next_action,
          next_action_date,
          created_at,
          updated_at,
          candidate_woman:candidates!proposals_candidate_woman_id_fkey(id, first_name, last_name, city, age_estimate),
          candidate_man:candidates_men!proposals_candidate_man_id_fkey(id, first_name, last_name, city, age_estimate),
          creator:user_profiles!proposals_created_by_fkey(full_name)
        `,
          { count: 'exact' }
        )
        .eq('organization_id', ORG_ID)

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      // Sort by updated_at desc
      query = query.order('updated_at', { ascending: false })

      // Pagination
      const from = (page - 1) * PER_PAGE
      query = query.range(from, from + PER_PAGE - 1)

      const { data, count, error } = await query

      if (error) {
        console.error('Erreur chargement propositions:', error)
      } else {
        // Filter by search if needed (client-side since it spans joined tables)
        let filtered = (data ?? []).map((row: Record<string, unknown>) => ({
          ...row,
          candidate_woman: Array.isArray(row.candidate_woman) ? row.candidate_woman[0] ?? null : row.candidate_woman,
          candidate_man: Array.isArray(row.candidate_man) ? row.candidate_man[0] ?? null : row.candidate_man,
          creator: Array.isArray(row.creator) ? row.creator[0] ?? null : row.creator,
        })) as ProposalRow[]
        if (searchQuery) {
          const q = searchQuery.toLowerCase()
          filtered = filtered.filter((p) => {
            const wName = p.candidate_woman
              ? `${p.candidate_woman.first_name} ${p.candidate_woman.last_name}`.toLowerCase()
              : ''
            const mName = p.candidate_man
              ? `${p.candidate_man.first_name} ${p.candidate_man.last_name}`.toLowerCase()
              : ''
            return wName.includes(q) || mName.includes(q)
          })
        }
        setProposals(filtered)
        setTotalCount(count ?? 0)
      }
      setLoading(false)
    }

    fetchProposals()
  }, [statusFilter, searchQuery, page])

  const totalPages = Math.ceil(totalCount / PER_PAGE)

  function getResponseIcon(response: string | null): string {
    if (!response) return '…'
    if (['oui', 'accepte', 'acceptee', 'accord'].includes(response)) return 'Oui'
    if (['non', 'refuse', 'refusee'].includes(response)) return 'Non'
    if (response === 'en_attente') return 'En attente'
    return getStatusLabel(response)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-ink">Propositions</h1>
          <p className="text-sm text-ink-soft mt-1">
            {totalCount} proposition{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/proposals/new">
          <Button icon={<Plus className="h-4 w-4" />}>
            Nouvelle proposition
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-sm">
          <SearchInput
            value={searchQuery}
            onChange={(val) => updateParam('q', val)}
            placeholder="Rechercher par nom..."
          />
        </div>
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => updateParam('status', e.target.value)}
          className="w-full sm:w-48"
        />
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : proposals.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-12 w-12" />}
          title="Aucune proposition"
          description={
            statusFilter || searchQuery
              ? 'Aucune proposition ne correspond a vos criteres.'
              : 'Creez votre premiere proposition de shidoukh.'
          }
          action={
            <Link href="/proposals/new">
              <Button icon={<Plus className="h-4 w-4" />}>
                Nouvelle proposition
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {proposals.map((proposal) => (
            <Link
              key={proposal.id}
              href={`/proposals/${proposal.id}`}
              className="group"
            >
              <Card className="hover:shadow-card-hover transition-shadow h-full">
                {/* Status badge + date */}
                <div className="flex items-center justify-between mb-4">
                  <Badge variant={proposal.status as never}>
                    {getStatusLabel(proposal.status)}
                  </Badge>
                  <span className="text-xs text-ink-soft">
                    {formatDate(proposal.updated_at)}
                  </span>
                </div>

                {/* Woman / Man pair */}
                <div className="flex items-center gap-3 mb-4">
                  {/* Woman */}
                  <div className="flex-1 bg-plum-light rounded-lg p-3 text-center">
                    <p className="text-xs text-ink-soft uppercase tracking-wider mb-1">
                      Elle
                    </p>
                    <p className="text-sm font-semibold text-ink">
                      {proposal.candidate_woman
                        ? `${proposal.candidate_woman.first_name} ${proposal.candidate_woman.last_name}`
                        : '(supprimee)'}
                    </p>
                    {proposal.candidate_woman?.city && (
                      <p className="text-xs text-ink-soft mt-0.5">
                        {proposal.candidate_woman.city}
                      </p>
                    )}
                  </div>

                  <Heart className="h-5 w-5 text-plum shrink-0" />

                  {/* Man */}
                  <div className="flex-1 bg-plum-light rounded-lg p-3 text-center">
                    <p className="text-xs text-ink-soft uppercase tracking-wider mb-1">
                      Lui
                    </p>
                    <p className="text-sm font-semibold text-ink">
                      {proposal.candidate_man
                        ? `${proposal.candidate_man.first_name} ${proposal.candidate_man.last_name}`
                        : '(supprime)'}
                    </p>
                    {proposal.candidate_man?.city && (
                      <p className="text-xs text-ink-soft mt-0.5">
                        {proposal.candidate_man.city}
                      </p>
                    )}
                  </div>
                </div>

                {/* Responses */}
                <div className="flex items-center gap-4 text-xs text-ink-soft mb-3">
                  <span>
                    Reponse elle :{' '}
                    <span className="font-medium text-ink">
                      {getResponseIcon(proposal.woman_response)}
                    </span>
                  </span>
                  <span>
                    Reponse lui :{' '}
                    <span className="font-medium text-ink">
                      {getResponseIcon(proposal.man_response)}
                    </span>
                  </span>
                </div>

                {/* Coordinator */}
                {proposal.creator && (
                  <div className="flex items-center gap-1.5 text-xs text-ink-soft mb-2">
                    <User className="h-3.5 w-3.5" />
                    <span>{proposal.creator.full_name}</span>
                  </div>
                )}

                {/* Next action */}
                {proposal.next_action && (
                  <div className="flex items-start gap-1.5 text-xs bg-gold/5 border border-gold/20 rounded-md px-2.5 py-1.5 mt-2">
                    <ArrowRight className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
                    <div>
                      <span className="text-ink font-medium">
                        {proposal.next_action}
                      </span>
                      {proposal.next_action_date && (
                        <span className="text-ink-soft ml-1">
                          ({formatDate(proposal.next_action_date)})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => updateParam('page', String(page - 1))}
            icon={<ChevronLeft className="h-4 w-4" />}
          >
            Precedent
          </Button>
          <span className="text-sm text-ink-soft">
            Page {page} sur {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => updateParam('page', String(page + 1))}
            iconRight={<ChevronRight className="h-4 w-4" />}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  )
}
