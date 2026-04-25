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

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$.{53}$/

async function verifyAndUpgradePassword(customerId: string, storedPassword: string, suppliedPassword: string) {
  if (BCRYPT_HASH_REGEX.test(storedPassword)) {
    return bcrypt.compare(suppliedPassword, storedPassword)
  }

  if (storedPassword !== suppliedPassword) {
    return false
  }

  const upgradedHash = await bcrypt.hash(suppliedPassword, 10)
  await prisma.customer.update({
    where: { id: customerId },
    data: { password: upgradedHash },
  })

  return true
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(`customer-login:${getRateLimitKey(request)}`, 10, 15 * 60 * 1000)
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Valid email and password are required' }, { status: 400 })
    }

    const { email, password } = parsed.data
    const normalizedEmail = email.toLowerCase()

    const customer = await prisma.customer.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        name: true,
        isActive: true,
      },
    })

    if (!customer || !customer.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isPasswordValid = await verifyAndUpgradePassword(customer.id, customer.password, password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const secret = process.env.JWT_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'Authentication is not configured' }, { status: 500 })
    }

    const token = jwt.sign(
      {
        userId: customer.id,
        customerId: customer.id,
        email: customer.email,
        role: 'CUSTOMER',
        scope: 'customer',
        username: customer.username,
      },
      secret,
      { expiresIn: '24h' }
    )

    const response = NextResponse.json({
      message: 'Login successful',
      customer: {
        id: customer.id,
        email: customer.email,
        username: customer.username,
        name: customer.name,
      },
    })

    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge: 86400,
      path: '/',
    }

    response.cookies.set('auth-token', token, cookieOptions)
    response.cookies.set('auth-scope', 'customer', {
      ...cookieOptions,
      httpOnly: false,
    })
    response.cookies.set('auth-name', customer.username, {
      ...cookieOptions,
      httpOnly: false,
    })

    return response
  } catch (error) {
    console.error('Customer login error:', error)
    const details = process.env.NODE_ENV !== 'production' && error instanceof Error ? error.message : undefined
    return NextResponse.json(details ? { error: 'Login failed', details } : { error: 'Login failed' }, { status: 500 })
  }
}
