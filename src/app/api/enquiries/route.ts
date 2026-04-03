import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { 
      productId, 
      name, 
      email, 
      phone, 
      quantity, 
      message 
    } = data

    // Validate required fields
    if (!productId || !name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        category: true,
        size: true
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // For now, we'll just return success without creating a database record
    // since we don't have an enquiry model in the schema yet
    
    // You can add email notification logic here
    console.log('New enquiry received:', {
      product: product.name,
      customer: name,
      email,
      phone,
      quantity,
      message
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Enquiry submitted successfully' 
    })

  } catch (error) {
    console.error('Enquiry submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit enquiry' },
      { status: 500 }
    )
  }
}