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
    const brandId = searchParams.get('brandId')
    const dateFrom = searchParams.get('dateFrom') || searchParams.get('createdAtFrom')
    const dateTo = searchParams.get('dateTo') || searchParams.get('createdAtTo')

    const skip = (page - 1) * limit

    // Build the initial $match stage – filter out records with null/missing brandId
    const initialMatch: any = {
      brandId: { $ne: null, $exists: true, $type: 'objectId' }
    }

    // Filter by specific brand
    if (brandId) {
      initialMatch.brandId = { $oid: brandId }
    }

    // Filter by active status
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      initialMatch.isActive = isActive === 'true'
    }

    // Filter by date range (createdAt)
    if (dateFrom || dateTo) {
      initialMatch.createdAt = {}
      if (dateFrom) initialMatch.createdAt.$gte = { $date: new Date(dateFrom).toISOString() }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        initialMatch.createdAt.$lte = { $date: toDate.toISOString() }
      }
    }

    // Build base pipeline stages (brand join + optional search)
    const basePipeline: any[] = [
      { $match: initialMatch },
      { $lookup: { from: 'brands', localField: 'brandId', foreignField: '_id', as: 'brand' } },
      { $unwind: { path: '$brand', preserveNullAndEmptyArrays: false } },
    ]

    // Apply search filter AFTER brand lookup so we can also search by brand name
    if (search) {
      basePipeline.push({
        $match: {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { 'brand.name': { $regex: search, $options: 'i' } },
          ]
        }
      })
    }

    // Count total matching records using the lightweight base pipeline (no product lookup needed)
    const countPipeline = [...basePipeline, { $count: 'total' }]
    const countResult = await (prisma as any).$runCommandRaw({
      aggregate: 'categories',
      pipeline: countPipeline,
      cursor: {}
    })
    const totalCount = countResult?.cursor?.firstBatch?.[0]?.total || 0

    // Fetch paginated results with product count
    const dataPipeline = [
      ...basePipeline,
      { $sort: { isActive: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      // Count products linked to this category (only for the paginated set)
      { $lookup: { from: 'products', localField: '_id', foreignField: 'categoryId', as: '_products' } },
      { $addFields: { productCount: { $size: '$_products' } } },
      { $project: { _products: 0 } },
    ]
    const rawCategories = await (prisma as any).$runCommandRaw({
      aggregate: 'categories',
      pipeline: dataPipeline,
      cursor: {}
    })

    const categories = (rawCategories?.cursor?.firstBatch || []).map((c: any) => ({
      ...c,
      id: c._id?.$oid || c._id?.toString() || String(c._id),
      brandId: c.brandId?.$oid || c.brandId?.toString() || String(c.brandId),
      createdAt: c.createdAt?.$date || c.createdAt,
      updatedAt: c.updatedAt?.$date || c.updatedAt,
      brand: c.brand
        ? {
            ...c.brand,
            id: c.brand._id?.$oid || c.brand._id?.toString() || String(c.brand._id),
          }
        : null,
      createdBy: c.createdByName ? { name: c.createdByName, email: '' } : null,
      updatedBy: c.updatedByName ? { name: c.updatedByName, email: '' } : null,
      _count: { products: c.productCount || 0 },
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
    const authUser = getAuthUser(request)
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

    // Resolve creator name
    let createdByName: string | null = null
    if (authUser?.userId) {
      const user = await prisma.user.findUnique({ where: { id: authUser.userId }, select: { name: true, email: true } })
      createdByName = user?.name || user?.email || null
    }
    
    const category = await (prisma as any).category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        brandId: brandId,
        isActive: Boolean(isActive),
        ...(createdByName ? { createdByName } : {}),
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