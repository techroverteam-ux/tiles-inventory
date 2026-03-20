import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        }
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Category fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
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
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if name is already taken by another category in the same brand
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
        id: { not: id }
      }
    })

    if (duplicateCategory) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 400 }
      )
    }

    const category = await (prisma as any).category.update({
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

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Category update error:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
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
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Only active products should block deletion.
    const activeProductsCount = await prisma.product.count({
      where: {
        categoryId: id,
        isActive: true,
      },
    })

    if (activeProductsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with associated active products. Please remove them first.' },
        { status: 400 }
      )
    }

    await prisma.category.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Category deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}