'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Sidebar from './sidebar'
import MobileNav from './mobile-nav'
import MobileQuickActions from './mobile-quick-actions'
import NotificationDropdown from '@/components/NotificationDropdown'
import UserDropdown from '@/components/UserDropdown'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/contexts/ToastContext'
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
    return <>{children}</>
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
        <NotificationProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 md:pb-0">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between fixed top-0 left-0 right-0 z-50 shadow-sm">
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Menu */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 md:hidden"
              >
                <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </Button>
              
              {/* Desktop Hamburger Menu */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hidden md:inline-flex"
              >
                <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </Button>
              
              {/* Logo */}
              <div className="flex items-center">
                <img
                  src="/logo.jpeg"
                  alt="Logo"
                  className="h-8 w-auto object-contain"
                />
              </div>
            </div>

            {/* Desktop Search */}
            <div className="hidden lg:flex items-center gap-4 flex-1 max-w-md mx-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                <Input
                  placeholder="Search..."
                  className="pl-10 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile Search Button */}
              <Button variant="ghost" size="sm" className="p-2 md:hidden">
                <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </Button>
              
              <Button variant="default" size="sm" className="bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 hidden sm:flex text-xs px-3 py-2">
                <Plus className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                <span className="hidden md:inline">Quick Add</span>
              </Button>
              <ThemeToggle />
              <NotificationDropdown />
              <UserDropdown onLogout={handleLogout} />
            </div>
          </header>

          <div className="flex pt-16 sm:pt-20">
            {/* Desktop Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'} min-h-screen`}>
              <div className="p-3 sm:p-4 md:p-6">
                {children}
              </div>
            </main>
          </div>

          {/* Mobile Navigation */}
          <MobileNav />
          
          {/* Mobile Quick Actions */}
          <MobileQuickActions />

          {/* Footer - Hidden on mobile */}
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400 hidden md:block">
            © 2026 Tiles Inventory Management System. All rights reserved.
          </footer>
        </div>
        </NotificationProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}