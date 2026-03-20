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

    const totalCount = await prisma.size.count({ where })

    const sizes = await prisma.size.findMany({
      where,
      include: {
        _count: { select: { products: true } }
      },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(totalCount / limit)

    // Attach createdBy/updatedBy from stored name fields
    const sizesWithMeta = (sizes as any[]).map(s => ({
      ...s,
      createdBy: s.createdByName ? { name: s.createdByName, email: '' } : null,
      updatedBy: s.updatedByName ? { name: s.updatedByName, email: '' } : null,
    }))

    return NextResponse.json({
      sizes: sizesWithMeta,
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
        itemsPerPage: 25,
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
    
    const { name, description, length, width, isActive = true } = data
    
    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Size name is required' },
        { status: 400 }
      )
    }
    
    // Check if size name already exists
    const existingSize = await prisma.size.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' }
      }
    })
    
    if (existingSize) {
      return NextResponse.json(
        { error: 'Size name already exists' },
        { status: 400 }
      )
    }

    const parsedLength = (length !== undefined && length !== null && length !== '') ? parseFloat(String(length)) : null
    const parsedWidth = (width !== undefined && width !== null && width !== '') ? parseFloat(String(width)) : null

    if ((length && isNaN(parsedLength!)) || (width && isNaN(parsedWidth!))) {
      return NextResponse.json(
        { error: 'Invalid dimensions provided' },
        { status: 400 }
      )
    }

    const size = await prisma.size.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        length: parsedLength,
        width: parsedWidth,
        isActive: Boolean(isActive),
      }
    })

    return NextResponse.json({ size }, { status: 201 })
  } catch (error: any) {
    console.error('Size creation error:', error)
    return NextResponse.json(
      { error: `Failed to create size: ${error.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}