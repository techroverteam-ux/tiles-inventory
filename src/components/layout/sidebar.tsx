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
  Ruler
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Brands', href: '/brands', icon: Users },
  { name: 'Categories', href: '/categories', icon: Palette },
  { name: 'Sizes', href: '/sizes', icon: Ruler },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart },
  { name: 'Sales Orders', href: '/sales-orders', icon: TrendingUp },
  { name: 'Inventory', href: '/inventory', icon: Layers },
  { name: 'Locations', href: '/locations', icon: MapPin },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  const handleNavItemClick = () => {
    // Keep desktop sidebar state stable; close only on mobile navigation.
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/40 z-40 md:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-16 sm:top-20 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] border-r border-border/50 transition-[width,transform] duration-300 ease-out z-40 flex flex-col glass backdrop-blur-3xl",
        isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:w-20 md:translate-x-0"
      )}>
        <nav className="space-y-2 flex-1 p-4 overflow-y-auto overflow-x-hidden scrollbar-thin-violet pb-20">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <div key={item.name} className="relative group">
                <Link
                  href={item.href}
                  onClick={handleNavItemClick}
                  className={cn(
                    "relative flex h-12 items-center rounded-xl text-sm font-bold transition-all duration-200",
                    isOpen ? "justify-start gap-4 px-4" : "justify-center px-0",
                    isActive 
                      ? "bg-primary/10 text-primary shadow-sm" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:scale-[1.02]"
                  )}
                >
                   <item.icon className={cn("h-6 w-6 flex-shrink-0 transition-colors duration-300", isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-primary group-hover:scale-110")} />
                  <span
                    className={cn(
                      "overflow-hidden whitespace-nowrap transition-all duration-300",
                      isOpen ? "w-auto opacity-100 translate-x-0" : "w-0 opacity-0 -translate-x-2"
                    )}
                  >
                    {item.name}
                  </span>
                  {isActive && (
                    <span className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full bg-primary shadow-[0_0_15px_hsla(var(--primary)/0.5)]" />
                  )}
                </Link>
                
                {/* Tooltip for collapsed sidebar */}
                {!isOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border text-popover-foreground text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 top-1/2 transform -translate-y-1/2">
                    {item.name}
                    <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-popover"></div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        
        <div className={cn("p-4 border-t border-border md:hidden", isOpen ? "block" : "hidden")}>
          <button
            onClick={() => {
              onClose()
              fetch('/api/auth/logout', { method: 'POST' }).then(() => {
                window.location.href = '/login'
              })
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full"
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