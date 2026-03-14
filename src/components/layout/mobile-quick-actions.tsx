'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Plus, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Scan,
  X
} from 'lucide-react'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  iconClassName: string
  action: () => void
}

export default function MobileQuickActions() {
  const [showActions, setShowActions] = useState(false)

  const quickActions: QuickAction[] = [
    {
      id: 'add-product',
      title: 'Add Product',
      description: 'Create new product',
      icon: <Package className="h-6 w-6" />,
      iconClassName: 'bg-primary/15 text-primary',
      action: () => {
        setShowActions(false)
        // Navigate to add product
      }
    },
    {
      id: 'add-stock',
      title: 'Add Stock',
      description: 'Add inventory batch',
      icon: <Plus className="h-6 w-6" />,
      iconClassName: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      action: () => {
        setShowActions(false)
        // Navigate to add stock
      }
    },
    {
      id: 'purchase-order',
      title: 'Purchase Order',
      description: 'Create purchase order',
      icon: <ShoppingCart className="h-6 w-6" />,
      iconClassName: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      action: () => {
        setShowActions(false)
        // Navigate to purchase order
      }
    },
    {
      id: 'sales-order',
      title: 'Sales Order',
      description: 'Create sales order',
      icon: <TrendingUp className="h-6 w-6" />,
      iconClassName: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
      action: () => {
        setShowActions(false)
        // Navigate to sales order
      }
    },
    {
      id: 'scan-barcode',
      title: 'Scan Barcode',
      description: 'Quick product lookup',
      icon: <Scan className="h-6 w-6" />,
      iconClassName: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400',
      action: () => {
        setShowActions(false)
        // Open barcode scanner
      }
    }
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
              <DialogTitle className="text-lg font-semibold">Quick Actions</DialogTitle>
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
              <button
                key={action.id}
                onClick={action.action}
                className="flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-accent transition-colors"
              >
                <div className={`p-3 rounded-full ${action.iconClassName}`}>
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
            ))}
          </div>
          
          <div className="h-6 bg-muted/50 rounded-b-2xl" />
        </DialogContent>
      </Dialog>
    </>
  )
}