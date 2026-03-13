import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('🔍 Middleware: Processing request for:', pathname)
  
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
  
  // If user has valid token and tries to access login, redirect to dashboard
  if (token && pathname === '/login') {
    const user = verifyToken(token)
    if (user) {
      console.log('🚀 Middleware: Authenticated user accessing login, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  if (!token) {
    console.log('❌ Middleware: No token, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Verify token
  const user = verifyToken(token)
  if (!user) {
    console.log('❌ Middleware: Invalid token, redirecting to login')
    // Clear invalid token
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth-token')
    return response
  }
  
  console.log('✅ Middleware: Valid token, allowing access to:', pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|login|_next/static|_next/image|favicon.ico|logo.jpeg).*)',
  ],
}