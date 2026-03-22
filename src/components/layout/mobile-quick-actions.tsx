'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Users,
  Palette,
  Ruler,
  MapPin,
  X,
  History,
  Box,
  Hash
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'


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
      title: 'Brand',
      description: 'New Partner',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-primary',
      href: '/brands?action=create',
    },
    {
      id: 'add-product',
      title: 'Product',
      description: 'New Item',
      icon: <Box className="h-6 w-6" />,
      color: 'bg-primary',
      href: '/products?action=create',
    },
    {
      id: 'add-stock',
      title: 'Stock',
      description: 'Add Batch',
      icon: <Hash className="h-6 w-6" />,
      color: 'bg-primary',
      href: '/inventory?action=create',
    },
    {
      id: 'add-location',
      title: 'Location',
      description: 'Warehouse',
      icon: <MapPin className="h-6 w-6" />,
      color: 'bg-primary',
      href: '/locations?action=create',
    },
    {
      id: 'purchase-order',
      title: 'Purchase',
      description: 'Restock',
      icon: <ShoppingCart className="h-6 w-6" />,
      color: 'bg-primary',
      href: '/purchase-orders?action=create',
    },
    {
      id: 'sales-order',
      title: 'Sale',
      description: 'Checkout',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'bg-primary',
      href: '/sales-orders?action=create',
    },
  ]

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-24 right-4 z-40 md:hidden will-change-transform"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'tween', duration: 0.2, ease: 'circOut' }}
      >
        <Button
          onClick={() => setShowActions(true)}
          className="h-16 w-16 rounded-full shadow-premium bg-primary text-primary-foreground border-4 border-background focus:ring-4 focus:ring-primary/40 transition-all hover:scale-110 active:scale-95"
          aria-label="Quick actions"
        >
          <Plus className={`h-8 w-8 transition-transform duration-500 ${showActions ? 'rotate-45' : ''}`} />
        </Button>
      </motion.div>

      {/* Quick Actions Overlay & Bottom Sheet */}
      <AnimatePresence>
        {showActions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowActions(false)}
              className="fixed inset-0 bg-black/60 z-[50] md:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-lg z-[51] md:hidden px-6 pt-3 pb-12 border-t border-border will-change-transform"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-1.5 bg-muted/60 rounded-full cursor-grab active:cursor-grabbing" onClick={() => setShowActions(false)} />
              </div>

              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-foreground tracking-tight">Quick Actions</h3>
                  <p className="text-[10px] text-muted-foreground mt-1 tracking-widest uppercase font-bold">What would you like to do?</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowActions(false)}
                  className="h-11 w-11 rounded-full bg-muted/30 hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div 
                className="grid grid-cols-2 sm:grid-cols-3 gap-4"
              >
                {quickActions.map((action) => (
                  <div key={action.id}>
                    {action.href ? (
                      <Link
                        href={action.href}
                        onClick={() => setShowActions(false)}
                        className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-muted/50 hover:bg-accent border border-transparent hover:border-border transition-all group h-full shadow-sm"
                      >
                        <div className={`p-3 rounded-xl ${action.color} text-primary-foreground shadow-sm transition-transform duration-200 group-active:scale-95`}>
                          {action.icon}
                        </div>
                        <div className="text-center">
                          <p className="font-extrabold text-sm text-foreground">
                            {action.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mt-1 opacity-70">
                            {action.description}
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <button
                        onClick={() => { action.action?.(); setShowActions(false) }}
                        className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-muted/50 hover:bg-accent border border-transparent hover:border-border transition-all group h-full w-full shadow-sm"
                      >
                        <div className={`p-3 rounded-xl ${action.color} text-primary-foreground shadow-sm transition-transform duration-200 group-active:scale-95`}>
                          {action.icon}
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-sm text-foreground">
                            {action.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground/80 mt-1 font-medium leading-tight">
                            {action.description}
                          </p>
                        </div>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
