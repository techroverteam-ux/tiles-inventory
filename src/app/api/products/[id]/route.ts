import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'

async function uploadImageFile(image: File | null) {
  if (!image || image.size === 0) {
    return null
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured')
  }

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
      const name = data.name?.trim()
      const code = data.code?.trim()
      const brandId = data.brandId
      const categoryId = data.categoryId
      const sizeId = data.sizeId || null
      const finishTypeId = data.finishTypeId || null

      if (!name || !code || !brandId || !categoryId || !finishTypeId) {
        return NextResponse.json({
          error: 'Missing required fields',
          details: 'Name, code, brand, category, and finish type are required'
        }, { status: 400 })
      }

      const updateData: any = {
        name,
        code,
        brandId,
        categoryId,
        sizeId,
        finishTypeId,
        sqftPerBox: Number(data.sqftPerBox) || 1,
        pcsPerBox: Number(data.pcsPerBox) || 1,
      }

      if (typeof data.imageUrl === 'string') {
        updateData.imageUrl = data.imageUrl || null
      }

      const product = await prisma.product.update({
        where: { id },
        data: updateData,
      })

      return NextResponse.json({ product })
    }

    const formData = await request.formData()
    const name = (formData.get('name') as string)?.trim()
    const code = (formData.get('code') as string)?.trim()
    const brandId = formData.get('brandId') as string
    const categoryId = formData.get('categoryId') as string
    const sizeId = (formData.get('sizeId') as string) || null
    const finishTypeId = (formData.get('finishTypeId') as string) || null
    const stock = formData.get('stock') as string
    const pcsPerBox = formData.get('pcsPerBox') as string
    const sqftPerBox = formData.get('sqftPerBox') as string
    const image = formData.get('image') as File | null

    if (!name || !code || !brandId || !categoryId) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: 'Name, code, brand, and category are required'
      }, { status: 400 })
    }

    let imageUrl = await uploadImageFile(image)

    let actualFinishTypeId = finishTypeId
    if (!actualFinishTypeId) {
      const existingProduct = await prisma.product.findUnique({
        where: { id },
        select: { finishTypeId: true }
      })

      if (!existingProduct) {
        return NextResponse.json({
          error: 'Product not found',
          details: 'The product you are trying to update does not exist'
        }, { status: 404 })
      }

      actualFinishTypeId = existingProduct.finishTypeId
    }

    const updateData: any = {
      name,
      code,
      brandId,
      categoryId,
      sizeId,
      finishTypeId: actualFinishTypeId,
      sqftPerBox: parseFloat(sqftPerBox || '1') || 1,
      pcsPerBox: parseInt(pcsPerBox || stock || '1') || 1,
    }

    if (imageUrl) {
      updateData.imageUrl = imageUrl
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    })
    
    console.log('Product updated successfully:', product.id)
    console.log('Product imageUrl:', product.imageUrl)
    return NextResponse.json(product)
    
  } catch (error: any) {
    console.error('Product update error:', error)
    console.error('Error stack:', error.stack)
    
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Duplicate entry',
        details: 'A product with this code already exists',
        field: error.meta?.target
      }, { status: 409 })
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Foreign key constraint failed',
        details: 'One or more selected references do not exist',
        field: error.meta?.field_name
      }, { status: 400 })
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: 'Product not found',
        details: 'The product you are trying to update does not exist'
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to update product',
      message: error.message,
      code: error.code
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Product delete error:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}