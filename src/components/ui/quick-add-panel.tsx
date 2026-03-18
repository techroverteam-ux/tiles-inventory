'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Package, ShoppingCart, TrendingUp, Users, Palette, Ruler, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

const quickAddLinks = [
  { title: 'Brand', subtitle: 'Create a new brand', href: '/brands?action=create', icon: Users, color: 'text-primary' },
  { title: 'Category', subtitle: 'Create a new category', href: '/categories?action=create', icon: Palette, color: 'text-primary' },
  { title: 'Size', subtitle: 'Create a new size', href: '/sizes?action=create', icon: Ruler, color: 'text-primary' },
  { title: 'Product', subtitle: 'Create a new product', href: '/products?action=create', icon: Package, color: 'text-primary' },
  { title: 'Location', subtitle: 'Create a new location', href: '/locations?action=create', icon: MapPin, color: 'text-primary' },
  { title: 'Purchase Order', subtitle: 'Create purchase order', href: '/purchase-orders?action=create', icon: ShoppingCart, color: 'text-primary' },
  { title: 'Sales Order', subtitle: 'Create sales order', href: '/sales-orders?action=create', icon: TrendingUp, color: 'text-primary' },
]

export function QuickAddPanel() {
  const [open, setOpen] = useState(false)

  const groupedLinks = useMemo(() => {
    const midpoint = Math.ceil(quickAddLinks.length / 2)
    return [quickAddLinks.slice(0, midpoint), quickAddLinks.slice(midpoint)]
  }, [])

  return (
    <div className="relative hidden sm:block">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        className="text-xs px-3 py-2 border-border text-foreground hover:bg-accent"
      >
        <Plus className="h-4 w-4 mr-1" />
        <span className="hidden md:inline">Quick Add</span>
      </Button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Close quick add menu"
          />
          <div className="absolute right-0 top-11 z-50 w-[560px] max-w-[90vw] rounded-xl border border-border bg-card shadow-xl p-3 animate-in">
            <p className="px-1 pb-2 text-xs uppercase tracking-wide text-muted-foreground">Quick Add</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {groupedLinks.map((column, columnIndex) => (
                <div key={columnIndex} className="space-y-2">
                  {column.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent transition-colors"
                    >
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
