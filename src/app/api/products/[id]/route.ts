import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const formData = await request.formData()
    
    console.log('Update product ID:', id)
    console.log('FormData entries:', Array.from(formData.entries()))
    
    // Extract fields
    const name = formData.get('name') as string
    const code = formData.get('code') as string
    const brandId = formData.get('brandId') as string
    const categoryId = formData.get('categoryId') as string
    const sizeId = formData.get('sizeId') as string
    const finishTypeId = formData.get('finishTypeId') as string
    const stock = formData.get('stock') as string
    const sqftPerBox = formData.get('sqftPerBox') as string
    const image = formData.get('image') as File
    
    console.log('Image file received:', image ? `${image.name} (${image.size} bytes)` : 'No image')
    
    // Validate required fields
    if (!name || !code || !brandId || !categoryId || !stock) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Name, code, brand, category, and stock are required'
      }, { status: 400 })
    }

    // Validate numeric fields
    const stockNum = parseInt(stock)
    const sqftNum = parseFloat(sqftPerBox || '1')

    if (isNaN(stockNum) || stockNum <= 0) {
      return NextResponse.json({ 
        error: 'Invalid stock quantity',
        details: 'Stock must be a positive number'
      }, { status: 400 })
    }

    // Verify foreign keys exist
    const [brand, category, size] = await Promise.all([
      prisma.brand.findUnique({ where: { id: brandId } }),
      prisma.category.findUnique({ where: { id: categoryId } }),
      sizeId ? prisma.size.findUnique({ where: { id: sizeId } }) : null
    ])

    if (!brand) {
      return NextResponse.json({ 
        error: 'Invalid brand',
        details: 'The selected brand does not exist'
      }, { status: 400 })
    }

    if (!category) {
      return NextResponse.json({ 
        error: 'Invalid category',
        details: 'The selected category does not exist'
      }, { status: 400 })
    }

    if (sizeId && !size) {
      return NextResponse.json({ 
        error: 'Invalid size',
        details: 'The selected size does not exist'
      }, { status: 400 })
    }

    // Handle image upload
    let imageUrl = null
    if (image && image.size > 0) {
      try {
        const bytes = await image.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const fileName = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const fs = require('fs')
        const path = require('path')
        const uploadPath = path.join(process.cwd(), 'public', 'uploads', fileName)
        
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true })
        }
        
        fs.writeFileSync(uploadPath, buffer)
        imageUrl = `/uploads/${fileName}`
        console.log('Image uploaded:', imageUrl)
      } catch (uploadError: any) {
        console.error('Image upload error:', uploadError)
        return NextResponse.json({ 
          error: 'Image upload failed',
          details: uploadError.message
        }, { status: 500 })
      }
    }

    // Handle finishTypeId - use provided finishTypeId or sizeId, or keep existing
    let actualFinishTypeId = finishTypeId || sizeId
    
    if (actualFinishTypeId) {
      // Verify the finishTypeId exists
      const finishType = await prisma.finishType.findUnique({ 
        where: { id: actualFinishTypeId } 
      })
      
      if (!finishType) {
        // If the ID doesn't exist as a finish type, get a default one
        const defaultFinishType = await prisma.finishType.findFirst({
          where: { isActive: true }
        })
        
        if (!defaultFinishType) {
          return NextResponse.json({ 
            error: 'No finish type available',
            details: 'Please create a finish type first'
          }, { status: 400 })
        }
        
        actualFinishTypeId = defaultFinishType.id
      }
    } else {
      // No finishTypeId provided, keep the existing one (don't update it)
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

    // Build update data
    const updateData: any = {
      name,
      code,
      brandId,
      categoryId,
      sizeId: sizeId || null,
      finishTypeId: actualFinishTypeId,
      sqftPerBox: sqftNum,
      pcsPerBox: stockNum,
    }
    
    // Only update imageUrl if a new image was uploaded
    if (imageUrl) {
      updateData.imageUrl = imageUrl
    }
    
    console.log('Update data:', updateData)
    
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