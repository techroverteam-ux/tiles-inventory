import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action, password } = await request.json()
    if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 })

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const valid = await bcrypt.compare(password, dbUser.password)
    if (!valid) return NextResponse.json({ error: 'Incorrect password' }, { status: 403 })

    // Step 1: password-only verification
    if (action === '__verify__') {
      return NextResponse.json({ success: true })
    }

    // Step 2: actual destructive actions
    if (action === 'delete-account') {
      await prisma.user.delete({ where: { id: user.userId } })
      const response = NextResponse.json({ success: true, action: 'delete-account' })
      response.cookies.delete('auth-token')
      return response
    }

    if (action === 'delete-all-data') {
      await prisma.salesItem.deleteMany({})
      await prisma.purchaseItem.deleteMany({})
      await prisma.salesOrder.deleteMany({})
      await prisma.purchaseOrder.deleteMany({})
      await prisma.batch.deleteMany({})
      await prisma.product.deleteMany({})
      await prisma.location.deleteMany({})
      await prisma.size.deleteMany({})
      await prisma.category.deleteMany({})
      await prisma.collection.deleteMany({})
      await prisma.brand.deleteMany({})
      await prisma.notification.deleteMany({})
      return NextResponse.json({ success: true, action: 'delete-all-data' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Danger zone error:', error)
    return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 500 })
  }
}
