'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
  showItemsPerPage?: boolean
  itemsPerPageOptions?: number[]
  loading?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  itemsPerPageOptions = [10, 25, 50, 100],
  loading = false
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div>
          Showing {startItem} to {endItem} of {totalItems} results
        </div>
        
        {showItemsPerPage && (
          <div className="flex items-center gap-2">
            <span>Show</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => onItemsPerPageChange(Number(value))}
              disabled={loading}
            >
              <SelectTrigger className="w-20 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {itemsPerPageOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>per page</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || loading}
          className="h-9 w-9 p-0 rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary transition-colors transition-transform duration-200 active:scale-90"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="h-9 w-9 p-0 rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary transition-colors transition-transform duration-200 active:scale-90"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => (
            <div key={index}>
              {page === '...' ? (
                <span className="px-2 py-1 text-muted-foreground font-medium">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  disabled={loading}
                  className={cn(
                    "h-9 w-9 p-0 rounded-xl transition-colors transition-transform duration-200 active:scale-90",
                    currentPage === page 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                      : "border-border/50 hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="h-9 w-9 p-0 rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary transition-colors transition-transform duration-200 active:scale-90"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || loading}
          className="h-9 w-9 p-0 rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary transition-colors transition-transform duration-200 active:scale-90"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Hook for pagination state management
export function usePagination(initialPage = 1, initialItemsPerPage = 25) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const reset = () => {
    setCurrentPage(1)
    setItemsPerPage(initialItemsPerPage)
  }

  return {
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    reset
  }
}