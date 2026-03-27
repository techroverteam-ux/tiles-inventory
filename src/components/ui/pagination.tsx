'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  itemsPerPageOptions = [5, 10, 25, 50],
  loading = false
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex items-center justify-end gap-4 px-1 py-3 border-t border-border/40 text-sm text-muted-foreground">
      {/* Rows per page */}
      {showItemsPerPage && (
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap font-medium">Rows per page:</span>
          <div className="relative">
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              disabled={loading}
              className="appearance-none bg-transparent border border-border/50 rounded-lg pl-3 pr-7 py-1.5 text-sm font-semibold text-foreground cursor-pointer hover:border-primary/40 focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
            >
              {itemsPerPageOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-popover text-foreground">{opt}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rotate-90 pointer-events-none text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Range info */}
      <span className="whitespace-nowrap font-medium tabular-nums">
        {startItem}–{endItem} of {totalItems}
      </span>

      {/* Prev / Next */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className={cn(
            'h-8 w-8 flex items-center justify-center rounded-lg border border-border/50 transition-all',
            currentPage === 1 || loading
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-primary/10 hover:text-primary hover:border-primary/30 active:scale-90'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0 || loading}
          className={cn(
            'h-8 w-8 flex items-center justify-center rounded-lg border border-border/50 transition-all',
            currentPage === totalPages || totalPages === 0 || loading
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-primary/10 hover:text-primary hover:border-primary/30 active:scale-90'
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Hook for pagination state management
export function usePagination(initialPage = 1, initialItemsPerPage = 5) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)

  const handlePageChange = (page: number) => setCurrentPage(page)

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  const reset = () => {
    setCurrentPage(1)
    setItemsPerPage(initialItemsPerPage)
  }

  return { currentPage, itemsPerPage, handlePageChange, handleItemsPerPageChange, reset }
}
