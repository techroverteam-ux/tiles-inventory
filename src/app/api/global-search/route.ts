import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_LIMIT = 6

interface GlobalSearchResult {
  type: string
  label: string
  href: string
  subtitle?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = (searchParams.get('q') || '').trim()
    const parsedLimit = parseInt(searchParams.get('limit') || `${DEFAULT_LIMIT}`, 10)
    const limit = Number.isNaN(parsedLimit) ? DEFAULT_LIMIT : Math.min(Math.max(parsedLimit, 1), 10)

    if (query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const contains = { contains: query, mode: 'insensitive' as const }

    const [brands, categories, sizes, products, purchaseOrders, salesOrders] = await Promise.all([
      prisma.brand.findMany({
        where: { isActive: true, OR: [{ name: contains }, { description: contains }] },
        select: { id: true, name: true },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.category.findMany({
        where: { isActive: true, OR: [{ name: contains }, { description: contains }] },
        select: { id: true, name: true, brand: { select: { name: true } } },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.size.findMany({
        where: { isActive: true, OR: [{ name: contains }, { description: contains }] },
        select: { id: true, name: true, category: { select: { name: true } } },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: contains },
            { code: contains },
            { description: contains }
          ]
        },
        select: {
          id: true,
          name: true,
          code: true,
          brand: { select: { name: true } },
          category: { select: { name: true } }
        },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.purchaseOrder.findMany({
        where: {
          OR: [
            { orderNumber: contains },
            { notes: contains }
          ]
        },
        select: { id: true, orderNumber: true },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.salesOrder.findMany({
        where: {
          OR: [
            { orderNumber: contains },
            { customerName: contains },
            { customerPhone: contains }
          ]
        },
        select: { id: true, orderNumber: true },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      })
    ])

    const results: GlobalSearchResult[] = [
      ...brands.map((item) => ({ type: 'Brand', label: item.name, href: '/brands', subtitle: 'Brand' })),
      ...categories.map((item) => ({
        type: 'Category',
        label: item.name,
        href: '/categories',
        subtitle: item.brand?.name ? `Brand: ${item.brand.name}` : 'Category'
      })),
      ...sizes.map((item) => ({
        type: 'Size',
        label: item.name,
        href: '/sizes',
        subtitle: item.category?.name ? `Category: ${item.category.name}` : 'Size'
      })),
      ...products.map((item) => ({
        type: 'Product',
        label: item.code ? `${item.name} (${item.code})` : item.name,
        href: '/products',
        subtitle: [item.brand?.name, item.category?.name].filter(Boolean).join(' - ') || 'Product'
      })),
      ...purchaseOrders.map((item) => ({
        type: 'Purchase Order',
        label: item.orderNumber,
        href: '/purchase-orders',
        subtitle: 'Purchase order'
      })),
      ...salesOrders.map((item) => ({
        type: 'Sales Order',
        label: item.orderNumber,
        href: '/sales-orders',
        subtitle: 'Sales order'
      }))
    ].slice(0, 30)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Global search error:', error)
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
