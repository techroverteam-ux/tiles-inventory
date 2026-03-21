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

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }



    if (isActive === null || isActive === undefined || isActive === '') {
      where.isActive = true
    } else {
      where.isActive = isActive === 'true'
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = toDate
      }
    }

    const totalCount = await prisma.category.count({ where })

    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: {
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
    
    const { name, description, isActive = true } = data
    
    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }
    
    // Check if category name already exists (only active ones)
    const existingCategory = await prisma.category.findFirst({
      where: { 
        name: { equals: name.trim(), mode: 'insensitive' },
        isActive: true
      }
    })
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: Boolean(isActive),
      },
      include: {
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