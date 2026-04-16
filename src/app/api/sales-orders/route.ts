import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const parsedLimit = limitParam ? parseInt(limitParam, 10) : 1000
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 1000) : 100
    const search = searchParams.get('search') || ''
    const brandId = searchParams.get('brandId') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    const allowedSortFields = new Set(['createdAt', 'updatedAt', 'orderDate', 'totalAmount', 'orderNumber'])
    const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : 'createdAt'

    const where: any = {
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const orders = await prisma.salesOrder.findMany({
      where,
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
        createdBy: { select: { name: true } },
        updatedBy: { select: { name: true } },
      } as any,
      orderBy: {
        [safeSortBy]: sortOrder,
      },
      take: limit,
    })

    // Add brand info and batch number to each order
    const ordersWithBrand = (orders as any[]).map(order => ({
      ...order,
      brand: order.items[0]?.product?.brand || null,
      items: order.items.map((item: any) => ({
        ...item,
        batchNumber: item.batch?.batchNumber || 'N/A',
      })),
    }))

    return NextResponse.json({
      orders: ordersWithBrand,
    })
  } catch (error) {
    console.error('Sales orders fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const user = requireAuth(request)

    const quantity = parseInt(data.quantity) || 0
    if (quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 })
    }

    // Fetch the batch directly by ID
    const batch = await prisma.batch.findUnique({ where: { id: data.batchId } })
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    // Enforce stock validation
    if (batch.quantity <= 0) {
      return NextResponse.json({ error: 'This product is out of stock' }, { status: 400 })
    }
    if (batch.quantity < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${batch.quantity}, Requested: ${quantity}` },
        { status: 400 }
      )
    }

    const unitPrice = batch.sellingPrice || 0
    const totalPrice = unitPrice * quantity

    // Deduct quantity from batch
    await prisma.batch.update({
      where: { id: batch.id },
      data: { quantity: { decrement: quantity }, updatedById: user.userId } as any,
    })

    const order = await prisma.salesOrder.create({
      data: {
        orderNumber: data.orderNumber,
        customerName: 'Customer',
        orderDate: new Date(data.soldDate),
        status: 'DELIVERED',
        totalAmount: totalPrice,
        discount: 0,
        finalAmount: totalPrice,
        items: {
          create: [{
            productId: data.productId,
            batchId: batch.id,
            quantity,
            unitPrice,
            totalPrice,
            createdById: user.userId,
            updatedById: user.userId,
          } as any],
        },
        createdById: user.userId,
        updatedById: user.userId,
      } as any,
      include: {
        items: {
          include: {
            product: { include: { brand: true, category: true, size: true } },
          },
        },
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Sales order creation error:', error)
    return NextResponse.json({ error: 'Failed to create sales order' }, { status: 500 })
  }
}