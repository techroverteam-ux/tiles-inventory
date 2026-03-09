import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  // Public routes that don't require authentication
  if (request.nextUrl.pathname.startsWith('/login') || 
      request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Redirect root to dashboard
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Check if user is authenticated
  if (!token) {
    console.log('No token found, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const secret = process.env.JWT_SECRET || 'tiles-inventory-secret-2024'
    jwt.verify(token, secret)
    console.log('Token verified successfully')
    return NextResponse.next()
  } catch (error) {
    console.log('Token verification failed:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!api|login|_next/static|_next/image|favicon.ico|logo.jpeg).*)',
  ],
}