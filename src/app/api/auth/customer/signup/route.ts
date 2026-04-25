import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(6).max(128),
  phone: z.string().trim().max(30).optional(),
})

function toUsername(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'user'
}

async function createUniqueUsername(base: string) {
  const maxAttempts = 50
  let count = 0

  while (count < maxAttempts) {
    const candidate = count === 0 ? base : `${base}${count + 1}`
    const existing = await prisma.customer.findUnique({ where: { username: candidate } })
    if (!existing) {
      return candidate
    }
    count += 1
  }

  throw new Error('Unable to generate unique username')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid signup details' }, { status: 400 })
    }

    const { name, email, password, phone } = parsed.data

    const existing = await prisma.customer.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const baseUsername = toUsername(name || email.split('@')[0])
    const username = await createUniqueUsername(baseUsername)

    let customer
    try {
      customer = await prisma.customer.create({
        data: {
          email,
          username,
          password: passwordHash,
          name,
          phone,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
        },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ error: 'Email or username is already registered' }, { status: 409 })
      }
      throw error
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

    const response = NextResponse.json({ message: 'Signup successful', customer })

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
    console.error('Customer signup error:', error)
    if (error instanceof Error && error.message === 'Unable to generate unique username') {
      return NextResponse.json({ error: 'Could not generate a unique username. Please try again.' }, { status: 500 })
    }
    const details = process.env.NODE_ENV !== 'production' && error instanceof Error ? error.message : undefined
    return NextResponse.json(details ? { error: 'Signup failed', details } : { error: 'Signup failed' }, { status: 500 })
  }
}
