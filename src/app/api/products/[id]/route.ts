import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { requireAuth } from '@/lib/auth'

async function uploadImageFile(image: File | null) {
  if (!image || image.size === 0) return null
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN is not configured')
  const safeFileName = image.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const blob = await put(`products/${Date.now()}-${safeFileName}`, image, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
  return blob.url
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const data = await request.json()
      const user = requireAuth(request)
      const name = data.name?.trim()
      const brandId = data.brandId
      const categoryId = data.categoryId
      const sizeId = data.sizeId || null

      if (!name || !brandId || !categoryId) {
        return NextResponse.json({ error: 'Missing required fields', details: 'Name, brand, and category are required' }, { status: 400 })
      }

      const updateData: any = {
        name, brandId, categoryId, sizeId,
        sqftPerBox: Number(data.sqftPerBox) || 1,
        pcsPerBox: Number(data.pcsPerBox) || 1,
        updatedById: user.userId,
      }
      if (typeof data.imageUrl === 'string') updateData.imageUrl = data.imageUrl || null

      const product = await prisma.product.update({ where: { id }, data: updateData })
      return NextResponse.json({ product })
    }

    const formData = await request.formData()
    const user = requireAuth(request)
    const name = (formData.get('name') as string)?.trim()
    const brandId = formData.get('brandId') as string
    const categoryId = formData.get('categoryId') as string
    const sizeId = (formData.get('sizeId') as string) || null
    const stock = formData.get('stock') as string
    const pcsPerBox = formData.get('pcsPerBox') as string
    const sqftPerBox = formData.get('sqftPerBox') as string
    const image = formData.get('image') as File | null

    if (!name || !brandId || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields', details: 'Name, brand, and category are required' }, { status: 400 })
    }

    const imageUrl = await uploadImageFile(image)
    const updateData: any = {
      name, brandId, categoryId, sizeId,
      sqftPerBox: parseFloat(sqftPerBox || '1') || 1,
      pcsPerBox: parseInt(pcsPerBox || stock || '1') || 1,
      updatedById: user.userId,
    }
    if (imageUrl) updateData.imageUrl = imageUrl

    const product = await prisma.product.update({ where: { id }, data: updateData })
    return NextResponse.json(product)

  } catch (error: any) {
    console.error('Product update error:', error)
    if (error.code === 'P2025') return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to update product', message: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Product delete error:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
