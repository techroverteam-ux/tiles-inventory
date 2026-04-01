import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const batches = await prisma.batch.findMany({
      where: {
        productId: params.productId,
        quantity: { gt: 0 },
      },
      include: { location: true },
      orderBy: { createdAt: 'desc' },
    })

    const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0)

    return NextResponse.json({ batches, totalStock })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stock' }, { status: 500 })
  }
}
