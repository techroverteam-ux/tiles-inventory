import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// One-time cleanup: permanently delete all soft-deleted records (name contains _del_)
export async function POST(request: NextRequest) {
  try {
    // Delete brands with _del_ in name (no active products since they were checked before soft-delete)
    const brands = await prisma.brand.deleteMany({ where: { name: { contains: '_del_' } } })

    // For categories/sizes with _del_, unlink products first then delete
    const delCategories = await prisma.category.findMany({ where: { name: { contains: '_del_' } }, select: { id: true } })
    const delSizes = await prisma.size.findMany({ where: { name: { contains: '_del_' } }, select: { id: true } })
    const delCategoryIds = delCategories.map(c => c.id)
    const delSizeIds = delSizes.map(s => s.id)

    // Products with _del_ in code
    const products = await prisma.product.deleteMany({ where: { code: { contains: '_del_' } } })

    const categories = delCategoryIds.length > 0
      ? await prisma.category.deleteMany({ where: { id: { in: delCategoryIds } } })
      : { count: 0 }

    const sizes = delSizeIds.length > 0
      ? await prisma.size.deleteMany({ where: { id: { in: delSizeIds } } })
      : { count: 0 }

    return NextResponse.json({
      message: 'Cleanup complete',
      deleted: { brands: brands.count, categories: categories.count, sizes: sizes.count, products: products.count }
    })
  } catch (error: any) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
