'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, Loader2, Heart, Sparkles } from 'lucide-react'

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

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#FFFBF0' }}
    >
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: '#C5A55A' }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ backgroundColor: '#87A878' }}
        />
        <div
          className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full opacity-5"
          style={{ backgroundColor: '#6B3A5B' }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header / Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Heart
              className="w-6 h-6"
              style={{ color: '#6B3A5B' }}
              fill="#6B3A5B"
            />
            <Sparkles className="w-5 h-5" style={{ color: '#C5A55A' }} />
          </div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: '#2D2D2D' }}
          >
            Hava Dahan
          </h1>
          <p
            className="text-lg font-medium mt-1"
            style={{ color: '#6B3A5B', fontStyle: 'italic' }}
          >
            Shidoukhim
          </p>
          <div
            className="mt-3 w-16 h-0.5 mx-auto rounded-full"
            style={{ backgroundColor: '#C5A55A' }}
          />
          <p className="mt-4 text-sm" style={{ color: '#6B7280' }}>
            Gestion des mises en relation
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-2xl shadow-lg p-8"
          style={{ borderTop: '3px solid #C5A55A' }}
        >
          {/* Tab switcher (visual only — controlled by mode state) */}
          <div className="flex items-center gap-1 mb-6 p-1 rounded-xl bg-gray-50">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError(null)
                setSuccess(null)
              }}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                mode === 'login'
                  ? 'bg-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
              style={
                mode === 'login' ? { color: '#2D2D2D' } : undefined
              }
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError(null)
                setSuccess(null)
              }}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                mode === 'signup'
                  ? 'bg-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
              style={
                mode === 'signup' ? { color: '#2D2D2D' } : undefined
              }
            >
              Inscription
            </button>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{
                backgroundColor: '#FEF2F2',
                color: '#C45B5B',
                border: '1px solid #FECACA',
              }}
            >
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{
                backgroundColor: '#F0FDF4',
                color: '#166534',
                border: '1px solid #BBF7D0',
              }}
            >
              {success}
            </div>
          )}

          {/* Login form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: '#2D2D2D' }}
                >
                  Adresse email
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2"
                  style={{
                    border: '1px solid #E8E0D4',
                    color: '#2D2D2D',
                    backgroundColor: '#FAFAF8',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#87A878'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(135,168,120,0.15)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E8E0D4'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: '#2D2D2D' }}
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{
                      border: '1px solid #E8E0D4',
                      color: '#2D2D2D',
                      backgroundColor: '#FAFAF8',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#87A878'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(135,168,120,0.15)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E8E0D4'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: '#87A878' }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#6B8C5E'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#87A878'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('forgot')
                  setError(null)
                  setSuccess(null)
                }}
                className="w-full text-center text-sm mt-3 transition-colors hover:underline"
                style={{ color: '#6B3A5B' }}
              >
                Mot de passe oublié ?
              </button>
            </form>
          )}

          {/* Forgot password form */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm mb-2" style={{ color: '#6B7280' }}>
                Saisissez votre adresse email pour recevoir un lien de réinitialisation.
              </p>
              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: '#2D2D2D' }}
                >
                  Adresse email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2"
                  style={{
                    border: '1px solid #E8E0D4',
                    color: '#2D2D2D',
                    backgroundColor: '#FAFAF8',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#87A878'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(135,168,120,0.15)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E8E0D4'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: '#C5A55A' }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#B0903E'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#C5A55A'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer le lien'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError(null)
                  setSuccess(null)
                }}
                className="w-full text-center text-sm mt-1 transition-colors hover:underline"
                style={{ color: '#6B7280' }}
              >
                Retour à la connexion
              </button>
            </form>
          )}

          {/* Signup form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: '#2D2D2D' }}
                >
                  Nom complet
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Prenom Nom"
                  autoComplete="name"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    border: '1px solid #E8E0D4',
                    color: '#2D2D2D',
                    backgroundColor: '#FAFAF8',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#87A878'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(135,168,120,0.15)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E8E0D4'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: '#2D2D2D' }}
                >
                  Adresse email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    border: '1px solid #E8E0D4',
                    color: '#2D2D2D',
                    backgroundColor: '#FAFAF8',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#87A878'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(135,168,120,0.15)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E8E0D4'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: '#2D2D2D' }}
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6 caracteres minimum"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{
                      border: '1px solid #E8E0D4',
                      color: '#2D2D2D',
                      backgroundColor: '#FAFAF8',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#87A878'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(135,168,120,0.15)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E8E0D4'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: '#6B3A5B' }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#5A2D4A'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#6B3A5B'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creation du compte...
                  </>
                ) : (
                  'Creer mon compte'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: '#6B7280' }}
        >
          Plateforme securisee de gestion des shidoukhim
        </p>
      </div>
    </div>
  )
}
