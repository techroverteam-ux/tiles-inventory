'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingPage } from '@/components/ui/skeleton'

interface ViewToggleProps {
  currentView: 'grid' | 'list'
  onViewChange: (view: 'grid' | 'list') => void
  forceView?: 'grid' | 'list' | null
}

export function ViewToggle({ currentView, onViewChange, forceView }: ViewToggleProps) {
  // Don't show toggle if view is forced
  if (forceView) return null

  return (
    <div className="flex items-center space-x-2 bg-muted rounded-lg p-1">
      <Button
        variant={currentView === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className="h-8 px-3"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        Grid
      </Button>
      <Button
        variant={currentView === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className="h-8 px-3"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        List
      </Button>
    </div>
  )
}

interface GridViewProps {
  items: any[]
  renderItem: (item: any) => React.ReactNode
  columns?: number
  loading?: boolean
}

export function GridView({ items, renderItem, columns = 3, loading = false }: GridViewProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  if (loading) {
    return <LoadingPage view="grid" showHeader={false} items={6} columns={columns} />
  }

  return (
    <div className={`grid gap-4 ${gridCols[columns as keyof typeof gridCols] || gridCols[3]}`}>
      {items.map((item, index) => (
        <div key={item.id?.toString() || index} className="h-full">
          {renderItem(item)}
        </div>
      ))}
    </div>
  )
}

interface ListViewProps {
  items: any[]
  headers: string[]
  renderRow: (item: any) => React.ReactNode
  tableMinWidthClass?: string
  tableMaxHeightClass?: string
  loading?: boolean
}

export function ListView({
  items,
  headers,
  renderRow,
  tableMinWidthClass = 'min-w-[900px]',
  tableMaxHeightClass = 'max-h-[65vh]',
  loading = false
}: ListViewProps) {
  if (loading) {
    return <LoadingPage view="list" showHeader={false} items={8} />
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className={`mobile-table-scroll overflow-auto overscroll-auto scroll-smooth ${tableMaxHeightClass}`}>
        <table className={`desktop-table-nowrap w-full ${tableMinWidthClass}`}>
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/75">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-muted-foreground uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item, index) => (
              <tr
                key={item.id?.toString() || index}
                className="hover:bg-muted/30 transition-colors"
              >
                {renderRow(item)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Hook to detect screen size and determine default view
function useResponsiveView() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return isMobile
}

interface DataViewProps {
  items: any[]
  view: 'grid' | 'list'
  onViewChange: (view: 'grid' | 'list') => void
  gridProps?: {
    renderItem: (item: any) => React.ReactNode
    columns?: number
  }
  listProps?: {
    headers: string[]
    renderRow: (item: any) => React.ReactNode
    tableMinWidthClass?: string
    tableMaxHeightClass?: string
  }
  title?: string
  actions?: React.ReactNode
  loading?: boolean
  autoResponsive?: boolean // New prop to enable automatic responsive behavior
}

export function DataView({
  items,
  view,
  onViewChange,
  gridProps,
  listProps,
  title,
  actions,
  loading = false,
  autoResponsive = true
}: DataViewProps) {
  const isMobile = useResponsiveView()
  
  // Determine the actual view to use
  const actualView = autoResponsive ? (isMobile ? 'grid' : view) : view
  const forceView = autoResponsive ? (isMobile ? 'grid' : null) : null

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {title && (
            <h2 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">{title}</h2>
          )}
          <div className="text-sm text-muted-foreground">
            {loading ? 'Loading...' : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}
          </div>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none">
            {actions}
          </div>
          <ViewToggle currentView={view} onViewChange={onViewChange} forceView={forceView} />
        </div>
      </div>

      {loading ? (
        <LoadingPage view={actualView} showHeader={false} items={actualView === 'grid' ? 6 : 8} />
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-muted-foreground text-center">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-lg font-medium">No items found</p>
              <p className="text-sm">Get started by adding your first item</p>
            </div>
          </CardContent>
        </Card>
      ) : actualView === 'grid' && gridProps ? (
        <GridView
          items={items}
          renderItem={gridProps.renderItem}
          columns={gridProps.columns}
          loading={loading}
        />
      ) : actualView === 'list' && listProps ? (
        <ListView
          items={items}
          headers={listProps.headers}
          renderRow={listProps.renderRow}
          tableMinWidthClass={listProps.tableMinWidthClass}
          tableMaxHeightClass={listProps.tableMaxHeightClass}
          loading={loading}
        />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Invalid view configuration
        </div>
      )}
    </div>
  )
}