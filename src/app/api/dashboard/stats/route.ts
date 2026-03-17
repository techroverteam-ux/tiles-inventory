import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [totalProducts, totalBrands, totalCategories, totalSizes, purchaseOrders, totalSalesOrders, lowStockItems, monthlySales] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.brand.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.size.count({ where: { isActive: true } }),
      prisma.purchaseOrder.count({ where: { status: { not: 'DELIVERED' } } }),
      prisma.salesOrder.count(),
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
      totalBrands,
      totalCategories,
      totalSizes,
      totalProducts,
      monthlySales: monthlySales._sum.totalAmount || 0,
      purchaseOrders,
      salesOrders: totalSalesOrders,
      lowStockItems
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({
      totalBrands: 0,
      totalCategories: 0,
      totalSizes: 0,
      totalProducts: 0,
      monthlySales: 0,
      purchaseOrders: 0,
      salesOrders: 0,
      lowStockItems: 0
    })
  }
}