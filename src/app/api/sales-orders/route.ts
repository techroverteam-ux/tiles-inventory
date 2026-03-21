import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : 1000
    const search = searchParams.get('search') || ''
    const brandId = searchParams.get('brandId') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: any = {
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const orders = await prisma.salesOrder.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: true,
                category: true,
                size: true,
              },
            },
            batch: {
              include: {
                location: true,
              },
            },
          },
        },
        createdBy: { select: { name: true } },
        updatedBy: { select: { name: true } },
      } as any,
      orderBy: {
        [sortBy]: sortOrder,
      },
      take: limit,
    })

    // Add brand info and batch number to each order
    const ordersWithBrand = (orders as any[]).map(order => ({
      ...order,
      brand: order.items[0]?.product?.brand || null,
      items: order.items.map((item: any) => ({
        ...item,
        batchNumber: item.batch?.batchNumber || 'N/A',
      })),
    }))

    return NextResponse.json({
      orders: ordersWithBrand,
    })
  } catch (error) {
    console.error('Sales orders fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const user = requireAuth(request)
    
    // Find or create product
    let product = await prisma.product.findFirst({
      where: {
        brandId: data.brandId,
        categoryId: data.categoryId,
        sizeId: data.sizeId,
      },
    })

    if (!product) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } })
      const size = await prisma.size.findUnique({ where: { id: data.sizeId } })
      const brand = await prisma.brand.findUnique({ where: { id: data.brandId } })

      product = await prisma.product.create({
        data: {
          name: `${brand?.name} ${category?.name} ${size?.name}`,
          code: `${brand?.name?.substring(0, 3).toUpperCase()}-${Date.now()}`,
          brandId: data.brandId,
          categoryId: data.categoryId,
          sizeId: data.sizeId,
          sqftPerBox: size?.length && size?.width ? (size.length * size.width) / 144 : 1,
          pcsPerBox: 1,
          isActive: true,
          createdById: user.userId,
          updatedById: user.userId,
        } as any,
      })
    }

    // Get or create a batch for this product at the specified location
    let batch = await prisma.batch.findFirst({
      where: {
        productId: product.id,
        locationId: data.locationId,
      },
    })

    if (!batch) {
      batch = await prisma.batch.create({
        data: {
          productId: product.id,
          locationId: data.locationId,
          batchNumber: data.batchNumber || `BATCH-${Date.now()}`,
          quantity: 0,
          purchasePrice: 0,
          sellingPrice: 0,
          createdById: user.userId,
          updatedById: user.userId,
        } as any,
      })
    } else if (data.batchName) {
      // Update batch number if provided
      batch = await prisma.batch.update({
        where: { id: batch.id },
        data: {
          batchNumber: data.batchName,
          updatedById: user.userId,
        } as any,
      })
    }

    const quantity = parseInt(data.quantity) || 0
    const amount = parseFloat(data.amount) || 0
    const unitPrice = quantity > 0 ? amount / quantity : 0

    // Log current batch quantity for debugging
    console.log(`Batch ${batch.id} current quantity: ${batch.quantity}, requested: ${quantity}`)

    // Check if batch has enough quantity (allow negative for manual inventory management)
    if (batch.quantity < quantity) {
      console.warn(`Warning: Insufficient stock. Available: ${batch.quantity}, Required: ${quantity}. Proceeding with negative inventory.`)
      // Optionally uncomment the line below to enforce stock validation:
      // return NextResponse.json(
      //   { error: `Insufficient stock. Available: ${batch.quantity}, Required: ${quantity}` },
      //   { status: 400 }
      // )
    }

    // Deduct quantity from batch when sold
    await prisma.batch.update({
      where: { id: batch.id },
      data: {
        quantity: {
          decrement: quantity,
        },
        updatedById: user.userId,
      } as any,
    })

    const order = await prisma.salesOrder.create({
      data: {
        orderNumber: data.orderNumber,
        customerName: 'Customer',
        orderDate: new Date(data.soldDate),
        status: 'DELIVERED',
        totalAmount: amount,
        discount: 0,
        finalAmount: amount,
        items: {
          create: [
            {
              productId: product.id,
              batchId: batch.id,
              quantity: quantity,
              unitPrice: unitPrice,
              totalPrice: amount,
              createdById: user.userId,
              updatedById: user.userId,
            } as any,
          ],
        },
        createdById: user.userId,
        updatedById: user.userId,
      } as any,
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: true,
                category: true,
                size: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Sales order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create sales order' },
      { status: 500 }
    )
  }
}