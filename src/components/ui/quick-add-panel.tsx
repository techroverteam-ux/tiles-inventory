'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Package, ShoppingCart, TrendingUp, Users, Palette, Ruler, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

const quickAddLinks = [
  { title: 'Brand', subtitle: 'Create a new brand', href: '/brands?action=create', icon: Users, color: 'text-primary' },
  { title: 'Category', subtitle: 'Create a new category', href: '/categories?action=create', icon: Palette, color: 'text-primary' },
  { title: 'Size', subtitle: 'Create a new size', href: '/sizes?action=create', icon: Ruler, color: 'text-primary' },
  { title: 'Product', subtitle: 'Create a new product', href: '/products?action=create', icon: Package, color: 'text-primary' },
  { title: 'Inventory', subtitle: 'Add stock batch', href: '/inventory?action=create', icon: Package, color: 'text-primary' },
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

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 cursor-default bg-black/5"
              onClick={() => setOpen(false)}
              aria-label="Close quick add menu"
            />
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                hidden: { 
                  opacity: 0, 
                  scale: 0.8, 
                  y: -20, 
                  x: 20,
                  transition: {
                    type: 'spring',
                    damping: 25,
                    stiffness: 400
                  }
                },
                visible: { 
                  opacity: 1, 
                  scale: 1, 
                  y: 0, 
                  x: 0,
                  transition: {
                    type: 'spring',
                    damping: 20,
                    stiffness: 300,
                    staggerChildren: 0.05,
                    delayChildren: 0.1
                  }
                }
              }}
              className="absolute right-0 top-11 z-50 w-[560px] max-w-[90vw] rounded-xl border border-border bg-card shadow-xl p-3"
            >
              <p className="px-1 pb-2 text-xs uppercase tracking-wide text-muted-foreground">Quick Add</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {groupedLinks.map((column, columnIndex) => (
                  <div key={columnIndex} className="space-y-2">
                    {column.map((item) => (
                      <motion.div
                        key={item.title}
                        variants={{
                          hidden: { opacity: 0, x: -10 },
                          visible: { opacity: 1, x: 0 }
                        }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent transition-colors group"
                        >
                          <div className="p-2 rounded-md bg-primary/5 group-hover:bg-primary/10 transition-colors">
                            <item.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
