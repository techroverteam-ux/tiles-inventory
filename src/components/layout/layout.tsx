'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Sidebar from './sidebar'
import MobileNav from './mobile-nav'
import MobileQuickActions from './mobile-quick-actions'
import { QuickAddPanel } from '@/components/ui/quick-add-panel'
import NotificationDropdown from '@/components/NotificationDropdown'
import UserDropdown from '@/components/UserDropdown'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { SessionProvider } from '@/contexts/SessionContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import ThemeToggle from '@/components/ThemeToggle'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Don't show layout on login page
  if (pathname === '/login') {
    return (
      <ThemeProvider>
        <ToastProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ToastProvider>
      </ThemeProvider>
    )
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <SessionProvider>
          <ProtectedRoute>
            <NotificationProvider>
        <div className="min-h-screen max-w-full overflow-x-hidden bg-background text-foreground flex flex-col">
          {/* Header */}
          <header className="bg-card border-b border-border px-3 sm:px-4 md:px-6 h-16 sm:h-20 flex items-center justify-between fixed top-0 left-0 right-0 z-50 shadow-sm">
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Menu */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 md:hidden"
              >
                <Menu className="h-5 w-5 text-muted-foreground" />
              </Button>
              
              {/* Desktop Hamburger Menu */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hidden md:inline-flex"
              >
                <Menu className="h-5 w-5 text-muted-foreground" />
              </Button>
              
              {/* Logo */}
              <div className="flex items-center">
                <img
                  src="/logo.jpeg?v=1"
                  alt="Logo"
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    console.error('Header logo failed to load')
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            </div>

            {/* Desktop Search */}
            <div className="hidden lg:flex items-center gap-4 flex-1 max-w-md mx-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search..."
                  className="pl-10 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile Search Button */}
              <Button variant="ghost" size="sm" className="p-2 md:hidden">
                <Search className="h-5 w-5 text-muted-foreground" />
              </Button>
              
              <QuickAddPanel />
              <ThemeToggle />
              <NotificationDropdown />
              <UserDropdown />
            </div>
          </header>

          <div className="flex flex-1 min-w-0 max-w-full pt-16 sm:pt-20">
            {/* Desktop Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className={`min-w-0 max-w-full flex-1 overflow-x-hidden transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'} flex flex-col`}>
              <div className="min-w-0 max-w-full flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
                {children}
              </div>
              
              {/* Footer - Sticky at bottom */}
              <footer className="bg-card border-t border-border px-4 md:px-6 py-4 text-center text-sm text-muted-foreground hidden md:block mt-auto">
                © 2026 Tiles Inventory Management System. All rights reserved.
              </footer>
            </main>
          </div>

          {/* Mobile Navigation */}
          <MobileNav />
          
          {/* Mobile Quick Actions */}
          <MobileQuickActions />
        </div>
            </NotificationProvider>
          </ProtectedRoute>
        </SessionProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}