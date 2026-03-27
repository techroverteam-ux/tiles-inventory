'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingPage } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/motion'
import { LayoutGrid, List as ListIcon } from 'lucide-react'
import { useMediaQuery } from '@/hooks/use-media-query'

interface ViewToggleProps {
  currentView: 'grid' | 'list'
  onViewChange: (view: 'grid' | 'list') => void
  forceView?: 'grid' | 'list' | null
}

export function ViewToggle({ currentView, onViewChange, forceView }: ViewToggleProps) {
  // Don't show toggle if view is forced
  if (forceView) return null

  return (
    <div className="flex items-center p-1 bg-muted/30 backdrop-blur-md rounded-xl border border-border/40 shadow-inner">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('grid')}
        className={cn(
          "h-8 px-4 gap-2 rounded-lg transition-all duration-300 font-bold text-xs uppercase tracking-tight",
          currentView === 'grid'
            ? "bg-background text-primary shadow-sm ring-1 ring-border/20"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        )}
      >
        <LayoutGrid className={cn("w-3.5 h-3.5 transition-transform", currentView === 'grid' && "scale-110")} />
        Grid
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('list')}
        className={cn(
          "h-8 px-4 gap-2 rounded-lg transition-all duration-300 font-bold text-xs uppercase tracking-tight",
          currentView === 'list'
            ? "bg-background text-primary shadow-sm ring-1 ring-border/20"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        )}
      >
        <ListIcon className={cn("w-3.5 h-3.5 transition-transform", currentView === 'list' && "scale-110")} />
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
  onItemClick?: (item: any) => void
}

export function GridView({ items, renderItem, columns = 3, loading = false, onItemClick }: GridViewProps) {
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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`grid gap-4 ${gridCols[columns as keyof typeof gridCols] || gridCols[3]}`}
    >
      {items.map((item, index) => (
        <motion.div
          key={item.id?.toString() || index}
          variants={itemVariants}
          className={`h-full ${onItemClick ? 'cursor-pointer transition-transform hover:scale-[1.02]' : ''}`}
          onClick={() => onItemClick && onItemClick(item)}
        >
          {renderItem(item)}
        </motion.div>
      ))}
    </motion.div>
  )
}

interface ListViewProps {
  items: any[]
  headers: string[]
  renderRow: (item: any) => React.ReactNode
  tableMinWidthClass?: string
  loading?: boolean
  onItemClick?: (item: any) => void
}

export function ListView({
  items,
  headers,
  renderRow,
  tableMinWidthClass = 'min-w-[800px]',
  loading = false,
  onItemClick
}: ListViewProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")

  if (loading) {
    return <LoadingPage view="list" showHeader={false} items={8} />
  }

  return (
    <div className="glass-card rounded-[2rem] border border-border/50 overflow-hidden shadow-premium transition-all duration-500">
      <div className="overflow-auto no-scrollbar max-h-[70vh]">
        <table className={cn("w-full", isMobile ? "min-w-full" : tableMinWidthClass)}>
          <thead className="sticky top-0 z-20 bg-muted/80 backdrop-blur-md border-b border-border [&_th]:bg-transparent">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <motion.tbody
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {items.map((item, index) => (
              <motion.tr
                key={item.id?.toString() || index}
                variants={itemVariants}
                className={cn(
                  "group hover:bg-primary/[0.03] transition-colors border-b border-border/30 last:border-0 [&_td]:align-middle",
                  onItemClick ? 'cursor-pointer' : ''
                )}
                onClick={() => onItemClick && onItemClick(item)}
              >
                {renderRow(item)}
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </div>
  )
}

function useResponsiveView() {
  return useMediaQuery("(max-width: 768px)")
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
  }
  title?: string
  actions?: React.ReactNode
  loading?: boolean
  autoResponsive?: boolean // New prop to enable automatic responsive behavior
  onItemClick?: (item: any) => void
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
  autoResponsive = true,
  onItemClick
}: DataViewProps) {
  const isMobile = useResponsiveView()

  // No longer force grid on mobile if autoResponsive is true, 
  // but we can use autoResponsive as a hint for the initial state in the parent.
  // The user wants to be able to choose list layout on mobile.
  const actualView = view
  const forceView = null

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {title && (
            <h2 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">{title}</h2>
          )}
          <div className="text-sm text-muted-foreground">
            {loading ? 'Loading...' : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:w-auto">
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
          onItemClick={onItemClick}
        />
      ) : actualView === 'list' && listProps ? (
        <ListView
          items={items}
          headers={listProps.headers}
          renderRow={listProps.renderRow}
          tableMinWidthClass={listProps.tableMinWidthClass}
          loading={loading}
          onItemClick={onItemClick}
        />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Invalid view configuration
        </div>
      )}
    </div>
  )
}