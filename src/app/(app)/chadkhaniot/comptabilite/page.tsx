'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Receipt,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Heart,
  ChevronDown,
  ChevronUp,
  Trash2,
  CircleDollarSign,
  CalendarPlus,
} from 'lucide-react'
import {
  getFeesSummary,
  getProposalsForFees,
  addMeetingFees,
  addShadkhaniotFees,
  markFeePaid,
  markFeeOverdue,
  deleteFee,
} from '@/lib/fees/actions'
import type { FeesSummary, FeeRow, ProposalWithFees } from '@/lib/fees/actions'
import { cn, formatDate } from '@/lib/utils'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'

const FEE_TYPE_LABELS: Record<string, string> = {
  rencontre_homme: 'Rencontre (lui)',
  rencontre_femme: 'Rencontre (elle)',
  shadkhaniot_homme: 'Shadkhaniot (lui)',
  shadkhaniot_femme: 'Shadkhaniot (elle)',
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  en_attente: { label: 'En attente', bg: 'bg-[#C5A55A]/15', text: 'text-[#6B5020]' },
  paye: { label: 'Paye', bg: 'bg-[#87A878]/15', text: 'text-[#2E5A22]' },
  en_retard: { label: 'En retard', bg: 'bg-[#C45B5B]/10', text: 'text-[#9B3030]' },
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

function FeeStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.en_attente
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', config.bg, config.text)}>
      {config.label}
    </span>
  )
}

function ProposalFeesCard({
  proposal,
  onRefresh,
}: {
  proposal: ProposalWithFees
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function handleMarkPaid(feeId: string) {
    setActionLoading(feeId)
    await markFeePaid(feeId)
    onRefresh()
    setActionLoading(null)
  }

  async function handleMarkOverdue(feeId: string) {
    setActionLoading(feeId)
    await markFeeOverdue(feeId)
    onRefresh()
    setActionLoading(null)
  }

  async function handleDelete(feeId: string) {
    setActionLoading(feeId)
    await deleteFee(feeId)
    onRefresh()
    setActionLoading(null)
  }

  const rencontreFees = proposal.fees.filter((f) => f.fee_type.startsWith('rencontre'))
  const shadkhaniotFees = proposal.fees.filter((f) => f.fee_type.startsWith('shadkhaniot'))

  return (
    <div className="bg-white rounded-xl border border-[#E8E0D4] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Heart className="h-4 w-4 text-[#6B3A5B] shrink-0" />
          <div className="text-left min-w-0">
            <p className="text-sm font-semibold text-[#2D2D2D] truncate">
              {proposal.woman_name} & {proposal.man_name}
            </p>
            <p className="text-xs text-[#4B5563]">
              {proposal.meetings_count} rencontre{proposal.meetings_count !== 1 ? 's' : ''}
              {shadkhaniotFees.length > 0 && ' · Shadkhaniot facturees'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-[#2D2D2D]">{formatEuro(proposal.total_due)}</p>
            {proposal.total_pending > 0 && (
              <p className="text-xs text-[#C45B5B]">{formatEuro(proposal.total_pending)} en attente</p>
            )}
            {proposal.total_pending === 0 && proposal.total_due > 0 && (
              <p className="text-xs text-[#2E5A22]">Tout regle</p>
            )}
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-[#4B5563]" /> : <ChevronDown className="h-4 w-4 text-[#4B5563]" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#E8E0D4]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E0D4] bg-[#FFFBF0]/50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[#4B5563] uppercase tracking-wider">Montant</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-[#4B5563] uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">Echeance</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">Paye le</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[#4B5563] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D4]">
                {proposal.fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-[#2D2D2D]">
                      {FEE_TYPE_LABELS[fee.fee_type]}
                      {fee.meeting_number && (
                        <span className="text-[#4B5563] ml-1">#{fee.meeting_number}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-[#2D2D2D]">
                      {formatEuro(Number(fee.amount))}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <FeeStatusBadge status={fee.status} />
                    </td>
                    <td className="px-4 py-2.5 text-[#4B5563]">
                      {fee.due_date ? formatDate(fee.due_date) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-[#4B5563]">
                      {fee.paid_date ? formatDate(fee.paid_date) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {actionLoading === fee.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          {fee.status !== 'paye' && (
                            <button
                              onClick={() => handleMarkPaid(fee.id)}
                              title="Marquer paye"
                              className="p-1 rounded hover:bg-[#87A878]/10 text-[#3D6B35] transition-colors"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {fee.status === 'en_attente' && (
                            <button
                              onClick={() => handleMarkOverdue(fee.id)}
                              title="Marquer en retard"
                              className="p-1 rounded hover:bg-[#C5A55A]/10 text-[#6B5020] transition-colors"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(fee.id)}
                            title="Supprimer"
                            className="p-1 rounded hover:bg-[#C45B5B]/10 text-[#C45B5B] transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ComptabilitePage() {
  const [summary, setSummary] = useState<FeesSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [proposals, setProposals] = useState<{ id: string; woman_name: string; man_name: string; status: string }[]>([])
  const [selectedProposal, setSelectedProposal] = useState('')
  const [addType, setAddType] = useState<'rencontre' | 'shadkhaniot'>('rencontre')
  const [meetingNumber, setMeetingNumber] = useState(1)
  const [addLoading, setAddLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const data = await getFeesSummary()
    setSummary(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleOpenAddForm() {
    setShowAddForm(true)
    const props = await getProposalsForFees()
    setProposals(props)
  }

  async function handleAdd() {
    if (!selectedProposal) return
    setAddLoading(true)

    if (addType === 'rencontre') {
      await addMeetingFees(selectedProposal, meetingNumber)
    } else {
      await addShadkhaniotFees(selectedProposal)
    }

    setAddLoading(false)
    setShowAddForm(false)
    setSelectedProposal('')
    setMeetingNumber(1)
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const stats = [
    {
      label: 'Total facture',
      value: formatEuro(summary?.total_due ?? 0),
      icon: <Receipt className="h-6 w-6" />,
      color: 'text-[#6B3A5B]',
      bgColor: 'bg-[#6B3A5B]/10',
    },
    {
      label: 'Encaisse',
      value: formatEuro(summary?.total_paid ?? 0),
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'text-[#2E5A22]',
      bgColor: 'bg-[#87A878]/10',
    },
    {
      label: 'En attente',
      value: formatEuro(summary?.total_pending ?? 0),
      icon: <Clock className="h-6 w-6" />,
      color: 'text-[#6B5020]',
      bgColor: 'bg-[#C5A55A]/10',
    },
    {
      label: 'Propositions suivies',
      value: String(summary?.proposals_count ?? 0),
      icon: <Heart className="h-6 w-6" />,
      color: 'text-[#6B3A5B]',
      bgColor: 'bg-[#6B3A5B]/10',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Comptabilite</h1>
          <p className="text-sm text-[#4B5563] mt-1">
            Suivi des shadkhaniot et frais de rencontres
          </p>
        </div>
        <Button
          variant="accent"
          onClick={handleOpenAddForm}
          icon={<Plus className="h-4 w-4" />}
        >
          Ajouter
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-[#4B5563]">{stat.label}</p>
                <p className="text-2xl font-bold text-[#2D2D2D]">{stat.value}</p>
              </div>
              <div className={cn('rounded-xl p-2.5 shrink-0', stat.bgColor, stat.color)}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add form modal */}
      {showAddForm && (
        <Card>
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-[#2D2D2D]">
              Ajouter des frais
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1">
                  Proposition
                </label>
                <select
                  value={selectedProposal}
                  onChange={(e) => setSelectedProposal(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E8E0D4] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#87A878]/50 focus:border-[#87A878]"
                >
                  <option value="">Selectionnez une proposition...</option>
                  {proposals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.woman_name} & {p.man_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1">
                  Type de frais
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAddType('rencontre')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
                      addType === 'rencontre'
                        ? 'bg-[#6B3A5B]/10 border-[#6B3A5B]/30 text-[#6B3A5B]'
                        : 'border-[#E8E0D4] text-[#4B5563] hover:bg-gray-50'
                    )}
                  >
                    <CalendarPlus className="h-4 w-4" />
                    Rencontre (2 x 10 EUR)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddType('shadkhaniot')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
                      addType === 'shadkhaniot'
                        ? 'bg-[#C5A55A]/10 border-[#C5A55A]/30 text-[#6B5020]'
                        : 'border-[#E8E0D4] text-[#4B5563] hover:bg-gray-50'
                    )}
                  >
                    <CircleDollarSign className="h-4 w-4" />
                    Shadkhaniot (2 x 600 EUR)
                  </button>
                </div>
              </div>
            </div>

            {addType === 'rencontre' && (
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1">
                  Numero de la rencontre
                </label>
                <input
                  type="number"
                  min={1}
                  value={meetingNumber}
                  onChange={(e) => setMeetingNumber(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm border border-[#E8E0D4] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#87A878]/50 focus:border-[#87A878]"
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="accent"
                onClick={handleAdd}
                loading={addLoading}
                disabled={!selectedProposal}
                icon={<Plus className="h-4 w-4" />}
              >
                {addType === 'rencontre'
                  ? `Ajouter rencontre #${meetingNumber} (20 EUR)`
                  : 'Ajouter shadkhaniot (1 200 EUR)'}
              </Button>
              <Button variant="ghost" onClick={() => setShowAddForm(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Proposals list */}
      {(summary?.proposals.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Receipt className="h-8 w-8" />}
          title="Aucun frais enregistre"
          description="Ajoutez des frais de rencontre ou de shadkhaniot pour commencer le suivi."
        />
      ) : (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-[#2D2D2D]">
            Detail par proposition
          </h2>
          {summary!.proposals.map((p) => (
            <ProposalFeesCard key={p.proposal_id} proposal={p} onRefresh={fetchData} />
          ))}
        </div>
      )}
    </div>
  )
}
