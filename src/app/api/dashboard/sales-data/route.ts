import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
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
    return NextResponse.json([])
  }
}