'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

type Mode = 'login' | 'signup' | 'forgot'

export default function LoginPage() {
  const supabase = createClient()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'Identifiants incorrects. Veuillez verifier votre email et mot de passe.'
          : signInError.message
      )
      setLoading(false)
      return
    }

    // Successful login — the middleware will handle the redirect
    window.location.href = '/dashboard'
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres.')
      setLoading(false)
      return
    }

    if (!fullName.trim()) {
      setError('Veuillez saisir votre nom complet.')
      setLoading(false)
      return
    }

    // 1. Sign up the user
    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // 2. If signup was successful and user is confirmed right away,
    //    create the profile row
    if (signUpData.user && signUpData.session) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          auth_user_id: signUpData.user.id,
          organization_id: '00000000-0000-0000-0000-000000000001',
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          role: 'admin',
          is_active: true,
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Don't block the user — the profile can be created later
      }

      window.location.href = '/dashboard'
      return
    }

    // If email confirmation is required
    setSuccess(
      'Compte cree ! Verifiez votre email pour confirmer votre inscription.'
    )
    setLoading(false)
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (!email.trim()) {
      setError('Veuillez saisir votre adresse email.')
      setLoading(false)
      return
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/auth/callback?redirectTo=/reset-password` }
    )

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSuccess(
      'Un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception.'
    )
    setLoading(false)
  }

  const inputClass =
    'w-full h-11 rounded-[10px] border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-ink-muted/80 transition-colors hover:border-line-strong focus:border-plum focus:outline-none'
  const labelClass = 'block text-[13px] font-medium text-ink-soft mb-1.5'

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-canvas">
      {/* Panneau de marque */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-plum-deep px-14 py-12 text-white">
        <div
          className="pointer-events-none absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(closest-side, #B8974E 0%, transparent 70%)' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-52 -left-32 h-[560px] w-[560px] rounded-full opacity-25"
          style={{ background: 'radial-gradient(closest-side, #7A9A6C 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/50">Shidoukhim</p>
          <p className="mt-2 font-display text-[40px] font-semibold leading-none">Hava Dahan</p>
        </div>

        <div className="relative max-w-md">
          <p className="font-display text-[34px] italic leading-[1.15] text-white/90">
            « Celui qui trouve une épouse a trouvé le bonheur. »
          </p>
          <p className="mt-4 text-[12.5px] uppercase tracking-[0.2em] text-gold">Michlé 18, 22</p>
        </div>

        <div className="relative flex items-center gap-6 text-[12px] text-white/45">
          <span>Fiches</span>
          <span className="h-1 w-1 rounded-full bg-white/25" />
          <span>Propositions</span>
          <span className="h-1 w-1 rounded-full bg-white/25" />
          <span>Rencontres</span>
          <span className="h-1 w-1 rounded-full bg-white/25" />
          <span>Suivi</span>
        </div>
      </aside>

      {/* Formulaire */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <p className="text-[11px] uppercase tracking-[0.28em] text-ink-muted">Shidoukhim</p>
            <p className="font-display text-[34px] font-semibold leading-none text-plum">Hava Dahan</p>
          </div>

          <h1 className="text-[32px] text-ink">
            {mode === 'login' && 'Bienvenue'}
            {mode === 'signup' && 'Créer un compte'}
            {mode === 'forgot' && 'Mot de passe oublié'}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            {mode === 'login' && 'Connectez-vous pour accéder à vos dossiers.'}
            {mode === 'signup' && 'Votre compte sera rattaché au cabinet Hava Dahan.'}
            {mode === 'forgot' && 'Nous vous enverrons un lien de réinitialisation.'}
          </p>

          {error && (
            <div
              className="mt-6 rounded-[10px] border border-danger/25 bg-danger-light px-4 py-3 text-sm text-danger-deep"
              role="alert"
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="mt-6 rounded-[10px] border border-sage/30 bg-sage-light px-4 py-3 text-sm text-sage-deep"
              role="status"
            >
              {success}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className={labelClass}>Adresse email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className={inputClass}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="text-[13px] font-medium text-ink-soft">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[12.5px] font-medium text-plum hover:text-plum-hover"
                  >
                    Oublié ?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    className={cn(inputClass, 'pr-11')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-muted hover:text-ink"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-plum text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_1px_2px_rgba(31,27,30,0.18)] transition-colors hover:bg-plum-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Se connecter
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className={labelClass}>Adresse email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-plum text-sm font-medium text-white transition-colors hover:bg-plum-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Envoyer le lien
              </button>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="block w-full text-center text-[13px] font-medium text-ink-soft hover:text-ink"
              >
                Retour à la connexion
              </button>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="mt-8 space-y-5">
              <div>
                <label htmlFor="fullName" className={labelClass}>Nom complet</label>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Prénom Nom"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>Adresse email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="password" className={labelClass}>Mot de passe</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6 caractères minimum"
                    className={cn(inputClass, 'pr-11')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-muted hover:text-ink"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-plum text-sm font-medium text-white transition-colors hover:bg-plum-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Créer mon compte
              </button>
            </form>
          )}

          {mode !== 'forgot' && (
            <p className="mt-8 text-center text-[13px] text-ink-soft">
              {mode === 'login' ? (
                <>
                  Pas encore de compte ?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="font-medium text-plum hover:text-plum-hover"
                  >
                    Créer un compte
                  </button>
                </>
              ) : (
                <>
                  Déjà un compte ?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-medium text-plum hover:text-plum-hover"
                  >
                    Se connecter
                  </button>
                </>
              )}
            </p>
          )}

          <p className="mt-10 text-center text-[11px] uppercase tracking-[0.18em] text-ink-muted">
            Espace réservé au cabinet
          </p>
        </div>
      </main>
    </div>
  )
}
