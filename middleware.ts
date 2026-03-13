import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

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
  
  // Verify token
  const user = verifyToken(token)
  console.log('👤 Middleware: Token verification result:', !!user)
  debugger // Debug point 14: Token verification
  
  if (!user) {
    console.log('❌ Middleware: Invalid token, redirecting to login')
    // Clear invalid token
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth-token')
    return response
  }
  
  console.log('✅ Middleware: Valid token, allowing access to:', pathname)
  debugger // Debug point 15: Access granted
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|login|_next/static|_next/image|favicon.ico|logo.jpeg).*)',
  ],
}