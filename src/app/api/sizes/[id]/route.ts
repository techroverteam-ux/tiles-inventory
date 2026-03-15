import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const size = await prisma.size.findUnique({
      where: { id },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
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
    const { name, description, length, width, brandId, categoryId, isActive } = data

    // Validate required fields
    if (!name || !name.trim() || !brandId || !categoryId) {
      return NextResponse.json(
        { error: 'Size name, brand, and category are required' },
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

    // Check if name is already taken by another size in the same brand and category
    const duplicateSize = await prisma.size.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
        brandId: brandId,
        categoryId: categoryId,
        id: { not: id }
      }
    })

    if (duplicateSize) {
      return NextResponse.json(
        { error: 'Size name already exists for this brand and category' },
        { status: 400 }
      )
    }

    const authUser = getAuthUser(request)
    let updatedByName: string | null = null
    if (authUser?.userId) {
      const user = await prisma.user.findUnique({ where: { id: authUser.userId }, select: { name: true, email: true } })
      updatedByName = user?.name || user?.email || null
    }

    const size = await (prisma as any).size.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        length: length ? parseFloat(length) : null,
        width: width ? parseFloat(width) : null,
        brandId: brandId,
        categoryId: categoryId,
        isActive: Boolean(isActive),
        updatedAt: new Date(),
        ...(updatedByName ? { updatedByName } : {}),
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
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
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        }
      }
    })

    if (!existingSize) {
      return NextResponse.json(
        { error: 'Size not found' },
        { status: 404 }
      )
    }

    // Check if size has associated products
    if (existingSize._count.products > 0) {
      return NextResponse.json(
        { error: 'Cannot delete size with associated products. Please remove them first.' },
        { status: 400 }
      )
    }

    await prisma.size.delete({
      where: { id }
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