import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { requireAuth } from '@/lib/auth'

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
      const user = requireAuth(request)
      const name = data.name?.trim()
      const code = data.code?.trim()
      const brandId = data.brandId
      const categoryId = data.categoryId
      const sizeId = data.sizeId || null

      if (!name || !code || !brandId || !categoryId) {
        return NextResponse.json({
          error: 'Missing required fields',
          details: 'Name, code, brand, and category are required'
        }, { status: 400 })
      }

      const updateData: any = {
        name,
        code,
        brandId,
        categoryId,
        sizeId,
        sqftPerBox: Number(data.sqftPerBox) || 1,
        pcsPerBox: Number(data.pcsPerBox) || 1,
        updatedById: user.userId,
      }

      if (typeof data.imageUrl === 'string') {
        updateData.imageUrl = data.imageUrl || null
      }

      // Check if code is already taken by another product (including inactive ones)
      const duplicateProduct = await prisma.product.findFirst({
        where: {
          code: { equals: code, mode: 'insensitive' },
          id: { not: id }
        }
      })

      if (duplicateProduct) {
        if (duplicateProduct.isActive) {
          return NextResponse.json({
            error: 'Duplicate entry',
            details: 'A product with this code already exists'
          }, { status: 409 })
        } else {
          // Rename the inactive duplicate to free up the code
          await prisma.product.update({
            where: { id: duplicateProduct.id },
            data: { 
              code: `${duplicateProduct.code}_deleted_${Date.now()}`,
              updatedAt: new Date()
            }
          })
        }
      }

      const product = await prisma.product.update({
        where: { id },
        data: updateData,
      })

      return NextResponse.json({ product })
    }

    const formData = await request.formData()
    const user = requireAuth(request)
    const name = (formData.get('name') as string)?.trim()
    const code = (formData.get('code') as string)?.trim()
    const brandId = formData.get('brandId') as string
    const categoryId = formData.get('categoryId') as string
    const sizeId = (formData.get('sizeId') as string) || null
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

    const updateData: any = {
      name,
      code,
      brandId,
      categoryId,
      sizeId,
      sqftPerBox: parseFloat(sqftPerBox || '1') || 1,
      pcsPerBox: parseInt(pcsPerBox || stock || '1') || 1,
      updatedById: user.userId,
    }

    if (imageUrl) {
      updateData.imageUrl = imageUrl
    }

    // Check if code is already taken by another product (including inactive ones)
    const duplicateProduct = await prisma.product.findFirst({
      where: {
        code: { equals: code, mode: 'insensitive' },
        id: { not: id }
      }
    })

    if (duplicateProduct) {
      if (duplicateProduct.isActive) {
        return NextResponse.json({
          error: 'Duplicate entry',
          details: 'A product with this code already exists'
        }, { status: 409 })
      } else {
        // Rename the inactive duplicate to free up the code
        await prisma.product.update({
          where: { id: duplicateProduct.id },
          data: { 
            code: `${duplicateProduct.code}_deleted_${Date.now()}`,
            updatedAt: new Date()
          }
        })
      }
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
    const product = await prisma.product.findUnique({ where: { id }, select: { code: true } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    await prisma.product.update({
      where: { id },
      data: { 
        code: `${product.code}_del_${Date.now()}`,
        isActive: false,
        updatedAt: new Date()
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Product delete error:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}