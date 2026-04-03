import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login', 
    '/api/auth/login', 
    '/api/auth/logout', 
    '/api/auth/verify',
    '/website',
    '/api/products',
    '/api/brands', 
    '/api/categories',
    '/api/sizes',
    '/api/enquiries',
    '/api/dashboard/stats'
  ]

  // Always allow website routes
  if (pathname.startsWith('/website')) {
    return NextResponse.next()
  }

  // Root redirect
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Skip auth check for public routes and static assets
  if (publicRoutes.includes(pathname) || 
      pathname.startsWith('/_next/') || 
      pathname.startsWith('/api/upload') ||
      pathname.includes('.')) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - website (public website)
     * - login (login page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|website|login|.*\\.).*)',
  ],
}