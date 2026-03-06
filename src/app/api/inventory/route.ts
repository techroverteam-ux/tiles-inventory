import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const locationId = searchParams.get('locationId') || ''
    const brandId = searchParams.get('brandId') || ''
    const categoryId = searchParams.get('categoryId') || ''
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
            },
          },
          location: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.batch.count({ where }),
    ])

    return NextResponse.json({
      inventory,
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
    
    const batch = await prisma.batch.create({
      data: {
        productId: data.productId,
        locationId: data.locationId,
        batchNumber: data.batchNumber,
        shade: data.shade,
        quantity: data.quantity,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      },
      include: {
        product: {
          include: {
            brand: true,
            category: true,
          },
        },
        location: true,
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