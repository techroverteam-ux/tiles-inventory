import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const skip = (page - 1) * limit
    
    // Search parameter
    const search = searchParams.get('search') || ''
    
    // Filter parameters
    const brandId = searchParams.get('brandId')
    const categoryId = searchParams.get('categoryId')
    const sizeId = searchParams.get('sizeId')
    const isActive = searchParams.get('isActive')
    
    // Build where clause
    const where: any = {}
    
    // Search across multiple fields
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { brand: { name: { contains: search, mode: 'insensitive' } } },
        { category: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }
    
    // Apply filters
    if (brandId) {
      where.brandId = brandId
    }
    
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    if (sizeId) {
      where.sizeId = sizeId
    }
    
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }
    
    // Get total count for pagination
    const totalCount = await prisma.product.count({ where })
    
    // Get products with pagination
    const products = await prisma.product.findMany({
      where,
      include: {
        brand: {
          select: { name: true }
        },
        category: {
          select: { name: true }
        },
        size: {
          select: { name: true }
        },
        finishType: {
          select: { name: true }
        },
        _count: {
          select: {
            batches: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    })
    
    const totalPages = Math.ceil(totalCount / limit)
    
    return NextResponse.json({
      products,
      totalCount,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    })
    
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      name,
      code,
      brandId,
      categoryId,
      sizeId,
      finishTypeId,
      sqftPerBox,
      pcsPerBox,
      imageUrl
    } = body
    
    // Validate required fields
    if (!name || !code || !brandId || !categoryId || !finishTypeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check if product code already exists
    const existingProduct = await prisma.product.findFirst({
      where: { code }
    })
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product code already exists' },
        { status: 400 }
      )
    }
    
    const product = await prisma.product.create({
      data: {
        name,
        code,
        brandId,
        categoryId,
        sizeId: sizeId || null,
        finishTypeId,
        sqftPerBox: sqftPerBox || 1,
        pcsPerBox: pcsPerBox || 1,
        imageUrl: imageUrl || null,
        isActive: true
      },
      include: {
        brand: {
          select: { name: true }
        },
        category: {
          select: { name: true }
        },
        size: {
          select: { name: true }
        },
        finishType: {
          select: { name: true }
        }
      }
    })
    
    return NextResponse.json({ product }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}