import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CandidateLogoutButton } from './CandidateLogoutButton'
import { CandidateNavLink } from './CandidateNavLink'

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/candidate-login')
  }

  const { data: row } = await supabase
    .from('candidate_portal_tokens')
    .select('candidate_id, candidate_type')
    .eq('auth_user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!row) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <div className="max-w-md rounded-xl border border-warm-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-light">
            <svg
              className="h-7 w-7 text-danger"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-semibold text-text-primary">
            Acces non autorise
          </h2>
          <p className="text-sm text-text-secondary">
            Votre lien d&apos;acces n&apos;est plus valide ou votre compte
            n&apos;est pas associe a un profil candidat. Veuillez contacter
            Hava Dahan pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    )
  }

  // Fetch name from the right table based on candidate_type
  const table = row.candidate_type === 'man' ? 'candidates_men' : 'candidates'
  const { data: candidateRow } = await supabase
    .from(table)
    .select('first_name, last_name')
    .eq('id', row.candidate_id)
    .single()

  const candidateName = candidateRow
    ? `${candidateRow.first_name} ${candidateRow.last_name}`
    : 'Candidat(e)'

  const navLinks = [
    { href: '/espace-candidate', label: 'Mon parcours' },
    { href: '/espace-candidate/rencontres', label: 'Mes rencontres' },
    { href: '/espace-candidate/profil', label: 'Mon profil' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      {/* Top nav bar */}
      <header className="bg-plum text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="text-base font-semibold tracking-wide sm:text-lg">
            Hava Dahan &middot; Shidoukhim
          </span>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden text-sm text-white/80 sm:inline">
              {candidateName} &mdash; Mon espace
            </span>
            <CandidateLogoutButton />
          </div>
        </div>

        {/* Sub-nav links */}
        <nav className="border-t border-white/15">
          <div className="mx-auto flex max-w-6xl gap-1 px-4 sm:px-6">
            {navLinks.map((link) => (
              <CandidateNavLink key={link.href} href={link.href}>
                {link.label}
              </CandidateNavLink>
            ))}
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-warm-border py-4 text-center text-xs text-text-muted">
        Hava Dahan &middot; Shidoukhim &mdash; Espace candidat
      </footer>
    </div>
  )
}

