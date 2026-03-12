import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { locationId } = await request.json()
    
    if (!locationId) {
      return NextResponse.json({ error: 'Location is required' }, { status: 400 })
    }
    
    // Get purchase order with items
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: true,
                category: true,
                size: true
              }
            }
          }
        }
      }
    })
    
    if (!order) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }
    
    // Process each item
    for (const item of order.items) {
      const product = item.product
      
      // Find existing batch with same product and location
      const existingBatch = await prisma.batch.findFirst({
        where: {
          productId: product.id,
          locationId: locationId
        }
      })
      
      if (existingBatch) {
        // Update existing batch quantity
        await prisma.batch.update({
          where: { id: existingBatch.id },
          data: {
            batchNumber: item.batchNumber || existingBatch.batchNumber,
            quantity: {
              increment: item.quantity
            },
            purchasePrice: item.unitPrice || existingBatch.purchasePrice,
            sellingPrice: item.unitPrice ? (item.unitPrice * 1.2) : existingBatch.sellingPrice
          }
        })
        
        console.log(`Updated existing batch: ${existingBatch.id} with ${item.quantity} units`)
      } else {
        // Create new batch for existing product at this location
        await prisma.batch.create({
          data: {
            productId: product.id,
            locationId: locationId,
            batchNumber: item.batchNumber || `BATCH-${Date.now()}`,
            quantity: item.quantity,
            purchasePrice: item.unitPrice || 0,
            sellingPrice: (item.unitPrice || 0) * 1.2 // 20% markup
          }
        })
        
        console.log(`Created new batch for product: ${product.id} with ${item.quantity} units at location`)
      }
    }
    
    // Update purchase order status
    await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        receivedDate: new Date()
      }
    })
    
    return NextResponse.json({ 
      success: true,
      message: 'Order delivered and inventory updated successfully'
    })
    
  } catch (error: any) {
    console.error('Delivery processing error:', error)
    return NextResponse.json({ 
      error: 'Failed to process delivery',
      details: error.message 
    }, { status: 500 })
  }
}
