import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { isBlockedForOverdue } from '@/lib/payment-block'

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
    if (isBlockedForOverdue(decoded.email)) return null
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

export interface CustomerAuthUser extends AuthUser {
  customerId?: string
  scope?: string
  username?: string
}

export function getCustomerAuthUser(request: NextRequest): CustomerAuthUser | null {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null
    const secret = process.env.JWT_SECRET
    if (!secret) return null
    const decoded = jwt.verify(token, secret) as CustomerAuthUser
    if (isBlockedForOverdue(decoded.email)) return null
    if (decoded.role !== 'CUSTOMER' && decoded.scope !== 'customer') return null
    return decoded
  } catch {
    return null
  }
}

export function getAdminAuthUser(request: NextRequest): AuthUser | null {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null
    const secret = process.env.JWT_SECRET
    if (!secret) return null
    const decoded = jwt.verify(token, secret) as AuthUser
    if (isBlockedForOverdue(decoded.email)) return null
    if (decoded.role !== 'ADMIN') return null
    return decoded
  } catch {
    return null
  }
}