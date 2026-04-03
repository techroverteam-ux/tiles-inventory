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
import { useState, useRef } from 'react'

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
  const [tooltip, setTooltip] = useState<{ name: string; y: number } | null>(null)

  const handleNavItemClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[45] md:hidden animate-fade-in duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-16 sm:top-20 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] border-r border-border/50 glass backdrop-blur-xl transition-all duration-200 ease-out z-50 flex flex-col",
        isOpen ? "w-64 translate-x-0" : "w-16 -translate-x-full md:translate-x-0"
      )}>
        <nav className="space-y-2 flex-1 px-0 py-3 no-scrollbar overflow-y-auto overflow-x-hidden pb-20">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <div
                key={item.name}
                className="relative group flex justify-center"
                onMouseEnter={(e) => {
                  if (window.matchMedia('(hover: none)').matches) return
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  setTooltip({ name: item.name, y: rect.top + rect.height / 2 })
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                <Link
                  href={item.href}
                  onClick={handleNavItemClick}
                  className={cn(
                    "relative flex items-center h-12 w-full rounded-xl transition-colors duration-300",
                    isActive
                      ? "bg-muted text-primary shadow-none"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <div className="flex-shrink-0 flex items-center justify-center transition-all duration-300 w-12 ml-2">
                    <item.icon className={cn(
                      "h-5 w-5 transition-colors duration-200",
                      isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-primary"
                    )} />
                  </div>

                  <span className={cn(
                    "overflow-hidden whitespace-nowrap font-medium text-sm transition-all duration-200",
                    isOpen ? "max-w-xs opacity-100 translate-x-0 ml-1" : "max-w-0 opacity-0 -translate-x-4 ml-0"
                  )}>
                    {item.name}
                  </span>

                  {isActive && (
                    <span className={cn(
                      "absolute left-0 rounded-r-full bg-primary transition-all duration-200",
                      isOpen ? "top-3 bottom-3 w-1.5 opacity-100" : "top-4 bottom-4 w-1"
                    )} />
                  )}
                </Link>
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

      {/* Fixed tooltip — renders outside sidebar, never clipped */}
      {tooltip && (
        <div
          className="fixed z-[300] px-3 py-1.5 bg-popover text-popover-foreground border border-border text-xs font-semibold rounded-md shadow-md whitespace-nowrap pointer-events-none"
          style={{
            left: isOpen ? '272px' : '72px',
            top: tooltip.y,
            transform: 'translateY(-50%)',
          }}
        >
          {tooltip.name}
        </div>
      )}
    </>
  )
}
