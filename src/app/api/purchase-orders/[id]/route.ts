import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()
    const user = requireAuth(request)
    
    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        orderNumber: data.orderNumber,
        brandId: data.brandId,
        orderDate: new Date(data.orderDate),
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        updatedById: user.userId,
      } as any
    })
    
    return NextResponse.json(order)
  } catch (error: any) {
    console.error('Purchase order update error:', error)
    return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request)
    const { id } = await params
    
    await prisma.$transaction(async (tx) => {
      await tx.purchaseItem.deleteMany({
        where: { purchaseOrderId: id }
      })

      await tx.purchaseOrder.delete({
        where: { id }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Purchase order delete error:', error)
    if (error?.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete purchase order' }, { status: 500 })
  }
}
