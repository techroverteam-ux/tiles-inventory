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
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden">
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
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
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