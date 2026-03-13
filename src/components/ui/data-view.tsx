'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ViewToggleProps {
  currentView: 'grid' | 'list'
  onViewChange: (view: 'grid' | 'list') => void
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
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
}

export function GridView({ items, renderItem, columns = 3 }: GridViewProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  return (
    <div className={`grid gap-4 ${gridCols[columns as keyof typeof gridCols] || gridCols[3]}`}>
      {items.map((item, index) => (
        <div key={item.id || index} className="h-full">
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
}

export function ListView({ items, headers, renderRow }: ListViewProps) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item, index) => (
              <tr
                key={item.id || index}
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
  }
  title?: string
  actions?: React.ReactNode
}

export function DataView({
  items,
  view,
  onViewChange,
  gridProps,
  listProps,
  title,
  actions
}: DataViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {title && (
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          )}
          <div className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {actions}
          <ViewToggle currentView={view} onViewChange={onViewChange} />
        </div>
      </div>

      {items.length === 0 ? (
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
      ) : view === 'grid' && gridProps ? (
        <GridView
          items={items}
          renderItem={gridProps.renderItem}
          columns={gridProps.columns}
        />
      ) : view === 'list' && listProps ? (
        <ListView
          items={items}
          headers={listProps.headers}
          renderRow={listProps.renderRow}
        />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Invalid view configuration
        </div>
      )}
    </div>
  )
}