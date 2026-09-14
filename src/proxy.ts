import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that require authentication
const protectedPaths = [
  '/dashboard',
  '/candidates',
  '/men',
  '/proposals',
  '/contacts',
  '/chadkhaniot',
  '/agenda',
  '/settings',
]

// Routes that are always public
const publicPaths = ['/login', '/auth/callback']

function isProtectedRoute(pathname: string): boolean {
  return protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  )
}

function isPublicRoute(pathname: string): boolean {
  return (
    publicPaths.some(
      (path) => pathname === path || pathname.startsWith(path + '/')
    ) || pathname.startsWith('/invite/')
  )
}

export async function proxy(request: NextRequest) {
  const { user, supabaseResponse } = await updateSession(request)
  const { pathname } = request.nextUrl

  // Redirect authenticated users away from /login to /dashboard
  if (pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // If the route is protected and the user is not authenticated, redirect to login
  if (isProtectedRoute(pathname) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
