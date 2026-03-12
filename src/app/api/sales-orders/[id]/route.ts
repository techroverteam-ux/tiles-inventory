import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const order = await prisma.salesOrder.update({
      where: { id },
      data: {
        orderNumber: data.orderNumber,
        orderDate: new Date(data.soldDate),
        totalAmount: parseFloat(data.amount) || 0,
        finalAmount: parseFloat(data.amount) || 0,
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
