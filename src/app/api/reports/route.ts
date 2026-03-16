import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type ReportType = 'sales' | 'purchase' | 'inventory'

function parseDateRange(dateFrom: string | null, dateTo: string | null) {
  if (!dateFrom || !dateTo) return null

  const from = new Date(dateFrom)
  const to = new Date(dateTo)
  to.setHours(23, 59, 59, 999)

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null
  return { gte: from, lte: to }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = (searchParams.get('reportType') || 'sales') as ReportType

    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const brandId = searchParams.get('brandId') || undefined
    const categoryId = searchParams.get('categoryId') || undefined
    const sizeId = searchParams.get('sizeId') || undefined
    const locationId = searchParams.get('locationId') || undefined

    const dateRange = parseDateRange(dateFrom, dateTo)

    if (!['sales', 'purchase', 'inventory'].includes(reportType)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    if (reportType === 'sales') {
      const where: any = {
        ...(dateRange ? { orderDate: dateRange } : {}),
        items: {
          some: {
            ...(brandId || categoryId || sizeId
              ? {
                  product: {
                    ...(brandId ? { brandId } : {}),
                    ...(categoryId ? { categoryId } : {}),
                    ...(sizeId ? { sizeId } : {}),
                  },
                }
              : {}),
            ...(locationId ? { batch: { locationId } } : {}),
          },
        },
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
        },
        orderBy: { orderDate: 'desc' },
      })

      const rows = orders.flatMap(order =>
        order.items.map(item => ({
          orderNumber: order.orderNumber,
          date: order.orderDate,
          brand: item.product.brand?.name || '',
          category: item.product.category?.name || '',
          size: item.product.size?.name || '',
          location: item.batch?.location?.name || '',
          batchNumber: item.batch?.batchNumber || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalAmount: item.totalPrice,
        }))
      )

      return NextResponse.json({
        reportType,
        columns: [
          { key: 'orderNumber', label: 'Order #' },
          { key: 'date', label: 'Date' },
          { key: 'brand', label: 'Brand' },
          { key: 'category', label: 'Category' },
          { key: 'size', label: 'Size' },
          { key: 'location', label: 'Location' },
          { key: 'batchNumber', label: 'Batch' },
          { key: 'quantity', label: 'Qty' },
          { key: 'unitPrice', label: 'Unit Price' },
          { key: 'totalAmount', label: 'Total Amount' },
        ],
        rows,
      })
    }

    if (reportType === 'purchase') {
      const where: any = {
        ...(dateRange ? { orderDate: dateRange } : {}),
        ...(brandId ? { brandId } : {}),
        items: {
          some: {
            ...(categoryId || sizeId
              ? {
                  product: {
                    ...(categoryId ? { categoryId } : {}),
                    ...(sizeId ? { sizeId } : {}),
                  },
                }
              : {}),
            ...(locationId ? { locationId } : {}),
          },
        },
      }

      const orders = await prisma.purchaseOrder.findMany({
        where,
        include: {
          brand: true,
          items: {
            include: {
              product: {
                include: {
                  category: true,
                  size: true,
                },
              },
              location: true,
            },
          },
        },
        orderBy: { orderDate: 'desc' },
      })

      const rows = orders.flatMap(order =>
        order.items.map(item => ({
          orderNumber: order.orderNumber,
          date: order.orderDate,
          brand: order.brand?.name || '',
          category: item.product?.category?.name || '',
          size: item.product?.size?.name || '',
          location: item.location?.name || '',
          batchNumber: item.batchNumber || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalAmount: item.totalPrice,
          status: order.status,
        }))
      )

      return NextResponse.json({
        reportType,
        columns: [
          { key: 'orderNumber', label: 'Order #' },
          { key: 'date', label: 'Date' },
          { key: 'brand', label: 'Brand' },
          { key: 'category', label: 'Category' },
          { key: 'size', label: 'Size' },
          { key: 'location', label: 'Location' },
          { key: 'batchNumber', label: 'Batch' },
          { key: 'quantity', label: 'Qty' },
          { key: 'unitPrice', label: 'Unit Price' },
          { key: 'totalAmount', label: 'Total Amount' },
          { key: 'status', label: 'Status' },
        ],
        rows,
      })
    }

    const where: any = {
      ...(dateRange ? { createdAt: dateRange } : {}),
      ...(locationId ? { locationId } : {}),
      ...(brandId || categoryId || sizeId
        ? {
            product: {
              ...(brandId ? { brandId } : {}),
              ...(categoryId ? { categoryId } : {}),
              ...(sizeId ? { sizeId } : {}),
            },
          }
        : {}),
    }

    const batches = await prisma.batch.findMany({
      where,
      include: {
        product: {
          include: {
            brand: true,
            category: true,
            size: true,
          },
        },
        location: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const rows = batches.map(batch => ({
      date: batch.createdAt,
      productCode: batch.product?.code || '',
      product: batch.product?.name || '',
      brand: batch.product?.brand?.name || '',
      category: batch.product?.category?.name || '',
      size: batch.product?.size?.name || '',
      location: batch.location?.name || '',
      batchNumber: batch.batchNumber,
      quantity: batch.quantity,
      purchasePrice: batch.purchasePrice || 0,
      sellingPrice: batch.sellingPrice || 0,
      stockValue: (batch.sellingPrice || 0) * batch.quantity,
    }))

    return NextResponse.json({
      reportType,
      columns: [
        { key: 'date', label: 'Date' },
        { key: 'productCode', label: 'Product Code' },
        { key: 'product', label: 'Product' },
        { key: 'brand', label: 'Brand' },
        { key: 'category', label: 'Category' },
        { key: 'size', label: 'Size' },
        { key: 'location', label: 'Location' },
        { key: 'batchNumber', label: 'Batch' },
        { key: 'quantity', label: 'Qty' },
        { key: 'purchasePrice', label: 'Purchase Price' },
        { key: 'sellingPrice', label: 'Selling Price' },
        { key: 'stockValue', label: 'Stock Value' },
      ],
      rows,
    })
  } catch (error) {
    console.error('Reports fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch report data' }, { status: 500 })
  }
}
