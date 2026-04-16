import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// One-time cleanup: permanently delete all soft-deleted records (name contains _del_)
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const brands = await tx.brand.deleteMany({ where: { name: { contains: '_del_' } } })

      const delCategories = await tx.category.findMany({ where: { name: { contains: '_del_' } }, select: { id: true } })
      const delSizes = await tx.size.findMany({ where: { name: { contains: '_del_' } }, select: { id: true } })
      const delCategoryIds = delCategories.map((c) => c.id)
      const delSizeIds = delSizes.map((s) => s.id)

      const products = await tx.product.deleteMany({ where: { code: { contains: '_del_' } } })

      const categories = delCategoryIds.length > 0
        ? await tx.category.deleteMany({ where: { id: { in: delCategoryIds } } })
        : { count: 0 }

      const sizes = delSizeIds.length > 0
        ? await tx.size.deleteMany({ where: { id: { in: delSizeIds } } })
        : { count: 0 }

      return { brands, categories, sizes, products }
    })

    return NextResponse.json({
      message: 'Cleanup complete',
      deleted: {
        brands: result.brands.count,
        categories: result.categories.count,
        sizes: result.sizes.count,
        products: result.products.count,
      }
    })
  } catch (error: any) {
    console.error('Cleanup error:', error)
    if (error?.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
