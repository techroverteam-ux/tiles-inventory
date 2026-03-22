'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, Search, X } from 'lucide-react'
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
import { pageVariants } from '@/lib/motion'
import { AnimatePresence, motion } from 'framer-motion'

interface LayoutProps {
  children: React.ReactNode
}

interface GlobalSearchResult {
  type: string
  label: string
  href: string
  subtitle?: string
}

const mobileSearchShortcuts = [
  { label: 'Products', href: '/products' },
  { label: 'Inventory', href: '/inventory' },
  { label: 'Purchase Orders', href: '/purchase-orders' },
  { label: 'Sales Orders', href: '/sales-orders' },
]

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [globalSearch, setGlobalSearch] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1)
  const searchBoxRef = useRef<HTMLDivElement | null>(null)
  const desktopInputRef = useRef<HTMLInputElement | null>(null)
  const mobileInputRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const groupedSearchResults = useMemo(() => {
    return searchResults.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = []
      }
      acc[item.type].push(item)
      return acc
    }, {} as Record<string, GlobalSearchResult[]>)
  }, [searchResults])

  const hasSearchQuery = globalSearch.trim().length >= 2

  const closeSearch = () => {
    setShowSearchResults(false)
    setMobileSearchOpen(false)
    setActiveSearchIndex(-1)
  }

  const handleSearchResultSelect = (result: GlobalSearchResult) => {
    setSidebarOpen(false)
    closeSearch()
    router.push(result.href)
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!hasSearchQuery || searchResults.length === 0) {
      if (event.key === 'Escape') {
        closeSearch()
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveSearchIndex((prev) => (prev + 1) % searchResults.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveSearchIndex((prev) => (prev <= 0 ? searchResults.length - 1 : prev - 1))
      return
    }

    if (event.key === 'Enter' && activeSearchIndex >= 0) {
      event.preventDefault()
      handleSearchResultSelect(searchResults[activeSearchIndex])
      return
    }

    if (event.key === 'Escape') {
      closeSearch()
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    const search = async () => {
      if (globalSearch.trim().length < 2) {
        setSearchResults([])
        setSearchLoading(false)
        return
      }

      setSearchLoading(true)
      try {
        const response = await fetch(`/api/global-search?q=${encodeURIComponent(globalSearch.trim())}&limit=6`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          setSearchResults([])
          return
        }
        const data = await response.json()
        const results: GlobalSearchResult[] = data.results || []
        setSearchResults(results)
        setActiveSearchIndex(results.length ? 0 : -1)
      } catch {
        if (!controller.signal.aborted) {
          setSearchResults([])
          setActiveSearchIndex(-1)
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false)
        }
      }
    }

    const timer = setTimeout(search, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [globalSearch])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!searchBoxRef.current) return
      if (!searchBoxRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
        setActiveSearchIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => {
        mobileInputRef.current?.focus()
      }, 50)
    }
  }, [mobileSearchOpen])

  useEffect(() => {
    if (!mobileSearchOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [mobileSearchOpen])

  const renderSearchResults = (mode: 'dropdown' | 'inline' = 'dropdown') => {
    if (!showSearchResults || !hasSearchQuery) {
      return null
    }

    const containerClass =
      mode === 'dropdown'
        ? 'absolute top-11 left-0 right-0 z-[60] rounded-lg border border-border bg-card shadow-lg overflow-hidden animate-in'
        : 'rounded-lg border border-border bg-card shadow-sm overflow-hidden'

    return (
      <div className={containerClass}>
        {searchLoading ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>
        ) : searchResults.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">No matches found</div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {Object.entries(groupedSearchResults).map(([type, items]) => (
              <div key={type} className="border-b last:border-b-0 border-border/50">
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
                  {type}
                </div>
                {items.map((result) => {
                  const absoluteIndex = searchResults.findIndex(
                    (item) => item.type === result.type && item.label === result.label && item.href === result.href
                  )
                  const isActive = absoluteIndex === activeSearchIndex

                  return (
                    <button
                      key={`${result.type}-${result.label}-${result.href}`}
                      className={`w-full px-3 py-2 text-left transition-colors ${isActive ? 'bg-accent' : 'hover:bg-accent'}`}
                      onMouseEnter={() => setActiveSearchIndex(absoluteIndex)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSearchResultSelect(result)}
                    >
                      <div className="text-sm font-medium text-foreground line-clamp-1">{result.label}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{result.subtitle || result.type}</div>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}
        {mode === 'dropdown' && searchResults.length > 0 && (
          <div className="px-3 py-1.5 text-[11px] text-muted-foreground border-t border-border bg-muted/20">
            Use ↑ ↓ to navigate and Enter to open
          </div>
        )}
      </div>
    )
  }

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
        <div className="min-h-screen max-w-full overflow-x-hidden bg-background text-foreground flex flex-col bg-mesh">
          {/* Header */}
          <header className="px-3 sm:px-4 md:px-6 h-16 sm:h-20 flex items-center justify-between fixed top-0 left-0 right-0 z-50 glass backdrop-blur-xl md:backdrop-blur-2xl border-b border-border/50 gap-2 sm:gap-4 optimize-gpu">
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Menu */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 md:hidden hover:bg-primary/10 hover:text-primary transition-colors duration-300 active:scale-95"
              >
                <Menu className="h-5 w-5 text-muted-foreground" />
              </Button>
              
              {/* Desktop Hamburger Menu */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hidden md:inline-flex hover:bg-primary/10 hover:text-primary transition-colors duration-300 active:scale-95"
              >
                <Menu className="h-5 w-5 text-muted-foreground" />
              </Button>
              
              {/* Logo */}
              <div className="flex items-center group cursor-pointer" onClick={() => router.push('/')}>
                <div className="relative">
                  <img
                    src="/logo.jpeg?v=1"
                    alt="Logo"
                    className="h-8 sm:h-10 w-auto object-contain rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg group-hover:shadow-primary/20"
                    onError={(e) => {
                      console.error('Header logo failed to load')
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 rounded-xl bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            </div>

            <div ref={searchBoxRef} className="hidden lg:flex items-center gap-4 flex-1 max-w-xl mx-6">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors group-focus-within:text-primary" />
                <Input
                  ref={desktopInputRef}
                  placeholder="Search brands, products, orders..."
                  className="pl-11 h-11 bg-muted/20 border-border/40 text-sm focus:bg-background transition-colors duration-300 rounded-2xl group-hover:border-primary/30"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onFocus={() => setShowSearchResults(true)}
                  onKeyDown={handleSearchKeyDown}
                />
                {globalSearch && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setGlobalSearch('')
                      setSearchResults([])
                      setShowSearchResults(false)
                      desktopInputRef.current?.focus()
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
                {renderSearchResults()}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="p-2 lg:hidden hover:bg-primary/10 hover:text-primary active:scale-95 transition-colors"
                onClick={() => {
                  setMobileSearchOpen(true)
                  setShowSearchResults(true)
                  setActiveSearchIndex(-1)
                }}
              >
                <Search className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-1.5 py-1 bg-muted/10 sm:bg-muted/20 rounded-2xl border border-border/30">
                <QuickAddPanel />
                <ThemeToggle />
                <NotificationDropdown />
              </div>
              <UserDropdown />
            </div>
          </header>

          {mobileSearchOpen && (
            <div className="fixed inset-0 z-[70] sm:hidden bg-background/95 backdrop-blur-sm">
              <div className="mt-16 h-[calc(100vh-4rem)] flex flex-col" ref={searchBoxRef}>
                <div className="px-3 pt-3 pb-2 border-b border-border bg-background">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      ref={mobileInputRef}
                      placeholder="Search brands, categories, sizes, products, orders..."
                      className="pl-10 pr-10"
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                      onFocus={() => setShowSearchResults(true)}
                      onKeyDown={handleSearchKeyDown}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      aria-label={globalSearch ? 'Clear search' : 'Close search'}
                      title={globalSearch ? 'Clear search' : 'Close search'}
                      onClick={() => {
                        if (globalSearch) {
                          setGlobalSearch('')
                          setSearchResults([])
                          setActiveSearchIndex(-1)
                          mobileInputRef.current?.focus()
                          return
                        }
                        closeSearch()
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Global search</p>
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={closeSearch}>
                      Done
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-3 mobile-safe-area">
                  {hasSearchQuery ? (
                    renderSearchResults('inline')
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">Try searching for products, brands, categories, sizes or orders.</div>
                      <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Quick shortcuts</p>
                        <div className="grid grid-cols-2 gap-2">
                          {mobileSearchShortcuts.map((item) => (
                            <button
                              key={item.href}
                              type="button"
                              className="text-left px-3 py-2 rounded-md border border-border hover:bg-accent text-sm"
                              onClick={() => {
                                closeSearch()
                                router.push(item.href)
                              }}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-1 min-w-0 max-w-full pt-16 sm:pt-20">
            {/* Desktop Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className={`min-w-0 max-w-full flex-1 overflow-x-hidden transition-[margin] duration-300 ease-in-out ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'} flex flex-col will-change-[margin]`}>
              <div className="min-w-0 max-w-full flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pathname}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    className="w-full h-full"
                    onClick={() => {
                      setShowSearchResults(false)
                      setMobileSearchOpen(false)
                    }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
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