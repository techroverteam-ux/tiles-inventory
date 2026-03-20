import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hasExplicitPagination = searchParams.has('page') || searchParams.has('limit')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || (hasExplicitPagination ? '25' : '1000'))
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')
    const dateFrom = searchParams.get('dateFrom') || searchParams.get('createdAtFrom')
    const dateTo = searchParams.get('dateTo') || searchParams.get('createdAtTo')

    const skip = (page - 1) * limit

    const where: any = {}
    
    // Search across multiple fields
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // Default list behavior: show active items unless status is explicitly requested
    if (isActive === null || isActive === undefined || isActive === '') {
      where.isActive = true
    } else {
      where.isActive = isActive === 'true'
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = toDate
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.brand.count({ where })

    const brands = await prisma.brand.findMany({
      where,
      include: {
        _count: {
          select: {
            categories: true,
            products: true,
          },
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

    // Attach createdBy/updatedBy from stored name fields
    const brandsWithMeta = (brands as any[]).map(b => ({
      ...b,
      createdBy: b.createdByName ? { name: b.createdByName, email: '' } : null,
      updatedBy: b.updatedByName ? { name: b.updatedByName, email: '' } : null,
    }))

    return NextResponse.json({
      brands: brandsWithMeta,
      totalCount,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    })
  } catch (error) {
    console.error('Brands fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const { name, description, isActive = true } = data
    
    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      )
    }
    
    // Check if brand name already exists
    const existingBrand = await prisma.brand.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } }
    })
    
    if (existingBrand) {
      return NextResponse.json(
        { error: 'Brand name already exists' },
        { status: 400 }
      )
    }

    const brand = await (prisma as any).brand.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: Boolean(isActive),
      },
      include: {
        _count: {
          select: {
            categories: true,
            products: true,
          },
        }
      }
    })

    return NextResponse.json({ brand }, { status: 201 })
  } catch (error) {
    console.error('Brand creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create brand' },
      { status: 500 }
    )
  }
}