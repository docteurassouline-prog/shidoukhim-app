import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatDateTime, getStatusLabel, getAvailabilityLabel } from '@/lib/utils'
import { getTopMatches } from '@/lib/scoring/actions'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import TopMatchesSection from '@/components/scoring/TopMatchesSection'
import {
  Users,
  Heart,
  ClipboardCheck,
  PhoneCall,
  Sparkles,
  ChevronRight,
  Clock,
  Calendar,
  User,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

interface StatCard {
  label: string
  value: number
  icon: React.ReactNode
  href: string
  color: string
  bgColor: string
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('auth_user_id', user?.id ?? '')
    .eq('organization_id', ORG_ID)
    .single()

  // Fetch all stats in parallel
  const today = new Date().toISOString().split('T')[0]
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const [
    availableRes,
    inDatingRes,
    toValidateRes,
    tasksToDoRes,
    activeProposalsRes,
    upcomingTasksRes,
    recentActivityRes,
    topMatches,
  ] = await Promise.all([
    // 1. Disponibles
    supabase
      .from('candidates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ORG_ID)
      .eq('availability', 'disponible'),

    // 2. En rencontre
    supabase
      .from('candidates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ORG_ID)
      .eq('availability', 'en_rencontre'),

    // 3. A valider
    supabase
      .from('candidates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ORG_ID)
      .eq('status', 'validee')
      .in('availability', ['disponible']),

    // 4. Taches a recontacter (dues et non terminees)
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ORG_ID)
      .neq('status', 'terminee')
      .neq('status', 'annulee')
      .lte('due_date', today),

    // 5. Propositions actives
    supabase
      .from('proposals')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ORG_ID)
      .not('status', 'in', '("aboutie","refusee","interrompue")'),

    // 6. Taches a venir (7 jours)
    supabase
      .from('tasks')
      .select(`
        id,
        title,
        due_date,
        status,
        priority,
        assigned_to,
        related_candidate_id,
        related_candidate_type,
        assignee:user_profiles!tasks_assigned_to_fkey(full_name)
      `)
      .eq('organization_id', ORG_ID)
      .neq('status', 'terminee')
      .neq('status', 'annulee')
      .lte('due_date', in7Days)
      .order('due_date', { ascending: true })
      .limit(10),

    // 7. Activite recente
    supabase
      .from('audit_logs')
      .select(`
        id,
        action,
        entity_type,
        entity_id,
        details,
        created_at,
        user:user_profiles!audit_logs_user_id_fkey(full_name)
      `)
      .eq('organization_id', ORG_ID)
      .order('created_at', { ascending: false })
      .limit(10),

    // 8. Top matches (scoring)
    getTopMatches(6),
  ])

  const stats: StatCard[] = [
    {
      label: 'Disponibles pour une proposition',
      value: availableRes.count ?? 0,
      icon: <Users className="h-6 w-6" />,
      href: '/candidates?availability=disponible',
      color: 'text-[#3D6B35]',
      bgColor: 'bg-[#87A878]/10',
    },
    {
      label: 'En frequentation actuellement',
      value: inDatingRes.count ?? 0,
      icon: <Heart className="h-6 w-6" />,
      href: '/candidates?availability=en_rencontre',
      color: 'text-[#6B3A5B]',
      bgColor: 'bg-[#6B3A5B]/10',
    },
    {
      label: 'Fiches actives',
      value: toValidateRes.count ?? 0,
      icon: <ClipboardCheck className="h-6 w-6" />,
      href: '/candidates?status=validee',
      color: 'text-[#C5A55A]',
      bgColor: 'bg-[#C5A55A]/10',
    },
    {
      label: 'A recontacter',
      value: tasksToDoRes.count ?? 0,
      icon: <PhoneCall className="h-6 w-6" />,
      href: '/agenda?filter=overdue',
      color: 'text-[#C45B5B]',
      bgColor: 'bg-[#C45B5B]/10',
    },
    {
      label: 'Propositions actives',
      value: activeProposalsRes.count ?? 0,
      icon: <Sparkles className="h-6 w-6" />,
      href: '/proposals',
      color: 'text-[#6B3A5B]',
      bgColor: 'bg-[#6B3A5B]/10',
    },
  ]

  const upcomingTasks = (upcomingTasksRes.data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const assigneeRaw = r.assignee
    return {
      id: r.id as string,
      title: r.title as string,
      due_date: r.due_date as string | null,
      status: r.status as string,
      priority: r.priority as string,
      assigned_to: r.assigned_to as string | null,
      related_candidate_id: r.related_candidate_id as string | null,
      related_candidate_type: r.related_candidate_type as string | null,
      assignee: (Array.isArray(assigneeRaw) ? assigneeRaw[0] ?? null : assigneeRaw ?? null) as { full_name: string } | null,
    }
  })

  const recentActivity = (recentActivityRes.data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const userRaw = r.user
    return {
      id: r.id as string,
      action: r.action as string,
      entity_type: r.entity_type as string,
      entity_id: r.entity_id as string | null,
      details: r.details as Record<string, unknown> | null,
      created_at: r.created_at as string,
      user: (Array.isArray(userRaw) ? userRaw[0] ?? null : userRaw ?? null) as { full_name: string } | null,
    }
  })

  const todayFormatted = format(new Date(), "EEEE d MMMM yyyy", { locale: fr })

  function getActionLabel(action: string, entityType: string): string {
    const actionLabels: Record<string, string> = {
      creation: 'a cree',
      modification: 'a modifie',
      suppression: 'a supprime',
      assignation: 'a assigne',
      desassignation: 'a retire',
      consultation: 'a consulte',
      export: 'a exporte',
      connexion: 's\'est connecte(e)',
      deconnexion: 's\'est deconnecte(e)',
    }
    const entityLabels: Record<string, string> = {
      candidate: 'une fiche candidate',
      candidate_man: 'une fiche candidat',
      proposal: 'une proposition',
      task: 'une tache',
      contact: 'un contact',
      meeting: 'une rencontre',
    }
    const a = actionLabels[action] || action
    const e = entityLabels[entityType] || entityType
    return `${a} ${e}`
  }

  function getPriorityDot(priority: string): string {
    switch (priority) {
      case 'urgente':
        return 'bg-[#C45B5B]'
      case 'haute':
        return 'bg-[#C5A55A]'
      case 'normale':
        return 'bg-[#87A878]'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div className="space-y-8">
      {/* En-tete de bienvenue */}
      <div>
        <h1 className="text-2xl font-bold text-[#2D2D2D]">
          Bonjour, {profile?.full_name ?? 'Utilisateur'}
        </h1>
        <p className="text-sm text-[#4B5563] mt-1 capitalize">{todayFormatted}</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group">
            <Card className="hover:shadow-md transition-shadow h-full">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-[#4B5563] leading-tight">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-[#2D2D2D]">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`${stat.bgColor} ${stat.color} rounded-xl p-2.5 shrink-0`}
                >
                  {stat.icon}
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs text-[#4B5563] group-hover:text-[#3D6B35] transition-colors">
                <span>Voir le detail</span>
                <ChevronRight className="h-3 w-3 ml-1" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Suggestions de compatibilite */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#2D2D2D] flex items-center gap-2">
            <Heart className="h-5 w-5 text-[#6B3A5B]" />
            Meilleures compatibilites
          </h2>
          <Link
            href="/proposals/new"
            className="text-sm text-[#3D6B35] hover:underline"
          >
            Nouvelle proposition
          </Link>
        </div>
        <TopMatchesSection matches={topMatches} />
      </div>

      {/* 2 colonnes : Taches + Activite */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions a faire */}
        <Card
          header={
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#2D2D2D] flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#C5A55A]" />
                Actions a faire
              </h2>
              <Link
                href="/agenda"
                className="text-sm text-[#3D6B35] hover:underline"
              >
                Tout voir
              </Link>
            </div>
          }
          padding="none"
        >
          {upcomingTasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#4B5563]">
              Aucune action prevue pour les 7 prochains jours
            </div>
          ) : (
            <ul className="divide-y divide-[#E8E0D4]">
              {upcomingTasks.map((task) => (
                <li
                  key={task.id}
                  className="px-4 py-3 sm:px-6 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${getPriorityDot(task.priority)}`}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2D2D2D] truncate">
                        {task.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[#4B5563]">
                        {task.assignee && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assignee.full_name}
                          </span>
                        )}
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Activite recente */}
        <Card
          header={
            <h2 className="text-base font-semibold text-[#2D2D2D] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#6B3A5B]" />
              Activite recente
            </h2>
          }
          padding="none"
        >
          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#4B5563]">
              Aucune activite recente
            </div>
          ) : (
            <ul className="divide-y divide-[#E8E0D4]">
              {recentActivity.map((log) => (
                <li
                  key={log.id}
                  className="px-4 py-3 sm:px-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-[#2D2D2D]">
                        <span className="font-medium">
                          {log.user?.full_name ?? 'Systeme'}
                        </span>{' '}
                        {getActionLabel(log.action, log.entity_type)}
                      </p>
                      {log.details &&
                        typeof log.details === 'object' &&
                        'name' in log.details && (
                          <p className="text-xs text-[#4B5563] mt-0.5 truncate">
                            {String(log.details.name)}
                          </p>
                        )}
                    </div>
                    <span className="text-xs text-[#4B5563] whitespace-nowrap shrink-0">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
