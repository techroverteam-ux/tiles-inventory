'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterConfig {
  key: string
  label: string
  type: 'select' | 'multiselect' | 'search'
  options?: FilterOption[]
  placeholder?: string
}

export interface FilterState {
  [key: string]: string | string[]
}

interface TableFiltersProps {
  filters: FilterConfig[]
  values: FilterState
  onFiltersChange: (filters: FilterState) => void
  searchValue: string
  onSearchChange: (search: string) => void
  searchPlaceholder?: string
  loading?: boolean
  className?: string
}

export function TableFilters({
  filters,
  values,
  onFiltersChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  loading = false,
  className = ''
}: TableFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [localSearch, setLocalSearch] = useState(searchValue)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, onSearchChange])

  const handleFilterChange = (key: string, value: string | string[]) => {
    const newFilters = { ...values, [key]: value }
    onFiltersChange(newFilters)
  }

  const clearFilter = (key: string) => {
    const newFilters = { ...values }
    delete newFilters[key]
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    onFiltersChange({})
    setLocalSearch('')
  }

  const getActiveFiltersCount = () => {
    return Object.keys(values).filter(key => {
      const value = values[key]
      return value && (Array.isArray(value) ? value.length > 0 : value !== '')
    }).length + (searchValue ? 1 : 0)
  }

  const renderFilter = (filter: FilterConfig) => {
    const value = values[filter.key]

    switch (filter.type) {
      case 'select':
        return (
          <div key={filter.key} className="min-w-40">
            <Select
              value={value as string || ''}
              onValueChange={(newValue) => handleFilterChange(filter.key, newValue)}
              disabled={loading}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
              </SelectTrigger>
              <SelectContent>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'multiselect':
        const selectedValues = (value as string[]) || []
        return (
          <div key={filter.key} className="min-w-40">
            <Select
              value=""
              onValueChange={(newValue) => {
                const currentValues = selectedValues
                const updatedValues = currentValues.includes(newValue)
                  ? currentValues.filter(v => v !== newValue)
                  : [...currentValues, newValue]
                handleFilterChange(filter.key, updatedValues)
              }}
              disabled={loading}
            >
              <SelectTrigger className="h-9">
                <SelectValue 
                  placeholder={
                    selectedValues.length > 0 
                      ? `${selectedValues.length} selected`
                      : filter.placeholder || `Select ${filter.label}`
                  } 
                />
              </SelectTrigger>
              <SelectContent>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedValues.includes(option.value)}
                        readOnly
                        className="rounded"
                      />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={searchPlaceholder}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10 h-9"
            disabled={loading}
          />
          {localSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocalSearch('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="h-9 gap-2 whitespace-nowrap"
          disabled={loading}
        >
          <Filter className="h-4 w-4" />
          Filters
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>

        {getActiveFiltersCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-9 gap-2 whitespace-nowrap text-muted-foreground"
            disabled={loading}
          >
            <RotateCcw className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/30 rounded-lg border">
          {filters.map(renderFilter)}
        </div>
      )}

      {/* Active Filters */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>

          {searchValue && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchValue}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocalSearch('')}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {Object.entries(values).map(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return null

            const filter = filters.find((f) => f.key === key)
            if (!filter) return null

            const displayValue = Array.isArray(value)
              ? `${value.length} selected`
              : filter.options?.find((opt) => opt.value === value)?.label || value

            return (
              <Badge key={key} variant="secondary" className="gap-1">
                {filter.label}: {displayValue}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter(key)}
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Hook for managing filter state
export function useTableFilters(initialFilters: FilterState = {}, initialSearch = '') {
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [search, setSearch] = useState(initialSearch)

  const updateFilters = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  const updateSearch = (newSearch: string) => {
    setSearch(newSearch)
  }

  const reset = () => {
    setFilters({})
    setSearch('')
  }

  return {
    filters,
    search,
    updateFilters,
    updateSearch,
    reset
  }
}