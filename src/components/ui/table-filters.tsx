'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { Search, Filter, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterConfig {
  key: string
  label: string
  type: 'select' | 'multiselect' | 'search' | 'dateRange'
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
  title?: string
  actions?: React.ReactNode
  showSearch?: boolean
  showFilterToggle?: boolean
  filtersOpen?: boolean
  onFiltersOpenChange?: (open: boolean) => void
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
  title,
  actions,
  showSearch = true,
  showFilterToggle = true,
  filtersOpen,
  onFiltersOpenChange,
  searchPlaceholder = 'Search...',
  loading = false,
  className = ''
}: TableFiltersProps) {
  const [internalShowFilters, setInternalShowFilters] = useState(false)
  const [localSearch, setLocalSearch] = useState(searchValue)
  const showFilters = typeof filtersOpen === 'boolean' ? filtersOpen : internalShowFilters

  const setShowFilters = (open: boolean) => {
    if (onFiltersOpenChange) {
      onFiltersOpenChange(open)
      return
    }
    setInternalShowFilters(open)
  }

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
    const filterCount = Object.keys(values).filter(key => {
      const value = values[key]
      return value && (Array.isArray(value) ? value.length > 0 : value !== '')
    }).length
    return filterCount + (showSearch && searchValue ? 1 : 0)
  }

  const renderFilter = (filter: FilterConfig) => {
    const value = values[filter.key]

    switch (filter.type) {
      case 'select':
        return (
          <div key={filter.key} className="w-full min-w-0 space-y-1.5 md:flex-1 md:min-w-[160px] md:max-w-xs">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">{filter.label}</label>
            <SearchableSelect
              value={value as string || ''}
              onValueChange={(newValue) => handleFilterChange(filter.key, newValue)}
              options={filter.options || []}
              placeholder={filter.placeholder || `All ${filter.label}`}
              disabled={loading}
              className="h-10 rounded-xl"
            />
          </div>
        )

      case 'multiselect':
        const selectedValues = (value as string[]) || []
        return (
          <div key={filter.key} className="w-full min-w-0 space-y-1.5 md:flex-1 md:min-w-[160px] md:max-w-xs">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">{filter.label}</label>
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
              <SelectTrigger className="h-10 rounded-xl border-input bg-muted/10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 hover:bg-muted/20">
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

      case 'dateRange':
        const fromKey = `${filter.key}From`
        const toKey = `${filter.key}To`
        return (
          <div key={filter.key} className="w-full min-w-0 space-y-1.5 col-span-2 md:flex-1 md:min-w-[340px]">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">{filter.label} Range</label>
            <div className="flex items-center gap-2 w-full">
              <DatePicker
                date={(values[fromKey] as string) || ''}
                onChange={(date) => {
                  const newFilters = { ...values, [fromKey]: date ? date.toISOString().split('T')[0] : '' }
                  if (!date) delete newFilters[fromKey]
                  onFiltersChange(newFilters)
                }}
                placeholder="From"
                className="h-10 rounded-xl"
                disabled={loading}
              />
              <span className="text-muted-foreground/50 text-sm font-medium flex-shrink-0">to</span>
              <DatePicker
                date={(values[toKey] as string) || ''}
                onChange={(date) => {
                  const newFilters = { ...values, [toKey]: date ? date.toISOString().split('T')[0] : '' }
                  if (!date) delete newFilters[toKey]
                  onFiltersChange(newFilters)
                }}
                placeholder="To"
                className="h-10 rounded-xl"
                disabled={loading}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filter Toggle */}
      <div className="page-header">
        {title ? (
          <div>
            <h1 className="page-title">{title}</h1>
          </div>
        ) : (
          <div />
        )}

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {actions}

          {showSearch && (
            <div className="relative min-w-0 flex-1 max-w-full sm:max-w-sm group">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors group-focus-within:text-primary" />
              <Input
                placeholder={searchPlaceholder}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-10 h-10 bg-muted/20 border-border/40 focus:bg-background transition-colors duration-200 rounded-xl"
                disabled={loading}
              />
              {localSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocalSearch('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {showFilterToggle && (
            <motion.div whileTap={{ scale: 0.93 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "h-10 px-4 gap-2 whitespace-nowrap rounded-xl transition-colors duration-200",
                  showFilters ? "bg-primary/10 border-primary/30 text-primary shadow-sm" : ""
                )}
                disabled={loading}
              >
                <motion.span
                  animate={{ rotate: showFilters ? 90 : 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="flex items-center"
                >
                  <Filter className="h-4 w-4" />
                </motion.span>
                Filters
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs bg-primary/20 text-primary border-none">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
            </motion.div>
          )}

          {getActiveFiltersCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-10 px-3 gap-2 whitespace-nowrap text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
              disabled={loading}
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="relative p-4 sm:p-5 glass backdrop-blur-2xl rounded-[20px] sm:rounded-[24px] border border-border/60 shadow-premium bg-gradient-to-b from-card/30 to-background/50">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:flex md:flex-wrap md:items-end gap-3 sm:gap-4">
                {filters.map(renderFilter)}

                {getActiveFiltersCount() > 0 && (
                  <div className="col-span-2 md:col-span-1 md:ml-auto flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-10 px-4 whitespace-nowrap text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl font-bold transition-all"
                      disabled={loading}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset All
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-2">Active filters:</span>

          {showSearch && searchValue && (
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

            // Find matching filter – also handles dateRange sub-keys (e.g. "createdAtFrom")
            const filter = filters.find((f) => {
              if (f.type === 'dateRange') {
                return key === `${f.key}From` || key === `${f.key}To`
              }
              return f.key === key
            })
            if (!filter) return null

            let displayLabel = filter.label
            let displayValue = value as string
            if (filter.type === 'dateRange') {
              displayLabel = key.endsWith('From') ? `${filter.label} From` : `${filter.label} To`
              try {
                displayValue = format(parseISO(value as string), 'dd-MMM-yyyy')
              } catch (e) {
                displayValue = value as string
              }
            } else {
              displayValue = Array.isArray(value)
                ? `${value.length} selected`
                : filter.options?.find((opt) => opt.value === value)?.label || (value as string)
            }

            return (
              <Badge key={key} variant="secondary" className="gap-1">
                {displayLabel}: {displayValue}
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