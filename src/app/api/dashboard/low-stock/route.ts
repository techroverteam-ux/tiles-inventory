import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    requireAuth(request)
    const lowStockItems = await prisma.batch.findMany({
      where: { quantity: { lt: 10 } },
      include: {
        product: {
          include: {
            brand: true
          }
        }
      },
      take: 10,
      orderBy: { quantity: 'asc' }
    })

    const formattedItems = lowStockItems.map(item => ({
      name: item.product.name,
      stock: item.quantity,
      minStock: 10
    }))

    return NextResponse.json(formattedItems)
  } catch (error) {
    console.error('Low stock error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json([])
  }
}