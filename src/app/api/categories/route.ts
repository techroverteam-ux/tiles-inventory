import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')
    const brandId = searchParams.get('brandId')

    const skip = (page - 1) * limit

    const where: any = {}
    
    // Search across multiple fields
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }
    
    // Filter by brand
    if (brandId) {
      where.brandId = brandId
    }
    
    // Filter by status
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    // Get total count for pagination
    const totalCount = await prisma.category.count({ where })

    const categories = await prisma.category.findMany({
      where,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      categories,
      totalCount,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    })
  } catch (error) {
    console.error('Categories fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const { name, description, brandId, isActive = true } = data
    
    // Validate required fields
    if (!name || !name.trim() || !brandId) {
      return NextResponse.json(
        { error: 'Category name and brand are required' },
        { status: 400 }
      )
    }
    
    // Check if category name already exists for this brand
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
        brandId: brandId
      }
    })
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category name already exists for this brand' },
        { status: 400 }
      )
    }
    
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        brandId: brandId,
        isActive: Boolean(isActive)
      },
      include: {
        brand: {
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

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Category creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}