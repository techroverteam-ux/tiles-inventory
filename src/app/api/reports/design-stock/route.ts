import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId') || undefined
    const categoryId = searchParams.get('categoryId') || undefined
    const sizeId = searchParams.get('sizeId') || undefined
    const locationId = searchParams.get('locationId') || undefined

    const where: any = {
      isActive: true,
      quantity: { gt: 0 },
      ...(locationId ? { locationId } : {}),
      product: {
        isActive: true,
        ...(brandId ? { brandId } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(sizeId ? { sizeId } : {}),
      },
    }

    const batches = await prisma.batch.findMany({
      where,
      include: {
        product: {
          include: { brand: true, category: true, size: true },
        },
        location: true,
      },
      orderBy: [
        { product: { brand: { name: 'asc' } } },
        { product: { name: 'asc' } },
      ],
    })

    const brandMap: Record<string, { brandName: string; items: any[] }> = {}

    for (const batch of batches) {
      const brandName = batch.product.brand?.name || 'Unknown'
      if (!brandMap[brandName]) brandMap[brandName] = { brandName, items: [] }
      brandMap[brandName].items.push({
        productCode: batch.product.code,
        productName: batch.product.name,
        imageUrl: batch.product.imageUrl || batch.imageUrl || null,
        size: batch.product.size?.name || '',
        category: batch.product.category?.name || '',
        finish: batch.shade || '',
        quantity: batch.quantity,
        batchNumber: batch.batchNumber,
        location: batch.location?.name || '',
      })
    }

    const grandTotal = batches.reduce((sum, b) => sum + b.quantity, 0)

    return NextResponse.json({ brands: Object.values(brandMap), grandTotal })
  } catch (error) {
    console.error('Design stock report error:', error)
    return NextResponse.json({ error: 'Failed to fetch design stock report' }, { status: 500 })
  }
}
