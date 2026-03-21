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
    const { id } = await params
    
    // Get batch details first
    const batch = await prisma.batch.findUnique({
      where: { id },
      select: { productId: true, locationId: true, batchNumber: true }
    })
    
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }
    
    // Delete related sales items that reference this batch
    await prisma.salesItem.deleteMany({
      where: { batchId: id },
    })
    
    // Delete related purchase items with matching product, location, and batch number
    await prisma.purchaseItem.deleteMany({
      where: { 
        productId: batch.productId,
        locationId: batch.locationId,
        batchNumber: batch.batchNumber
      },
    })
    
    // Now delete the batch
    await prisma.batch.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Batch deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete batch' },
      { status: 500 }
    )
  }
}
