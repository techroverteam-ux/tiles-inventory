import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { put } from '@vercel/blob'

async function uploadImageFile(image: File | null) {
  if (!image || image.size === 0) return null
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN is not configured')
  const safeFileName = image.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const blob = await put(`locations/${Date.now()}-${safeFileName}`, image, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
  return blob.url
}

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
    const contentType = request.headers.get('content-type') || ''
    const isMultipart = contentType.includes('multipart/form-data')
    const data = isMultipart ? Object.fromEntries((await request.formData()).entries()) : await request.json()
    const { name, address, isActive } = data as any
    const image = isMultipart ? (data as any).image as File | null : null
    const imageUrl = isMultipart ? await uploadImageFile(image) : (typeof (data as any).imageUrl === 'string' ? ((data as any).imageUrl || null) : undefined)

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
        ...(typeof imageUrl !== 'undefined' ? { imageUrl } : {}),
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
    requireAuth(request)
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

    await prisma.$transaction(async (tx) => {
      const batches = await tx.batch.findMany({
        where: { locationId: id },
        select: { id: true },
      })
      const batchIds = batches.map((batch) => batch.id)

      if (batchIds.length > 0) {
        await tx.salesItem.deleteMany({ where: { batchId: { in: batchIds } } })
      }
      await tx.purchaseItem.deleteMany({ where: { locationId: id } })
      await tx.batch.deleteMany({ where: { locationId: id } })
      await tx.location.delete({ where: { id } })
    })

    return NextResponse.json({ message: 'Location deleted successfully' })
  } catch (error: any) {
    console.error('Location deletion error:', error)
    if (error?.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    )
  }
}