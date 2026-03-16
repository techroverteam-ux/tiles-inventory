'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Plus, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Users,
  Palette,
  Ruler,
  X
} from 'lucide-react'
import Link from 'next/link'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  href?: string
  action?: () => void
}

export default function MobileQuickActions() {
  const [showActions, setShowActions] = useState(false)

  const quickActions: QuickAction[] = [
    {
      id: 'add-brand',
      title: 'Add Brand',
      description: 'Create a new brand',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-blue-500',
      href: '/brands',
    },
    {
      id: 'add-category',
      title: 'Add Category',
      description: 'Create a new category',
      icon: <Palette className="h-6 w-6" />,
      color: 'bg-purple-500',
      href: '/categories',
    },
    {
      id: 'add-size',
      title: 'Add Size',
      description: 'Create a new size',
      icon: <Ruler className="h-6 w-6" />,
      color: 'bg-green-500',
      href: '/sizes',
    },
    {
      id: 'add-product',
      title: 'Add Product',
      description: 'Create a new product',
      icon: <Package className="h-6 w-6" />,
      color: 'bg-indigo-500',
      href: '/products',
    },
    {
      id: 'purchase-order',
      title: 'Purchase Order',
      description: 'Create purchase order',
      icon: <ShoppingCart className="h-6 w-6" />,
      color: 'bg-orange-500',
      href: '/purchase-orders',
    },
    {
      id: 'sales-order',
      title: 'Sales Order',
      description: 'Create sales order',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'bg-rose-500',
      href: '/sales-orders',
    },
  ]

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setShowActions(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40 md:hidden"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Quick Actions Dialog */}
      <Dialog open={showActions} onOpenChange={setShowActions}>
        <DialogContent className="max-w-sm mx-auto bottom-0 top-auto translate-y-0 rounded-t-2xl rounded-b-none border-0 p-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">Quick Add</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActions(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 p-6 pt-0">
            {quickActions.map((action) => (
              action.href ? (
                <Link
                  key={action.id}
                  href={action.href}
                  onClick={() => setShowActions(false)}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/40 hover:bg-accent transition-colors"
                >
                  <div className={`p-3 rounded-full ${action.color} text-white`}>
                    {action.icon}
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm text-foreground">
                      {action.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                </Link>
              ) : (
                <button
                  key={action.id}
                  onClick={() => { action.action?.(); setShowActions(false) }}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/40 hover:bg-accent transition-colors"
                >
                  <div className={`p-3 rounded-full ${action.color} text-white`}>
                    {action.icon}
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm text-foreground">
                      {action.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                </button>
              )
            ))}
          </div>
          
          <div className="h-6 bg-muted/30 rounded-b-2xl" />
        </DialogContent>
      </Dialog>
    </>
  )
}
