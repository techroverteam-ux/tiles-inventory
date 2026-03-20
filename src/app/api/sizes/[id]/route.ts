import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const size = await prisma.size.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        }
      },
    })

    if (!size) {
      return NextResponse.json(
        { error: 'Size not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ size })
  } catch (error) {
    console.error('Size fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch size' },
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
    const { name, description, length, width, isActive } = data

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Size name is required' },
        { status: 400 }
      )
    }

    // Check if size exists
    const existingSize = await prisma.size.findUnique({
      where: { id }
    })

    if (!existingSize) {
      return NextResponse.json(
        { error: 'Size not found' },
        { status: 404 }
      )
    }

    // Check if name is already taken by another size (including inactive ones)
    const duplicateSize = await prisma.size.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
        id: { not: id }
      }
    })

    if (duplicateSize) {
      if (duplicateSize.isActive) {
        return NextResponse.json(
          { error: 'Size name already exists' },
          { status: 400 }
        )
      } else {
        // Rename the inactive duplicate to free up the name
        await prisma.size.update({
          where: { id: duplicateSize.id },
          data: { 
            name: `${duplicateSize.name}_deleted_${Date.now()}`,
            updatedAt: new Date()
          }
        })
      }
    }

    const size = await (prisma as any).size.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        length: length ? parseFloat(length) : null,
        width: width ? parseFloat(width) : null,
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

    return NextResponse.json({ size })
  } catch (error) {
    console.error('Size update error:', error)
    return NextResponse.json(
      { error: 'Failed to update size' },
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
    // Check if size exists
    const existingSize = await prisma.size.findUnique({
      where: { id }
    })

    if (!existingSize) {
      return NextResponse.json(
        { error: 'Size not found' },
        { status: 404 }
      )
    }

    // Only active products should block deleting a size.
    const activeProductsCount = await prisma.product.count({
      where: {
        sizeId: id,
        isActive: true,
      },
    })

    if (activeProductsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete size with associated products. Please remove them first.' },
        { status: 400 }
      )
    }

    await prisma.size.update({
      where: { id },
      data: {
        name: `${existingSize.name}_del_${Date.now()}`,
        isActive: false,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ message: 'Size deleted successfully' })
  } catch (error) {
    console.error('Size deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete size' },
      { status: 500 }
    )
  }
}