'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { Heart } from 'lucide-react'

export default function CandidateLoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValidEmail = (e: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmed = email.trim()
    if (!trimmed) {
      setError('Veuillez entrer votre adresse email.')
      return
    }
    if (!isValidEmail(trimmed)) {
      setError('Veuillez entrer une adresse email valide.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo:
            window.location.origin + '/auth/candidate-callback',
        },
      })

      if (authError) {
        if (
          authError.message.toLowerCase().includes('not found') ||
          authError.message.toLowerCase().includes('not allowed')
        ) {
          setError(
            "Cette adresse email n'est pas enregistrée dans notre système. Veuillez contacter Hava Dahan."
          )
        } else {
          setError(
            'Une erreur est survenue. Veuillez réessayer dans quelques instants.'
          )
        }
        return
      }

      setSent(true)
    } catch {
      setError(
        'Une erreur est survenue. Veuillez réessayer dans quelques instants.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#E8E0D4] p-8 sm:p-10">
          {/* Logo / Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#6B3A5B]/10 mb-4">
              <Heart className="w-8 h-8 text-[#6B3A5B]" fill="#6B3A5B" />
            </div>
            <h1 className="text-2xl font-bold text-[#2D2D2D] tracking-tight">
              Hava Dahan{' '}
              <span className="text-[#C5A55A]">&middot;</span>{' '}
              Shidoukhim
            </h1>
            <p className="mt-2 text-[#6B7280] text-sm">
              Espace personnel
            </p>
          </div>

          {sent ? (
            /* Success state */
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#87A878]/15 mb-4">
                <svg
                  className="w-7 h-7 text-[#87A878]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[#2D2D2D] mb-2">
                Lien envoyé !
              </h2>
              <p className="text-[#6B7280] text-sm leading-relaxed">
                Un lien de connexion a été envoyé à votre adresse email.
                Vérifiez votre boîte de réception.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSent(false)
                  setEmail('')
                  setError(null)
                }}
                className="mt-6 text-sm text-[#6B3A5B] hover:text-[#5A2E4D] underline underline-offset-2 transition-colors"
              >
                Renvoyer un lien
              </button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[#2D2D2D] mb-1.5"
                >
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError(null)
                  }}
                  className={[
                    'w-full px-4 py-2.5 rounded-lg border text-sm',
                    'bg-white text-[#2D2D2D] placeholder-[#9CA3AF]',
                    'transition-colors duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-offset-1',
                    error
                      ? 'border-[#C45B5B] focus:ring-[#C45B5B]'
                      : 'border-[#E8E0D4] focus:ring-[#87A878] focus:border-[#87A878]',
                  ].join(' ')}
                />
                {error && (
                  <p className="mt-1.5 text-xs text-[#C45B5B]">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
              >
                Recevoir le lien de connexion
              </Button>
            </form>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-[#9CA3AF] mt-6">
          En vous connectant, vous accédez à votre espace
          confidentiel et sécurisé.
        </p>
      </div>
    </div>
  )
}
