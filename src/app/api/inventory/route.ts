import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

async function getOrCreateDefaultLocation(userId: string): Promise<string> {
  let loc = await prisma.location.findFirst({ where: { name: 'Unassigned' } })
  if (!loc) {
    loc = await prisma.location.create({
      data: { name: 'Unassigned', isActive: true, createdById: userId, updatedById: userId }
    })
  }
  return loc.id
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const locationId = searchParams.get('locationId') || ''
    const brandId = searchParams.get('brandId') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const sizeId = searchParams.get('sizeId') || ''
    const lowStock = searchParams.get('lowStock') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    const where: any = {
      ...(search && {
        OR: [
          { batchNumber: { contains: search, mode: 'insensitive' } },
          { shade: { contains: search, mode: 'insensitive' } },
          { product: { name: { contains: search, mode: 'insensitive' } } },
          { product: { code: { contains: search, mode: 'insensitive' } } },
        ],
      }),
      ...(locationId && { locationId }),
      ...(brandId && { product: { brandId } }),
      ...(categoryId && { product: { categoryId } }),
      ...(sizeId && { product: { sizeId } }),
      ...(lowStock === 'low' && { quantity: { lt: 10 } }),
      ...(lowStock === 'out' && { quantity: { equals: 0 } }),
      ...(dateFrom && dateTo && {
        createdAt: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        },
      }),
    }

    const [inventory, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        include: {
          product: {
            include: {
              brand: true,
              category: true,
              size: true,
              purchaseItems: {
                orderBy: {
                  createdAt: 'desc'
                },
                take: 1,
                select: {
                  unitPrice: true,
                  batchNumber: true
                }
              },
              salesItems: {
                orderBy: {
                  createdAt: 'desc'
                },
                take: 1,
                select: {
                  unitPrice: true
                }
              }
            },
          },
          location: true,
          createdBy: { select: { name: true } },
          updatedBy: { select: { name: true } },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.batch.count({ where }),
    ])

    // Map inventory with prices and batch names from purchase and sales orders
    const inventoryWithPrices = inventory.map(item => {
      // Get the most recent batch name from purchase items or use the batch table value
      const latestBatchName = item.product?.purchaseItems?.[0]?.batchNumber || item.batchNumber
      
      return {
        ...item,
        batchNumber: latestBatchName,
        purchasePrice: item.product?.purchaseItems?.[0]?.unitPrice || 0,
        sellingPrice: item.product?.salesItems?.[0]?.unitPrice || 0,
      }
    })

    return NextResponse.json({
      inventory: inventoryWithPrices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Inventory fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const user = requireAuth(request)
    
    const batch = await prisma.batch.create({
      data: {
        productId: data.productId,
        locationId: data.locationId || await getOrCreateDefaultLocation(user.userId),
        batchNumber: data.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
        shade: data.shade,
        quantity: data.quantity,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        imageUrl: data.imageUrl,
        createdById: user.userId,
        updatedById: user.userId,
      },
      include: {
        product: {
          include: {
            brand: true,
            category: true,
          },
        },
        location: true,
        createdBy: { select: { name: true } },
      },
    })

    return NextResponse.json(batch, { status: 201 })
  } catch (error) {
    console.error('Batch creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    )
  }
}