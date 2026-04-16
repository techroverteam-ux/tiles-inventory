import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    requireAuth(request)
    const salesData = await prisma.salesOrder.groupBy({
      by: ['createdAt'],
      _sum: { totalAmount: true },
      orderBy: { createdAt: 'asc' },
      take: 6
    })

    const purchaseData = await prisma.purchaseOrder.groupBy({
      by: ['createdAt'],
      _sum: { totalAmount: true },
      orderBy: { createdAt: 'asc' },
      take: 6
    })

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const chartData = months.map((month, index) => ({
      month,
      sales: salesData[index]?._sum.totalAmount || 0,
      purchases: purchaseData[index]?._sum.totalAmount || 0
    }))

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Sales data error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json([])
  }
}