'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Camera,
  Search,
  ArrowUpDown,
  Users,
} from 'lucide-react'
import { getAllCandidates } from '@/lib/candidates/actions'
import { uploadCandidatePhoto } from '@/lib/candidates/photos'
import {
  calculateAge,
  getStatusLabel,
  getStatusColor,
  cn,
} from '@/lib/utils'
import {
  getCourantLabel,
  getCommunityEthnicLabel,
  courantOptions,
  communityEthnicOptions,
} from '@/lib/constants/orthodox'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Avatar from '@/components/ui/Avatar'

export default function CandidatesPage() {
  const router = useRouter()
  const [allCandidates, setAllCandidates] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)

  // Shared filters
  const [courantFilter, setCourantFilter] = useState('')
  const [communityFilter, setCommunityFilter] = useState('')
  const [maritalFilter, setMaritalFilter] = useState('')

  // Per-side search
  const [searchW, setSearchW] = useState('')
  const [searchM, setSearchM] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const result = await getAllCandidates({
        courant: courantFilter || undefined,
        community: communityFilter || undefined,
        marital_status: maritalFilter || undefined,
        sortField: 'last_name',
        sortOrder: 'asc',
        perPage: 9999,
      })
      setAllCandidates(result.candidates)
      setLoading(false)
    }
    load()
  }, [courantFilter, communityFilter, maritalFilter])

  const women = useMemo(() => {
    let list = allCandidates.filter(c => c._gender === 'F')
    if (searchW.trim()) {
      const q = searchW.trim().toLowerCase()
      list = list.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(q))
    }
    return list
  }, [allCandidates, searchW])

  const men = useMemo(() => {
    let list = allCandidates.filter(c => c._gender === 'H')
    if (searchM.trim()) {
      const q = searchM.trim().toLowerCase()
      list = list.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(q))
    }
    return list
  }, [allCandidates, searchM])

  async function handlePhotoUpload(candidateId: string, gender: string, file: File) {
    setUploadingFor(candidateId)
    try {
      const table = gender === 'H' ? 'candidates_men' : 'candidates'
      const formData = new FormData()
      formData.append('photo', file)
      await uploadCandidatePhoto(candidateId, table, formData)
      // Refresh
      const result = await getAllCandidates({
        courant: courantFilter || undefined,
        community: communityFilter || undefined,
        marital_status: maritalFilter || undefined,
        sortField: 'last_name',
        sortOrder: 'asc',
        perPage: 9999,
      })
      setAllCandidates(result.candidates)
    } catch (err) {
      console.error('Erreur upload photo:', err)
    } finally {
      setUploadingFor(null)
    }
  }

  function renderCandidateRow(c: Record<string, unknown>) {
    const id = c.id as string
    const gender = c._gender as string
    const firstName = c.first_name as string
    const lastName = c.last_name as string
    const photoUrl = c.photo_url as string | null
    const detailPath = gender === 'H' ? `/men/${id}` : `/candidates/${id}`
    const dash = <span className="text-ink-soft/30">-</span>

    return (
      <tr
        key={id}
        className="hover:bg-sage/5 cursor-pointer transition-colors group"
      >
        {/* Photo */}
        <td className="py-1.5 px-2">
          <div className="relative w-9 h-9 shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={`${firstName} ${lastName}`}
                className="w-9 h-9 rounded-full object-cover border border-line"
              />
            ) : (
              <Avatar src={null} name={`${firstName} ${lastName}`} size="sm" />
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="h-3.5 w-3.5 text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handlePhotoUpload(id, gender, file)
                  e.target.value = ''
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </label>
            {uploadingFor === id && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full">
                <div className="w-3 h-3 border-2 border-sage border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </td>
        {/* Nom */}
        <td className="py-1.5 px-2" onClick={() => router.push(detailPath)}>
          <span className="font-medium text-ink text-sm whitespace-nowrap hover:text-plum transition-colors">
            {firstName} {lastName}
          </span>
        </td>
        {/* Age */}
        <td className="py-1.5 px-2 text-ink-soft text-xs whitespace-nowrap" onClick={() => router.push(detailPath)}>
          {calculateAge(c.date_of_birth as string | null, c.age_estimate as number | null, (c.is_age_estimate as boolean | null) ?? false)}
        </td>
        {/* Ville */}
        <td className="py-1.5 px-2 text-ink-soft text-xs whitespace-nowrap" onClick={() => router.push(detailPath)}>
          {(c.city as string) || dash}
        </td>
        {/* Courant */}
        <td className="py-1.5 px-2 text-ink-soft text-xs whitespace-nowrap" onClick={() => router.push(detailPath)}>
          {c.courant ? getCourantLabel(c.courant as string) : dash}
        </td>
        {/* Communaute */}
        <td className="py-1.5 px-2 text-ink-soft text-xs whitespace-nowrap" onClick={() => router.push(detailPath)}>
          {c.community ? getCommunityEthnicLabel(c.community as string) : dash}
        </td>
        {/* Statut */}
        <td className="py-1.5 px-2" onClick={() => router.push(detailPath)}>
          <span className={cn(
            'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
            getStatusColor(c.status as string)
          )}>
            {getStatusLabel(c.status as string)}
          </span>
        </td>
      </tr>
    )
  }

  function renderPanel(
    title: string,
    items: Record<string, unknown>[],
    search: string,
    setSearch: (v: string) => void,
    newLink: string,
    colorAccent: string,
    bgAccent: string
  ) {
    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Panel header */}
        <div className={cn('flex items-center justify-between px-4 py-3 border-b border-line', bgAccent)}>
          <div className="flex items-center gap-2">
            <h2 className={cn('text-base font-semibold', colorAccent)}>{title}</h2>
            <span className="text-xs text-ink-soft bg-surface rounded-full px-2 py-0.5 border border-line">
              {items.length}
            </span>
          </div>
          <Link href={newLink}>
            <Button variant="ghost" size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
              Ajouter
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-line">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-soft/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-line bg-surface text-sm placeholder:text-ink-soft/60 focus:outline-none focus:ring-1 focus:ring-sage focus:border-sage"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-sage border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-ink-soft">
              <Users className="h-8 w-8 mb-2 text-line" />
              <p className="text-sm">Aucun profil</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface z-10">
                <tr className="border-b border-line">
                  <th className="text-left py-2 px-2 text-[10px] font-medium text-ink-soft uppercase w-10"></th>
                  <th className="text-left py-2 px-2 text-[10px] font-medium text-ink-soft uppercase">Nom</th>
                  <th className="text-left py-2 px-2 text-[10px] font-medium text-ink-soft uppercase">Age</th>
                  <th className="text-left py-2 px-2 text-[10px] font-medium text-ink-soft uppercase">Ville</th>
                  <th className="text-left py-2 px-2 text-[10px] font-medium text-ink-soft uppercase">Courant</th>
                  <th className="text-left py-2 px-2 text-[10px] font-medium text-ink-soft uppercase">Comm.</th>
                  <th className="text-left py-2 px-2 text-[10px] font-medium text-ink-soft uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/50">
                {items.map(renderCandidateRow)}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top bar with shared filters */}
      <div className="shrink-0 px-4 py-3 border-b border-line bg-surface">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-ink">Shidoukhim</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              options={[
                { value: '', label: 'Tous les courants' },
                ...courantOptions.filter(o => o.value),
              ]}
              value={courantFilter}
              onChange={(e) => setCourantFilter(e.target.value)}
              className="w-auto text-xs"
            />
            <Select
              options={[
                { value: '', label: 'Toutes communautes' },
                ...communityEthnicOptions.filter(o => o.value),
              ]}
              value={communityFilter}
              onChange={(e) => setCommunityFilter(e.target.value)}
              className="w-auto text-xs"
            />
            <Select
              options={[
                { value: '', label: 'Toute situation' },
                { value: 'celibataire', label: 'Celibataire' },
                { value: 'divorce', label: 'Divorce(e)' },
                { value: 'veuf', label: 'Veuf/Veuve' },
              ]}
              value={maritalFilter}
              onChange={(e) => setMaritalFilter(e.target.value)}
              className="w-auto text-xs"
            />
          </div>
        </div>
      </div>

      {/* Split panels */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Women */}
        <div className="w-1/2 border-r-2 border-plum/20 flex flex-col min-h-0">
          {renderPanel(
            'Filles',
            women,
            searchW,
            setSearchW,
            '/candidates/new',
            'text-pink-700',
            'bg-pink-50/50'
          )}
        </div>

        {/* Right: Men */}
        <div className="w-1/2 flex flex-col min-h-0">
          {renderPanel(
            'Garcons',
            men,
            searchM,
            setSearchM,
            '/men/new',
            'text-blue-700',
            'bg-blue-50/50'
          )}
        </div>
      </div>
    </div>
  )
}
