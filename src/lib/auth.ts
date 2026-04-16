import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export interface AuthUser {
  userId: string
  email: string
  role: string
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      console.error('JWT_SECRET is not configured')
      return null
    }

    const decoded = jwt.verify(token, secret) as AuthUser
    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return null
    }

    return verifyToken(token)
  } catch (error) {
    console.error('Auth user extraction failed:', error)
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