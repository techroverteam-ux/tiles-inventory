import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('🔍 Middleware: Processing request for:', pathname)
  debugger // Debug point 11: Middleware entry
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth/login', '/api/auth/logout', '/api/auth/verify']
  
  // Root redirect
  if (pathname === '/') {
    console.log('🚀 Middleware: Redirecting root to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Skip auth check for public routes and static assets
  if (publicRoutes.includes(pathname) || 
      pathname.startsWith('/_next/') || 
      pathname.startsWith('/api/upload') ||
      pathname.includes('.')) {
    console.log('✅ Middleware: Allowing public route:', pathname)
    return NextResponse.next()
  }
  
  // Check authentication for protected routes
  const token = request.cookies.get('auth-token')?.value
  console.log('🍪 Middleware: Auth token present:', !!token)
  debugger // Debug point 12: Token check
  
  if (!token) {
    console.log('❌ Middleware: No token, redirecting to login')
    debugger // Debug point 13: No token redirect
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Middleware runs on Edge runtime. Keep it lightweight and cookie-presence based.
  // Token validity is enforced by server API routes (e.g., /api/auth/verify).
  console.log('✅ Middleware: Auth cookie present, allowing access to:', pathname)
  debugger // Debug point 14: Access granted by cookie presence
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|login|_next/static|_next/image|favicon.ico|logo.jpeg).*)',
  ],
}