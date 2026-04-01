import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

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
    if (isActive === 'true' || isActive === 'false') {
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
        createdBy: { select: { name: true } },
        updatedBy: { select: { name: true } },
        _count: {
          select: {
            products: true,
          },
        }
      } as any,
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      brands,
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
    
    const existingBrand = await prisma.brand.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } }
    })

    const user = requireAuth(request)

    if (existingBrand) {
      return NextResponse.json(
        { error: existingBrand.isActive ? 'Brand name already exists' : 'Brand name already exists as an inactive brand. Please reactivate it instead.' },
        { status: 400 }
      )
    }

    const brand = await prisma.brand.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: Boolean(isActive),
        createdById: user.userId,
        updatedById: user.userId,
      } as any,
      include: {
        createdBy: { select: { name: true } },
        _count: {
          select: {
            products: true,
          },
        }
      } as any,
    })

    return NextResponse.json({ brand }, { status: 201 })
  } catch (error: any) {
    console.error('Brand creation error:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Brand name already exists' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to create brand' },
      { status: 500 }
    )
  }
}