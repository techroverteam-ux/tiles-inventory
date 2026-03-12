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
      
      // Check if matching product exists with same brand, category, size, and location
      const existingProduct = await prisma.product.findFirst({
        where: {
          brandId: product.brandId,
          categoryId: product.categoryId,
          sizeId: product.sizeId,
          batches: {
            some: {
              locationId: locationId
            }
          }
        },
        include: {
          batches: {
            where: {
              locationId: locationId
            }
          }
        }
      })
      
      if (existingProduct && existingProduct.batches.length > 0) {
        // Update existing batch quantity and batch number
        await prisma.batch.update({
          where: { id: existingProduct.batches[0].id },
          data: {
            batchNumber: item.batchNumber || existingProduct.batches[0].batchNumber,
            quantity: {
              increment: item.quantity
            }
          }
        })
        
        // Update product pcsPerBox
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            pcsPerBox: {
              increment: item.quantity
            }
          }
        })
        
        console.log(`Updated existing product: ${existingProduct.id} with ${item.quantity} units`)
      } else {
        // Create new product
        const newProduct = await prisma.product.create({
          data: {
            name: product.name,
            code: `${product.code}-${Date.now()}`,
            brandId: product.brandId,
            categoryId: product.categoryId,
            sizeId: product.sizeId,
            finishTypeId: product.finishTypeId,
            sqftPerBox: product.sqftPerBox || 1,
            pcsPerBox: item.quantity,
            imageUrl: product.imageUrl
          }
        })
        
        // Create batch for new product
        await prisma.batch.create({
          data: {
            productId: newProduct.id,
            locationId: locationId,
            batchNumber: item.batchNumber || `BATCH-${Date.now()}`,
            quantity: item.quantity,
            purchasePrice: item.unitPrice || 0,
            sellingPrice: (item.unitPrice || 0) * 1.2 // 20% markup
          }
        })
        
        console.log(`Created new product: ${newProduct.id} with ${item.quantity} units`)
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
