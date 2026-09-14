import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Link the auth user to their candidate portal token
        await supabase
          .from('candidate_portal_tokens')
          .update({ auth_user_id: user.id, last_login_at: new Date().toISOString() })
          .eq('email', user.email)
          .is('auth_user_id', null)
      }
      return NextResponse.redirect(new URL('/espace-candidate', origin))
    }
  }

  const loginUrl = new URL('/candidate-login', origin)
  loginUrl.searchParams.set('error', 'auth_callback_failed')
  return NextResponse.redirect(loginUrl)
}
