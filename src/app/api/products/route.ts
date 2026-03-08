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
    const data = await request.json()
    
    const product = await prisma.product.create({
      data: {
        name: data.name,
        code: data.code,
        brandId: data.brandId,
        categoryId: data.categoryId,
        finishTypeId: data.sizeId,
        length: 12,
        width: 12,
        sqftPerBox: 1,
        pcsPerBox: parseInt(data.stock),
      },
    })

    // Create batch with location
    if (data.locationId && data.batchName) {
      await prisma.batch.create({
        data: {
          productId: product.id,
          locationId: data.locationId,
          batchNumber: `${data.batchName}-${Date.now()}`,
          quantity: parseInt(data.stock),
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