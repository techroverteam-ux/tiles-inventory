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

    // Use aggregation to skip documents with null brandId
    const rawCategories = await (prisma as any).$runCommandRaw({
      aggregate: 'categories',
      pipeline: [
        { $match: { brandId: { $ne: null, $exists: true, $type: 'objectId' } } },
        { $lookup: { from: 'brands', localField: 'brandId', foreignField: '_id', as: 'brand' } },
        { $unwind: { path: '$brand', preserveNullAndEmptyArrays: false } },
        { $sort: { isActive: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ],
      cursor: {}
    })

    const categories = (rawCategories?.cursor?.firstBatch || []).map((c: any) => ({
      ...c,
      id: c._id?.$oid || c._id?.toString() || String(c._id),
      brandId: c.brandId?.$oid || c.brandId?.toString() || String(c.brandId),
      brand: c.brand ? { ...c.brand, id: c.brand._id?.$oid || c.brand._id?.toString() || String(c.brand._id) } : null,
      _count: { products: 0 }
    }))

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