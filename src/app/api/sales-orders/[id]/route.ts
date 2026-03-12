import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()
    
    // Get existing order with items
    const existingOrder = await prisma.salesOrder.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Restore inventory for old quantity
    if (existingOrder.items[0]) {
      await prisma.batch.update({
        where: { id: existingOrder.items[0].batchId },
        data: {
          quantity: {
            increment: existingOrder.items[0].quantity
          }
        }
      })
    }

    // Find or create product with new data
    let product = await prisma.product.findFirst({
      where: {
        brandId: data.brandId,
        categoryId: data.categoryId,
        sizeId: data.sizeId,
      },
    })

    if (!product) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } })
      const size = await prisma.size.findUnique({ where: { id: data.sizeId } })
      const brand = await prisma.brand.findUnique({ where: { id: data.brandId } })
      
      let finishType = await prisma.finishType.findFirst({ where: { isActive: true } })
      if (!finishType) {
        finishType = await prisma.finishType.create({
          data: { name: 'Standard', isActive: true },
        })
      }

      product = await prisma.product.create({
        data: {
          name: `${brand?.name} ${category?.name} ${size?.name}`,
          code: `${brand?.name?.substring(0, 3).toUpperCase()}-${Date.now()}`,
          brandId: data.brandId,
          categoryId: data.categoryId,
          sizeId: data.sizeId,
          finishTypeId: finishType.id,
          sqftPerBox: size?.length && size?.width ? (size.length * size.width) / 144 : 1,
          pcsPerBox: 1,
          isActive: true,
        },
      })
    }

    // Get or create batch
    let batch = await prisma.batch.findFirst({
      where: {
        productId: product.id,
        locationId: data.locationId,
      },
    })

    if (!batch) {
      batch = await prisma.batch.create({
        data: {
          productId: product.id,
          locationId: data.locationId,
          batchNumber: data.batchName || `BATCH-${Date.now()}`,
          quantity: 0,
          purchasePrice: 0,
          sellingPrice: 0,
        },
      })
    } else if (data.batchName) {
      batch = await prisma.batch.update({
        where: { id: batch.id },
        data: { batchNumber: data.batchName },
      })
    }

    const quantity = parseInt(data.quantity) || 0
    const amount = parseFloat(data.amount) || 0
    const unitPrice = quantity > 0 ? amount / quantity : 0

    // Deduct new quantity from batch
    await prisma.batch.update({
      where: { id: batch.id },
      data: {
        quantity: {
          decrement: quantity,
        },
      },
    })

    // Delete old items
    await prisma.salesItem.deleteMany({
      where: { salesOrderId: id }
    })

    // Update order with new data
    const order = await prisma.salesOrder.update({
      where: { id },
      data: {
        orderNumber: data.orderNumber,
        orderDate: new Date(data.soldDate),
        totalAmount: amount,
        finalAmount: amount,
        items: {
          create: [
            {
              productId: product.id,
              batchId: batch.id,
              quantity: quantity,
              unitPrice: unitPrice,
              totalPrice: amount,
            },
          ],
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: true,
                category: true,
                size: true,
              },
            },
            batch: {
              include: {
                location: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Sales order update error:', error)
    return NextResponse.json(
      { error: 'Failed to update sales order' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Delete sales items first
    await prisma.salesItem.deleteMany({
      where: { salesOrderId: id },
    })
    
    // Delete sales order
    await prisma.salesOrder.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Sales order deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete sales order' },
      { status: 500 }
    )
  }
}
