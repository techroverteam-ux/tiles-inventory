'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Settings,
  FileText,
  MapPin,
  Layers,
  Palette,
  Ruler,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart },
  { name: 'Sales Orders', href: '/sales-orders', icon: TrendingUp },
  { name: 'Inventory', href: '/inventory', icon: Layers },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Brands', href: '/brands', icon: Users },
  { name: 'Categories', href: '/categories', icon: Palette },
  { name: 'Sizes', href: '/sizes', icon: Ruler },
  { name: 'Locations', href: '/locations', icon: MapPin },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40 flex flex-col",
        isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:w-16 md:translate-x-0"
      )}>
        <nav className="p-4 space-y-2 flex-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose()}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-r-2 border-blue-700 dark:border-blue-400" 
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className={cn(isOpen ? "block" : "hidden md:hidden")}>{item.name}</span>
              </Link>
            )
          })}
        </nav>
        
        <div className={cn("p-4 border-t border-gray-200 dark:border-gray-700 md:hidden", isOpen ? "block" : "hidden")}>
          <button
            onClick={() => {
              onClose()
              fetch('/api/auth/logout', { method: 'POST' }).then(() => {
                window.location.href = '/login'
              })
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}