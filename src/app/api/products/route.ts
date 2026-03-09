import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        brand: true,
        category: true,
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
    const name = formData.get('name') as string
    const code = formData.get('code') as string
    const sizeId = formData.get('sizeId') as string
    const categoryId = formData.get('categoryId') as string
    const brandId = formData.get('brandId') as string
    const locationId = formData.get('locationId') as string
    const batchName = formData.get('batchName') as string
    const stock = formData.get('stock') as string
    const image = formData.get('image') as File
    
    let imageUrl = null
    if (image) {
      // Save image to public folder
      const bytes = await image.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const fileName = `${Date.now()}-${image.name}`
      const fs = require('fs')
      const path = require('path')
      const uploadPath = path.join(process.cwd(), 'public', 'uploads', fileName)
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }
      
      fs.writeFileSync(uploadPath, buffer)
      imageUrl = `/uploads/${fileName}`
    }

    const product = await prisma.product.create({
      data: {
        name,
        code,
        brandId,
        categoryId,
        finishTypeId: sizeId,
        length: 12,
        width: 12,
        sqftPerBox: 1,
        pcsPerBox: parseInt(stock),
        imageUrl
      },
    })

    // Create batch with location
    if (locationId && batchName) {
      await prisma.batch.create({
        data: {
          productId: product.id,
          locationId,
          batchNumber: `${batchName}-${Date.now()}`,
          quantity: parseInt(stock),
          purchasePrice: 0,
          sellingPrice: 0,
        },
      })
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}