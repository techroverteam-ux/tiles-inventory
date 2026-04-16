import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit'

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
})

async function normalizeLegacyUserRoles() {
  try {
    await prisma.$runCommandRaw({
      update: 'users',
      updates: [
        { q: { role: 'admin' }, u: { $set: { role: 'ADMIN' } }, multi: true },
        { q: { role: 'user' }, u: { $set: { role: 'USER' } }, multi: true }
      ]
    })
    
  } catch (error) {
    console.error('Role normalization error:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(`login:${getRateLimitKey(request)}`, 10, 15 * 60 * 1000)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Valid email and password are required' },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    let user
    try {
      user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          name: true,
          role: true,
          isActive: true,
        },
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found in enum 'UserRole'")) {
        await normalizeLegacyUserRoles()
        user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            password: true,
            name: true,
            role: true,
            isActive: true,
          },
        })
      } else {
        throw error
      }
    }

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const secret = process.env.JWT_SECRET
    if (!secret) {
      console.error('JWT_SECRET is not configured')
      return NextResponse.json(
        { error: 'Authentication is not configured' },
        { status: 500 }
      )
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '24h' }
    )

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })

    const isProduction = process.env.NODE_ENV === 'production'

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge: 86400,
      path: '/'
    }
    
    response.cookies.set('auth-token', token, cookieOptions)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}