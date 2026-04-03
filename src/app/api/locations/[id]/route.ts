import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        updatedBy: { select: { name: true } },
        _count: {
          select: {
            batches: true,
          },
        }
      } as any,
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ location })
  } catch (error) {
    console.error('Location fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch location' },
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
    const { name, address, isActive } = data

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Location name is required' },
        { status: 400 }
      )
    }

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id }
    })

    if (!existingLocation) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    // Check if name is already taken by another location (including inactive ones)
    const duplicateLocation = await prisma.location.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
        id: { not: id }
      }
    })

    const user = requireAuth(request)

    if (duplicateLocation) {
      if (duplicateLocation.isActive) {
        return NextResponse.json(
          { error: 'Location name already exists' },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { error: 'Location name already exists as an inactive location. Please reactivate it instead.' },
          { status: 400 }
        )
      }
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        isActive: Boolean(isActive),
        updatedById: user.userId,
        updatedAt: new Date()
      } as any,
      include: {
        createdBy: { select: { name: true } },
        updatedBy: { select: { name: true } },
        _count: {
          select: {
            batches: true,
          },
        }
      } as any
    })

    return NextResponse.json({ location })
  } catch (error) {
    console.error('Location update error:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
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
    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id }
    })

    if (!existingLocation) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    // Cascade-delete all batches and purchase items linked to this location, then delete
    await prisma.purchaseItem.deleteMany({ where: { locationId: id } })
    await prisma.batch.deleteMany({ where: { locationId: id } })

    await prisma.location.delete({ where: { id } })

    return NextResponse.json({ message: 'Location deleted successfully' })
  } catch (error) {
    console.error('Location deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    )
  }
}