import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [totalProducts, purchaseOrders, lowStockItems, monthlySales] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.purchaseOrder.count({ where: { status: { not: 'DELIVERED' } } }),
      prisma.batch.count({ where: { quantity: { lt: 10 } } }),
      prisma.salesOrder.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ])

    return NextResponse.json({
      totalProducts,
      monthlySales: monthlySales._sum.totalAmount || 0,
      purchaseOrders,
      lowStockItems
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({
      totalProducts: 0,
      monthlySales: 0,
      purchaseOrders: 0,
      lowStockItems: 0
    })
  }
}