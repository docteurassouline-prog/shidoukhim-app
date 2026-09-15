'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 2000)
  }

  const inputClass =
    'w-full h-11 rounded-[10px] border border-line bg-surface px-3.5 pr-11 text-sm text-ink placeholder:text-ink-muted/80 transition-colors hover:border-line-strong focus:border-plum focus:outline-none'

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-6 py-12">
      <div className="w-full max-w-[400px]">
        <p className="text-[11px] uppercase tracking-[0.28em] text-ink-muted">Shidoukhim</p>
        <p className="font-display text-[34px] font-semibold leading-none text-plum">Hava Dahan</p>

        <div className="mt-8 rounded-[14px] border border-line bg-surface p-7 shadow-card">
          {success ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sage-light text-sage-deep">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="text-[26px] text-ink">Mot de passe mis à jour</h1>
              <p className="mt-2 text-sm text-ink-soft">Redirection vers votre tableau de bord…</p>
            </div>
          ) : (
            <>
              <h1 className="text-[28px] text-ink">Nouveau mot de passe</h1>
              <p className="mt-2 text-sm text-ink-soft">Choisissez un mot de passe d&apos;au moins 6 caractères.</p>

              {error && (
                <div className="mt-5 rounded-[10px] border border-danger/25 bg-danger-light px-4 py-3 text-sm text-danger-deep" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="password" className="block text-[13px] font-medium text-ink-soft mb-1.5">
                    Mot de passe
                  </label>
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
                      className={inputClass}
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
                <div>
                  <label htmlFor="confirmPassword" className="block text-[13px] font-medium text-ink-soft mb-1.5">
                    Confirmation
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Retapez le mot de passe"
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-plum text-sm font-medium text-white transition-colors hover:bg-plum-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enregistrer
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
