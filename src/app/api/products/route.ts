import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const brandId = searchParams.get('brandId') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const isActive = searchParams.get('isActive')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const skip = (page - 1) * limit

    const where: any = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(brandId && { brandId }),
      ...(categoryId && { categoryId }),
      ...(isActive !== null && { isActive: isActive === 'true' }),
      ...(dateFrom && dateTo && {
        createdAt: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        },
      }),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          brand: true,
          category: true,
          finishType: true,
          batches: {
            select: {
              quantity: true,
              location: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    const productsWithStock = products.map(product => ({
      ...product,
      totalStock: product.batches.reduce((sum, batch) => sum + batch.quantity, 0),
    }))

    return NextResponse.json({
      products: productsWithStock,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Products fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const product = await prisma.product.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        brandId: data.brandId,
        categoryId: data.categoryId,
        finishTypeId: data.finishTypeId,
        length: parseFloat(data.length),
        width: parseFloat(data.width),
        thickness: data.thickness ? parseFloat(data.thickness) : null,
        sqftPerBox: parseFloat(data.sqftPerBox),
        pcsPerBox: parseInt(data.pcsPerBox),
        imageUrl: data.imageUrl,
      },
      include: {
        brand: true,
        category: true,
        finishType: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}