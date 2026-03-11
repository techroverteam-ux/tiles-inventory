import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const categoryId = searchParams.get('categoryId')

    const where: any = {
      isActive: true,
      ...(brandId && { brandId }),
      ...(categoryId && { categoryId }),
    }

    const sizes = await prisma.size.findMany({
      where,
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ sizes })
  } catch (error) {
    console.error('Sizes fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch sizes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const size = await prisma.size.create({
      data: {
        name: data.name,
        length: parseFloat(data.length),
        width: parseFloat(data.width),
        brandId: data.brandId,
        categoryId: data.categoryId,
      },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    })

    return NextResponse.json(size, { status: 201 })
  } catch (error) {
    console.error('Size creation error:', error)
    return NextResponse.json({ error: 'Failed to create size' }, { status: 500 })
  }
}
