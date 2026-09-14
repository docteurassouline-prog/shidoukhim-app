'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, Heart, Sparkles } from 'lucide-react'

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

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#FFFBF0' }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: '#C5A55A' }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ backgroundColor: '#87A878' }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
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
            Nouveau mot de passe
          </h1>
          <div
            className="mt-3 w-16 h-0.5 mx-auto rounded-full"
            style={{ backgroundColor: '#C5A55A' }}
          />
        </div>

        <div
          className="bg-white rounded-2xl shadow-lg p-8"
          style={{ borderTop: '3px solid #C5A55A' }}
        >
          {success ? (
            <div
              className="p-4 rounded-lg text-sm text-center"
              style={{
                backgroundColor: '#F0FDF4',
                color: '#166534',
                border: '1px solid #BBF7D0',
              }}
            >
              Mot de passe modifié avec succès ! Redirection...
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {error && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: '#FEF2F2',
                    color: '#C45B5B',
                    border: '1px solid #FECACA',
                  }}
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: '#2D2D2D' }}
                >
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6 caractères minimum"
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

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: '#2D2D2D' }}
                >
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retapez le mot de passe"
                  autoComplete="new-password"
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
                    Modification en cours...
                  </>
                ) : (
                  'Modifier le mot de passe'
                )}
              </button>
            </form>
          )}
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{ color: '#6B7280' }}
        >
          Plateforme sécurisée de gestion des shidoukhim
        </p>
      </div>
    </div>
  )
}
