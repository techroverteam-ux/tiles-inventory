import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        }
      },
    })

    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ brand })
  } catch (error) {
    console.error('Brand fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brand' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    const { name, description, isActive } = data

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      )
    }

    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id }
    })

    if (!existingBrand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      )
    }

    // Check if name is already taken by another brand
    const duplicateBrand = await prisma.brand.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
        id: { not: id }
      }
    })

    if (duplicateBrand) {
      return NextResponse.json(
        { error: 'Brand name already exists' },
        { status: 400 }
      )
    }

    const brand = await (prisma as any).brand.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: Boolean(isActive),
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        }
      }
    })

    return NextResponse.json({ brand })
  } catch (error) {
    console.error('Brand update error:', error)
    return NextResponse.json(
      { error: 'Failed to update brand' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id }
    })

    if (!existingBrand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      )
    }

    // Only active products should block deleting a brand (as categories/sizes are now decoupled).
    const activeProductsCount = await prisma.product.count({
      where: {
        brandId: id,
        isActive: true,
      },
    })

    if (activeProductsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete brand with associated active products. Please remove them first.' },
        { status: 400 }
      )
    }

    await prisma.brand.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ message: 'Brand deleted successfully' })
  } catch (error) {
    console.error('Brand deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete brand' },
      { status: 500 }
    )
  }
}