import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(request: NextRequest) {
  // Temporarily disable auth check for debugging
  console.log('Middleware called for:', request.nextUrl.pathname)
  
  // Only redirect root to dashboard
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Allow all other routes for now
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|login|_next/static|_next/image|favicon.ico|logo.jpeg).*)',
  ],
}