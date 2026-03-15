import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-skeleton rounded-md bg-muted/50 dark:bg-muted/20",
        className
      )}
      {...props}
    />
  )
}

// Card Skeleton for grid view
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card border border-border rounded-lg p-6 space-y-4", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2 skeleton-delay-1" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full skeleton-delay-2" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full skeleton-delay-1" />
        <Skeleton className="h-4 w-2/3 skeleton-delay-2" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20 skeleton-delay-3" />
        <Skeleton className="h-4 w-24 skeleton-delay-4" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 flex-1 skeleton-delay-1" />
        <Skeleton className="h-8 flex-1 skeleton-delay-2" />
      </div>
    </div>
  )
}

// Table Row Skeleton for list view
function TableRowSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-4 py-3">
          <div className="space-y-1">
            <Skeleton className={`h-4 w-full skeleton-delay-${Math.min(index + 1, 4)}`} />
            {index === 0 && <Skeleton className="h-3 w-2/3 skeleton-delay-2" />}
          </div>
        </td>
      ))}
    </tr>
  )
}

// Table Header Skeleton
function TableHeaderSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <tr className="border-b border-border bg-muted/30">
      {Array.from({ length: columns }).map((_, index) => (
        <th key={index} className="px-4 py-3 text-left">
          <Skeleton className={`h-4 w-20 skeleton-delay-${Math.min(index + 1, 4)}`} />
        </th>
      ))}
    </tr>
  )
}

// Grid Skeleton
function GridSkeleton({ 
  items = 6, 
  columns = 3,
  className 
}: { 
  items?: number
  columns?: number
  className?: string 
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  return (
    <div className={cn(
      "grid gap-4",
      gridCols[columns as keyof typeof gridCols] || gridCols[3],
      className
    )}>
      {Array.from({ length: items }).map((_, index) => (
        <CardSkeleton key={index} className={`skeleton-delay-${Math.min(index % 4 + 1, 4)}`} />
      ))}
    </div>
  )
}

// List/Table Skeleton
function TableSkeleton({ 
  rows = 8, 
  columns = 6,
  className 
}: { 
  rows?: number
  columns?: number
  className?: string 
}) {
  return (
    <div className={cn("bg-card rounded-lg border border-border overflow-hidden", className)}>
      <div className="mobile-table-scroll overflow-auto overscroll-contain max-h-[65vh]">
        <table className="w-full min-w-[900px]">
          <thead className="sticky top-0 z-10 bg-muted/95">
            <TableHeaderSkeleton columns={columns} />
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, index) => (
              <TableRowSkeleton key={index} columns={columns} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Page Header Skeleton
function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-between mb-6", className)}>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-16 skeleton-delay-1" />
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-9 w-24 skeleton-delay-2" />
        <Skeleton className="h-9 w-20 skeleton-delay-3" />
      </div>
    </div>
  )
}

// Form Skeleton
function FormSkeleton({ fields = 4, className }: { fields?: number, className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className={`h-4 w-20 skeleton-delay-${Math.min(index + 1, 4)}`} />
          <Skeleton className={`h-10 w-full skeleton-delay-${Math.min(index + 2, 4)}`} />
        </div>
      ))}
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-10 w-20 skeleton-delay-1" />
        <Skeleton className="h-10 w-16 skeleton-delay-2" />
      </div>
    </div>
  )
}

// Dashboard Stats Skeleton
function StatsSkeleton({ items = 4, className }: { items?: number, className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className={`bg-card border border-border rounded-lg p-6 skeleton-delay-${Math.min(index + 1, 4)}`}>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-12 skeleton-delay-1" />
            </div>
            <Skeleton className="h-8 w-8 rounded skeleton-delay-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Sidebar Skeleton
function SidebarSkeleton({ items = 8, className }: { items?: number, className?: string }) {
  return (
    <div className={cn("space-y-2 p-4", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className={`flex items-center gap-3 px-3 py-2 skeleton-delay-${Math.min(index % 4 + 1, 4)}`}>
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

// Product Card Skeleton (specific for products)
function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card border border-border rounded-lg p-6 space-y-4", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2 skeleton-delay-1" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full skeleton-delay-2" />
      </div>
      
      {/* Image placeholder */}
      <Skeleton className="h-32 w-full rounded-md skeleton-delay-1" />
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-full skeleton-delay-2" />
        <Skeleton className="h-4 w-2/3 skeleton-delay-3" />
        <Skeleton className="h-4 w-1/2 skeleton-delay-4" />
        <Skeleton className="h-4 w-3/4 skeleton-delay-1" />
      </div>
      
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 flex-1 skeleton-delay-2" />
        <Skeleton className="h-8 flex-1 skeleton-delay-3" />
      </div>
    </div>
  )
}

// Loading Page Component
function LoadingPage({ 
  view = 'grid',
  title = 'Loading...',
  showHeader = true,
  items = 6,
  columns = 3
}: {
  view?: 'grid' | 'list'
  title?: string
  showHeader?: boolean
  items?: number
  columns?: number
}) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {showHeader && <PageHeaderSkeleton />}
      
      {view === 'grid' ? (
        <GridSkeleton items={items} columns={columns} />
      ) : (
        <TableSkeleton rows={items} />
      )}
    </div>
  )
}

export {
  Skeleton,
  CardSkeleton,
  TableRowSkeleton,
  TableHeaderSkeleton,
  GridSkeleton,
  TableSkeleton,
  PageHeaderSkeleton,
  FormSkeleton,
  StatsSkeleton,
  SidebarSkeleton,
  ProductCardSkeleton,
  LoadingPage
}