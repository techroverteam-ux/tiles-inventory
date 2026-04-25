import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authUser = getAdminAuthUser(request)

    if (!authUser) {
      return NextResponse.json({ error: 'No valid admin session found' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin user not found or inactive' }, { status: 401 })
    }

    return NextResponse.json({
      message: 'Admin session valid',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Admin session verification error:', error)
    return NextResponse.json({ error: 'Session verification failed' }, { status: 401 })
  }
}
