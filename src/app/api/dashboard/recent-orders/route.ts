import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    requireAuth(request)
    const [salesOrders, purchaseOrders] = await Promise.all([
      prisma.salesOrder.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.purchaseOrder.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { brand: true }
      })
    ])

    const recentOrders = [
      ...salesOrders.map(order => ({
        id: order.orderNumber,
        type: 'Sales',
        customer: order.customerName,
        amount: order.totalAmount,
        status: order.status
      })),
      ...purchaseOrders.map(order => ({
        id: order.orderNumber,
        type: 'Purchase',
        brand: order.brand?.name || 'Unknown',
        amount: order.totalAmount,
        status: order.status
      }))
    ].slice(0, 10)

    return NextResponse.json(recentOrders)
  } catch (error) {
    console.error('Recent orders error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json([])
  }
}