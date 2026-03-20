import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'

async function uploadImageFile(image: File | null) {
  if (!image || image.size === 0) {
    return null
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured')
  }

  const safeFileName = image.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const blob = await put(`products/${Date.now()}-${safeFileName}`, image, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })

  return blob.url
}

async function ensureProductRelations({
  brandId,
  categoryId,
  sizeId,
  finishTypeId,
}: {
  brandId: string
  categoryId: string
  sizeId?: string | null
  finishTypeId?: string | null
}) {
  const [brand, category, size, finishType] = await Promise.all([
    prisma.brand.findUnique({ where: { id: brandId } }),
    prisma.category.findUnique({ where: { id: categoryId } }),
    sizeId ? prisma.size.findUnique({ where: { id: sizeId } }) : null,
    finishTypeId ? prisma.finishType.findUnique({ where: { id: finishTypeId } }) : null,
  ])

  if (!brand) {
    return { error: NextResponse.json({ error: 'Invalid brand', details: 'The selected brand does not exist' }, { status: 400 }) }
  }

  if (!category) {
    return { error: NextResponse.json({ error: 'Invalid category', details: 'The selected category does not exist' }, { status: 400 }) }
  }

  if (sizeId && !size) {
    return { error: NextResponse.json({ error: 'Invalid size', details: 'The selected size does not exist' }, { status: 400 }) }
  }

  if (finishTypeId && !finishType) {
    return { error: NextResponse.json({ error: 'Invalid finish type', details: 'The selected finish type does not exist' }, { status: 400 }) }
  }

  return { brand, category, size, finishType }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hasExplicitPagination = searchParams.has('page') || searchParams.has('limit')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || (hasExplicitPagination ? '25' : '1000'))
    const search = searchParams.get('search') || ''
    const brandId = searchParams.get('brandId') || undefined
    const categoryId = searchParams.get('categoryId') || undefined
    const sizeId = searchParams.get('sizeId') || undefined
    const isActive = searchParams.get('isActive')

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { brand: { is: { name: { contains: search, mode: 'insensitive' } } } },
        { category: { is: { name: { contains: search, mode: 'insensitive' } } } },
        { size: { is: { name: { contains: search, mode: 'insensitive' } } } },
        { finishType: { is: { name: { contains: search, mode: 'insensitive' } } } },
      ]
    }

    if (brandId) where.brandId = brandId
    if (categoryId) where.categoryId = categoryId
    if (sizeId) where.sizeId = sizeId
    if (isActive === null || isActive === undefined || isActive === '') {
      where.isActive = true
    } else {
      where.isActive = isActive === 'true'
    }

    const skip = (page - 1) * limit
    const totalCount = await prisma.product.count({ where })

    const products = await prisma.product.findMany({
      where,
      include: {
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        size: { select: { id: true, name: true } },
        finishType: { select: { id: true, name: true } },
        _count: { select: { batches: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(totalCount / limit)
    
    return NextResponse.json({
      products,
      totalCount,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    })
  } catch (error: any) {
    console.error('Products fetch error:', error)
    if (error.code === 'P2032' || error.message?.includes('null')) {
      return NextResponse.json({
        products: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        itemsPerPage: 25,
        hasNextPage: false,
        hasPreviousPage: false,
      })
    }
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const data = await request.json()
      const name = data.name?.trim()
      const code = data.code?.trim()
      const brandId = data.brandId
      const categoryId = data.categoryId
      const sizeId = data.sizeId || null
      const finishTypeId = data.finishTypeId || null
      const imageUrl = data.imageUrl || null
      const sqftPerBox = Number(data.sqftPerBox) || 1
      const pcsPerBox = Number(data.pcsPerBox) || 1

      if (!name || !code || !brandId || !categoryId || !finishTypeId) {
        return NextResponse.json({
          error: 'Missing required fields',
          details: 'Name, code, brand, category, and finish type are required'
        }, { status: 400 })
      }

      const relationCheck = await ensureProductRelations({ brandId, categoryId, sizeId, finishTypeId })
      if ('error' in relationCheck) {
        return relationCheck.error
      }

      // Check if product with same code already exists (only active ones)
      const existingProduct = await prisma.product.findFirst({
        where: { 
          code: { equals: code, mode: 'insensitive' },
          isActive: true
        }
      })

      if (existingProduct) {
        return NextResponse.json({
          error: 'Duplicate entry',
          details: 'A product with this code already exists'
        }, { status: 409 })
      }

      const product = await prisma.product.create({
        data: {
          name,
          code,
          brandId,
          categoryId,
          sizeId,
          finishTypeId,
          sqftPerBox,
          pcsPerBox,
          imageUrl,
        },
        include: {
          brand: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          size: { select: { id: true, name: true } },
          finishType: { select: { id: true, name: true } },
          _count: { select: { batches: true } }
        }
      })

      return NextResponse.json({ product }, { status: 201 })
    }

    const formData = await request.formData()
    const name = (formData.get('name') as string)?.trim()
    const code = (formData.get('code') as string)?.trim()
    const sizeId = (formData.get('sizeId') as string) || null
    const categoryId = formData.get('categoryId') as string
    const brandId = formData.get('brandId') as string
    const finishTypeId = (formData.get('finishTypeId') as string) || null
    const locationId = (formData.get('locationId') as string) || null
    const batchName = (formData.get('batchName') as string) || null
    const stock = (formData.get('stock') as string) || null
    const sqftPerBox = formData.get('sqftPerBox') as string
    const pcsPerBox = formData.get('pcsPerBox') as string
    const existingImageUrl = (formData.get('imageUrl') as string) || null
    const image = formData.get('image') as File | null

    if (!name || !code || !brandId || !categoryId) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: 'Name, code, brand, and category are required'
      }, { status: 400 })
    }

    const relationCheck = await ensureProductRelations({ brandId, categoryId, sizeId, finishTypeId })
    if ('error' in relationCheck) {
      return relationCheck.error
    }

    let imageUrl = existingImageUrl
    if (image && image.size > 0) {
      imageUrl = await uploadImageFile(image)
    }

    let actualFinishTypeId = finishTypeId
    if (!actualFinishTypeId) {
      const defaultFinishType = await prisma.finishType.findFirst({ where: { isActive: true } })
      if (!defaultFinishType) {
        return NextResponse.json({
          error: 'No finish type available',
          details: 'Please create a finish type first'
        }, { status: 400 })
      }
      actualFinishTypeId = defaultFinishType.id
    }

    // Check if product with same code already exists (only active ones)
    const existingProduct = await prisma.product.findFirst({
      where: { 
        code: { equals: code, mode: 'insensitive' },
        isActive: true
      }
    })

    if (existingProduct) {
      return NextResponse.json({
        error: 'Duplicate entry',
        details: 'A product with this code already exists'
      }, { status: 409 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        code,
        brandId,
        categoryId,
        sizeId,
        finishTypeId: actualFinishTypeId,
        sqftPerBox: parseFloat(sqftPerBox || '1') || 1,
        pcsPerBox: parseInt(pcsPerBox || '1') || 1,
        imageUrl,
      },
      include: {
        brand: true,
        category: true,
        size: true,
        finishType: true,
        batches: {
          include: {
            location: true
          }
        }
      }
    })

    if (locationId && batchName && stock) {
      const location = await prisma.location.findUnique({ where: { id: locationId } })
      if (!location) {
        return NextResponse.json({
          error: 'Invalid location',
          details: 'The selected location does not exist'
        }, { status: 400 })
      }

      const stockNum = parseInt(stock)
      if (isNaN(stockNum) || stockNum <= 0) {
        return NextResponse.json({
          error: 'Invalid stock quantity',
          details: 'Stock must be a positive number'
        }, { status: 400 })
      }

      await prisma.batch.create({
        data: {
          productId: product.id,
          locationId,
          batchNumber: batchName,
          quantity: stockNum,
          purchasePrice: 0,
          sellingPrice: 0,
        },
      })
    }

    return NextResponse.json({ product }, { status: 201 })
    
  } catch (error: any) {
    console.error('Product creation error:', error)
    console.error('Error stack:', error.stack)
    
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Duplicate entry',
        details: 'A product with this code already exists',
        field: error.meta?.target
      }, { status: 409 })
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Foreign key constraint failed',
        details: 'One or more selected references do not exist',
        field: error.meta?.field_name
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to create product', 
      message: error.message,
      code: error.code
    }, { status: 500 })
  }
}