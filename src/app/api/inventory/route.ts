import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

const createBatchSchema = z.object({
  productId: z.string().min(1),
  locationId: z.string().min(1).optional(),
  batchNumber: z.string().trim().max(100).optional(),
  shade: z.string().trim().max(100).optional(),
  quantity: z.coerce.number().int().positive().max(1000000),
  purchasePrice: z.coerce.number().min(0).max(100000000).nullable().optional(),
  sellingPrice: z.coerce.number().min(0).max(100000000).nullable().optional(),
  receivedDate: z.string().trim().optional().nullable(),
  expiryDate: z.string().trim().optional().nullable(),
  imageUrl: z.string().url().max(2000).optional().nullable(),
})

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
    const parsedPage = parseInt(searchParams.get('page') || '1', 10)
    const parsedLimit = parseInt(searchParams.get('limit') || '10', 10)
    const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 1000) : 10
    const search = searchParams.get('search') || ''
    const locationId = searchParams.get('locationId') || ''
    const brandId = searchParams.get('brandId') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const sizeId = searchParams.get('sizeId') || ''
    const lowStock = searchParams.get('lowStock') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    const allowedSortFields = new Set(['createdAt', 'updatedAt', 'quantity', 'batchNumber'])
    const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : 'createdAt'

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
          [safeSortBy]: sortOrder,
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
    const body = await request.json()
    const parsed = createBatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid batch payload' }, { status: 400 })
    }

    const data = parsed.data
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