import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : 1000 // Default to large number to get all
    const search = searchParams.get('search') || ''
    const brandId = searchParams.get('brandId') || ''
    const status = searchParams.get('status') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

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
          [sortBy]: sortOrder,
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
    
    // Find or create product based on brand, category, and size
    let product = await prisma.product.findFirst({
      where: {
        brandId: data.brandId,
        categoryId: data.categoryId,
        sizeId: data.sizeId,
      },
    })

    // If product doesn't exist, create a basic one
    if (!product) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } })
      const size = await prisma.size.findUnique({ where: { id: data.sizeId } })
      const brand = await prisma.brand.findUnique({ where: { id: data.brandId } })

      product = await prisma.product.create({
        data: {
          name: `${brand?.name} ${category?.name} ${size?.name}`,
          code: `${brand?.name?.substring(0, 3).toUpperCase()}-${Date.now()}`,
          brandId: data.brandId,
          categoryId: data.categoryId,
          sizeId: data.sizeId,
          sqftPerBox: size?.length && size?.width ? (size.length * size.width) / 144 : 1,
          pcsPerBox: 1,
          isActive: true,
          createdById: user.userId,
          updatedById: user.userId,
        } as any,
      })
    }

    // Get default location
    let location = await prisma.location.findFirst({ where: { isActive: true } })
    if (!location) {
      location = await prisma.location.create({
        data: { name: 'Main Warehouse', isActive: true },
      })
    }

    const quantity = parseInt(data.quantity) || 0
    const amount = parseFloat(data.amount) || 0
    const unitPrice = quantity > 0 ? amount / quantity : 0

    // Find or create batch and update batch number
    let batch = await prisma.batch.findFirst({
      where: {
        productId: product.id,
        locationId: location.id,
      },
    })

    const batchName = data.batchName || `BATCH-${Date.now()}`

    if (batch) {
      // Update existing batch with new batch number
      await prisma.batch.update({
        where: { id: batch.id },
        data: {
          batchNumber: batchName,
          updatedById: user.userId,
        } as any,
      })
    } else {
      // Create new batch
      await prisma.batch.create({
        data: {
          productId: product.id,
          locationId: location.id,
          batchNumber: batchName,
          quantity: 0,
          purchasePrice: 0,
          sellingPrice: 0,
          createdById: user.userId,
          updatedById: user.userId,
        } as any,
      })
    }

    // Create order with items
    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber: data.orderNumber,
        brandId: data.brandId,
        orderDate: new Date(data.orderDate),
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        status: 'PENDING',
        totalAmount: amount,
        items: {
          create: [
            {
              productId: product.id,
              locationId: location.id,
              batchNumber: batchName,
              quantity: quantity,
              unitPrice: unitPrice,
              totalPrice: amount,
              createdById: user.userId,
              updatedById: user.userId,
            } as any,
          ],
        },
        createdById: user.userId,
        updatedById: user.userId,
      } as any,
      include: {
        brand: true,
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
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Purchase order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create purchase order' },
      { status: 500 }
    )
  }
}