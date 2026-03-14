import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    const where: any = {}
    
    // Search across multiple fields
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // Filter by status
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    // Get total count for pagination
    const totalCount = await prisma.location.count({ where })

    const locations = await prisma.location.findMany({
      where,
      include: {
        _count: {
          select: {
            batches: true,
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
      locations,
      totalCount,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    })
  } catch (error) {
    console.error('Locations fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const { name, address, isActive = true } = data
    
    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Location name is required' },
        { status: 400 }
      )
    }
    
    // Check if location name already exists
    const existingLocation = await prisma.location.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } }
    })
    
    if (existingLocation) {
      return NextResponse.json(
        { error: 'Location name already exists' },
        { status: 400 }
      )
    }
    
    const location = await prisma.location.create({
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        isActive: Boolean(isActive)
      },
      include: {
        _count: {
          select: {
            batches: true,
          },
        }
      }
    })

    return NextResponse.json({ location }, { status: 201 })
  } catch (error) {
    console.error('Location creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
}