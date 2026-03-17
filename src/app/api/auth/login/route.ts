import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

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
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

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

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'tiles-inventory-secret-2024',
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
    
    console.log('✅ Login successful')

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}