import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const search = searchParams.get('search') || ''
    const brandId = searchParams.get('brandId')
    const categoryId = searchParams.get('categoryId')
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    const where: any = {}
    
    // Search across multiple fields
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { name: { contains: search, mode: 'insensitive' } } },
        { category: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }
    
    // Filter by brand
    if (brandId) {
      where.brandId = brandId
    }
    
    // Filter by category
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    // Filter by status
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const totalCount = await prisma.size.count({ where })

    const sizes = await prisma.size.findMany({
      where,
      include: {
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        _count: { select: { products: true } }
      },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      sizes,
      totalCount,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    })
  } catch (error: any) {
    console.error('Sizes fetch error:', error)
    if (error.code === 'P2032' || error.message?.includes('null')) {
      // Return empty result if there are null field issues in DB
      return NextResponse.json({
        sizes: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        itemsPerPage: limit,
        hasNextPage: false,
        hasPreviousPage: false
      })
    }
    return NextResponse.json(
      { error: 'Failed to fetch sizes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const { name, description, length, width, brandId, categoryId, isActive = true } = data
    
    // Validate required fields
    if (!name || !name.trim() || !brandId || !categoryId) {
      return NextResponse.json(
        { error: 'Size name, brand, and category are required' },
        { status: 400 }
      )
    }
    
    // Check if size name already exists for this brand and category
    const existingSize = await prisma.size.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
        brandId: brandId,
        categoryId: categoryId
      }
    })
    
    if (existingSize) {
      return NextResponse.json(
        { error: 'Size name already exists for this brand and category' },
        { status: 400 }
      )
    }
    
    const size = await prisma.size.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        length: length ? parseFloat(length) : null,
        width: width ? parseFloat(width) : null,
        brandId: brandId,
        categoryId: categoryId,
        isActive: Boolean(isActive)
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        }
      },
    })

    return NextResponse.json({ size }, { status: 201 })
  } catch (error) {
    console.error('Size creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create size' },
      { status: 500 }
    )
  }
}