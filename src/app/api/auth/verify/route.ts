import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
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

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verify: Starting session verification')
    console.log('🍪 Verify: Cookies received:', request.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })))
    
    const authToken = request.cookies.get('auth-token')?.value
    console.log('🎫 Verify: Auth token present:', !!authToken)
    
    if (authToken) {
      console.log('🎫 Verify: Token preview:', authToken.substring(0, 50) + '...')
    }
    
    const authUser = getAuthUser(request)
    console.log('👤 Verify: Auth user extracted:', !!authUser)
    
    if (!authUser) {
      console.log('❌ Verify: No valid session found')
      return NextResponse.json(
        { error: 'No valid session found' },
        { status: 401 }
      )
    }

    console.log('👤 Verify: User ID from token:', authUser.userId)
    
    // Fetch fresh user data from database
    let user
    try {
      user = await prisma.user.findUnique({
        where: { id: authUser.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found in enum 'UserRole'")) {
        await normalizeLegacyUserRoles()
        user = await prisma.user.findUnique({
          where: { id: authUser.userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        })
      } else {
        throw error
      }
    }

    console.log('🗄️ Verify: User found in database:', !!user)
    
    if (!user || !user.isActive) {
      console.log('❌ Verify: User not found or inactive')
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      )
    }

    console.log('✅ Verify: Session verification successful')
    return NextResponse.json({
      message: 'Session valid',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('💥 Verify: Session verification error:', error)
    return NextResponse.json(
      { error: 'Session verification failed' },
      { status: 401 }
    )
  }
}