'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Inventory', href: '/inventory', icon: Layers },
  { name: 'Purchase', href: '/purchase-orders', icon: ShoppingCart },
  { name: 'Sales', href: '/sales-orders', icon: TrendingUp },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden mobile-safe-area">
      <div className="grid grid-cols-5 h-16">
        {mobileNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                isActive 
                  ? "text-primary bg-accent" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}