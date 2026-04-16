import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()
    const user = requireAuth(request)
    
    const batch = await prisma.batch.update({
      where: { id },
      data: {
        batchNumber: data.batchNumber,
        quantity: data.quantity,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        imageUrl: data.imageUrl,
        updatedById: user.userId,
      } as any,
      include: {
        product: {
          include: {
            brand: true,
            category: true,
            size: true,
          },
        },
        location: true,
        createdBy: { select: { name: true } },
        updatedBy: { select: { name: true } },
      } as any,
    })

    return NextResponse.json(batch)
  } catch (error) {
    console.error('Batch update error:', error)
    return NextResponse.json(
      { error: 'Failed to update batch' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request)
    const { id } = await params
    
    // Get batch details first
    const batch = await prisma.batch.findUnique({
      where: { id },
      select: { productId: true, locationId: true, batchNumber: true }
    })
    
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }
    
    await prisma.$transaction(async (tx) => {
      await tx.salesItem.deleteMany({
        where: { batchId: id },
      })

      await tx.purchaseItem.deleteMany({
        where: {
          productId: batch.productId,
          locationId: batch.locationId,
          batchNumber: batch.batchNumber,
        },
      })

      await tx.batch.delete({
        where: { id },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Batch deletion error:', error)
    if (error?.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to delete batch' },
      { status: 500 }
    )
  }
}
