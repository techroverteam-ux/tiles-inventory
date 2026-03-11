import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        brand: true,
        category: true,
        size: true,
        finishType: true,
        batches: {
          include: {
            location: true
          },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ products })
  } catch (error) {
    console.error('Products fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extract and validate required fields
    const name = formData.get('name') as string
    const code = formData.get('code') as string
    const sizeId = formData.get('sizeId') as string
    const categoryId = formData.get('categoryId') as string
    const brandId = formData.get('brandId') as string
    const finishTypeId = formData.get('finishTypeId') as string
    const locationId = formData.get('locationId') as string
    const batchName = formData.get('batchName') as string
    const stock = formData.get('stock') as string
    const sqftPerBox = formData.get('sqftPerBox') as string
    const pcsPerBox = formData.get('pcsPerBox') as string
    const image = formData.get('image') as File
    
    console.log('=== POST /api/products ===')
    console.log('Image file received:', image ? `${image.name} (${image.size} bytes)` : 'No image')
    console.log('Creating product with:', { 
      name, code, sizeId, categoryId, brandId, finishTypeId, 
      locationId, batchName, stock, sqftPerBox, pcsPerBox 
    })
    
    // Validate required fields
    if (!name || !code || !brandId || !categoryId) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Name, code, brand, and category are required'
      }, { status: 400 })
    }

    if (!locationId || !batchName || !stock) {
      return NextResponse.json({ 
        error: 'Missing inventory fields',
        details: 'Location, batch name, and stock quantity are required'
      }, { status: 400 })
    }

    // Validate numeric fields
    const stockNum = parseInt(stock)
    const sqftNum = parseFloat(sqftPerBox || '1')
    const pcsNum = parseInt(pcsPerBox || stock || '1')

    if (isNaN(stockNum) || stockNum <= 0) {
      return NextResponse.json({ 
        error: 'Invalid stock quantity',
        details: 'Stock must be a positive number'
      }, { status: 400 })
    }

    // Verify foreign key references exist
    const [brand, category, size] = await Promise.all([
      prisma.brand.findUnique({ where: { id: brandId } }),
      prisma.category.findUnique({ where: { id: categoryId } }),
      sizeId ? prisma.size.findUnique({ where: { id: sizeId } }) : null
    ])

    if (!brand) {
      return NextResponse.json({ 
        error: 'Invalid brand',
        details: 'The selected brand does not exist'
      }, { status: 400 })
    }

    if (!category) {
      return NextResponse.json({ 
        error: 'Invalid category',
        details: 'The selected category does not exist'
      }, { status: 400 })
    }

    if (sizeId && !size) {
      return NextResponse.json({ 
        error: 'Invalid size',
        details: 'The selected size does not exist'
      }, { status: 400 })
    }

    // Verify location exists
    const location = await prisma.location.findUnique({ where: { id: locationId } })
    if (!location) {
      return NextResponse.json({ 
        error: 'Invalid location',
        details: 'The selected location does not exist'
      }, { status: 400 })
    }
    
    // Handle image upload
    let imageUrl = null
    if (image && image.size > 0) {
      try {
        const bytes = await image.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const fileName = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const fs = require('fs')
        const path = require('path')
        const uploadPath = path.join(process.cwd(), 'public', 'uploads', fileName)
        
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true })
        }
        
        fs.writeFileSync(uploadPath, buffer)
        imageUrl = `/uploads/${fileName}`
      } catch (uploadError: any) {
        console.error('Image upload error:', uploadError)
        return NextResponse.json({ 
          error: 'Image upload failed',
          details: uploadError.message
        }, { status: 500 })
      }
    }

    // Get or validate finish type
    let actualFinishTypeId = finishTypeId || sizeId
    if (!actualFinishTypeId) {
      const finishType = await prisma.finishType.findFirst({
        where: { isActive: true }
      })
      if (!finishType) {
        return NextResponse.json({ 
          error: 'No finish type available',
          details: 'Please create a finish type first or select a size'
        }, { status: 400 })
      }
      actualFinishTypeId = finishType.id
    } else {
      // Verify finish type exists
      const finishType = await prisma.finishType.findUnique({ 
        where: { id: actualFinishTypeId } 
      })
      if (!finishType) {
        return NextResponse.json({ 
          error: 'Invalid finish type',
          details: 'The selected finish type does not exist'
        }, { status: 400 })
      }
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        code,
        brandId,
        categoryId,
        sizeId: sizeId || null,
        finishTypeId: actualFinishTypeId,
        sqftPerBox: sqftNum,
        pcsPerBox: pcsNum,
        imageUrl
      },
    })

    console.log('Product created with imageUrl:', product.imageUrl)

    // Create batch
    await prisma.batch.create({
      data: {
        productId: product.id,
        locationId,
        batchNumber: `${batchName}-${Date.now()}`,
        quantity: stockNum,
        purchasePrice: 0,
        sellingPrice: 0,
      },
    })

    console.log('Product created successfully:', product.id)
    return NextResponse.json(product, { status: 201 })
    
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