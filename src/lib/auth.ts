import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export interface AuthUser {
  userId: string
  email: string
  role: string
}

export function verifyToken(token: string): AuthUser | null {
  try {
    console.log('🔐 Auth: Verifying token with length:', token.length)
    console.log('🔑 Auth: JWT Secret available:', !!process.env.JWT_SECRET)
    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'tiles-inventory-secret-2024'
    ) as AuthUser
    
    console.log('✅ Auth: Token verified successfully for user:', decoded.userId)
    return decoded
  } catch (error) {
    console.error('❌ Auth: Token verification failed:', error)
    return null
  }
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  try {
    console.log('🔍 Auth: Extracting auth user from request')
    const token = request.cookies.get('auth-token')?.value
    
    console.log('🍪 Auth: Token from cookie:', !!token)
    
    if (!token) {
      console.log('❌ Auth: No auth token found in cookies')
      return null
    }
    
    return verifyToken(token)
  } catch (error) {
    console.error('💥 Auth: Auth user extraction failed:', error)
    return null
  }
}

export function requireAuth(request: NextRequest): AuthUser {
  const user = getAuthUser(request)
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}