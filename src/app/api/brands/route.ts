import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
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
        { description: { contains: search, mode: 'insensitive' } },
        { contactInfo: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // Filter by status
    if (isActive !== null && isActive !== undefined && isActive !== '') {
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
    const authUser = getAuthUser(request)
    const data = await request.json()
    
    const { name, description, contactInfo, isActive = true } = data
    
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

    // Resolve creator name
    let createdByName: string | null = null
    if (authUser?.userId) {
      const user = await prisma.user.findUnique({ where: { id: authUser.userId }, select: { name: true, email: true } })
      createdByName = user?.name || user?.email || null
    }
    
    const brand = await (prisma as any).brand.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        contactInfo: contactInfo?.trim() || null,
        isActive: Boolean(isActive),
        ...(createdByName ? { createdByName } : {}),
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