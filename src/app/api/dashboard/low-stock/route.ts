import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
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
    return NextResponse.json([])
  }
}