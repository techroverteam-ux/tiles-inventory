import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsedPage = parseInt(searchParams.get('page') || '1', 10)
    const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1
    const limitParam = searchParams.get('limit')
    const parsedLimit = limitParam ? parseInt(limitParam, 10) : 1000
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 1000) : 100
    const search = searchParams.get('search') || ''
    const brandId = searchParams.get('brandId') || ''
    const status = searchParams.get('status') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    const allowedSortFields = new Set(['createdAt', 'updatedAt', 'orderDate', 'totalAmount', 'orderNumber'])
    const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : 'createdAt'

    const skip = (page - 1) * limit

    const where: any = {
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(brandId && { brandId }),
      ...(status && { status }),
      ...(dateFrom && dateTo && {
        orderDate: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        },
      }),
    }

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          brand: true,
          createdBy: { select: { name: true } },
          updatedBy: { select: { name: true } },
          items: {
            include: {
              product: {
                include: {
                  category: true,
                  size: true,
                },
              },
            },
          },
        } as any,
        orderBy: {
          [safeSortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Purchase orders fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const user = requireAuth(request)

    const { productId, orderDate, expectedDate, quantity, batchName, amount, orderNumber } = data

    if (!productId || !orderDate || !quantity) {
      return NextResponse.json({ error: 'Product, order date and quantity are required' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const qty = parseInt(quantity) || 0
    const totalAmount = parseFloat(amount) || 0
    const unitPrice = qty > 0 ? totalAmount / qty : 0
    const batchNum = batchName || `BATCH-${Date.now()}`

    // Get default location
    let location = await prisma.location.findFirst({ where: { isActive: true } })
    if (!location) {
      location = await prisma.location.create({
        data: { name: 'Main Warehouse', isActive: true },
      })
    }

    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber: orderNumber || `PO-${Date.now()}`,
        brandId: product.brandId,
        orderDate: new Date(orderDate),
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        status: 'PENDING',
        totalAmount,
        items: {
          create: [{
            productId: product.id,
            locationId: location.id,
            batchNumber: batchNum,
            quantity: qty,
            unitPrice,
            totalPrice: totalAmount,
            createdById: user.userId,
            updatedById: user.userId,
          } as any],
        },
        createdById: user.userId,
        updatedById: user.userId,
      } as any,
      include: {
        brand: true,
        items: { include: { product: { include: { category: true, size: true } } } },
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error('Purchase order creation error:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Order number already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 })
  }
}