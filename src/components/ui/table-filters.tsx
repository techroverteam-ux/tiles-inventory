'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { Search, Filter, X, RotateCcw, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Popover, PopoverButton, PopoverPanel, Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react"
import { Fragment } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

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
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  const [localSearch, setLocalSearch] = useState(searchValue)
  const [pendingValues, setPendingValues] = useState<FilterState>(values)
  const [pendingSearch, setPendingSearch] = useState(searchValue)

  const showFilters = typeof filtersOpen === 'boolean' ? filtersOpen : isOpen

  const setShowFilters = (open: boolean) => {
    if (open) {
      setPendingValues(values)
      setPendingSearch(searchValue)
    }
    if (onFiltersOpenChange) {
      onFiltersOpenChange(open)
    }
    setIsOpen(open)
  }

  // Update local states when props change
  useEffect(() => {
    setLocalSearch(searchValue)
    setPendingSearch(searchValue)
  }, [searchValue])

  useEffect(() => {
    setPendingValues(values)
  }, [values])

  const handleApply = () => {
    onFiltersChange(pendingValues)
    onSearchChange(pendingSearch)
    setShowFilters(false)
  }

  const handleFilterChange = (key: string, value: string | string[]) => {
    setPendingValues(prev => ({ ...prev, [key]: value }))
  }

  const clearFilter = (key: string) => {
    const newFilters = { ...values }
    delete newFilters[key]
    onFiltersChange(newFilters)
    setPendingValues(newFilters)
  }

  const clearAllFilters = () => {
    onFiltersChange({})
    onSearchChange('')
    setPendingValues({})
    setPendingSearch('')
    setLocalSearch('')
  }

  const getActiveFiltersCount = () => {
    const filterCount = Object.keys(values).filter(key => {
      const value = values[key]
      return value && (Array.isArray(value) ? value.length > 0 : value !== '' && value !== 'all')
    }).length
    return filterCount + (showSearch && searchValue ? 1 : 0)
  }

  const renderFilter = (filter: FilterConfig) => {
    const value = pendingValues[filter.key]

    switch (filter.type) {
      case 'select':
        return (
          <div key={filter.key} className="w-full min-w-0 space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">{filter.label}</label>
            <SearchableSelect
              value={value as string || ''}
              onValueChange={(newValue) => handleFilterChange(filter.key, newValue)}
              options={filter.options || []}
              placeholder={filter.placeholder || `All ${filter.label}`}
              disabled={loading}
              className="h-11 rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all"
            />
          </div>
        )

      case 'multiselect':
        const selectedValues = (value as string[]) || []
        return (
          <div key={filter.key} className="w-full min-w-0 space-y-1.5">
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
              <SelectTrigger className="h-11 rounded-2xl border-border/40 bg-muted/20 transition-all focus:ring-2 focus:ring-primary/20 hover:bg-muted/30">
                <SelectValue
                  placeholder={
                    selectedValues.length > 0
                      ? `${selectedValues.length} selected`
                      : filter.placeholder || `Select ${filter.label}`
                  }
                />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-premium border-border/40">
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="rounded-xl m-1">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-4 h-4 rounded border border-primary/30 flex items-center justify-center transition-colors",
                        selectedValues.includes(option.value) ? "bg-primary border-primary" : "bg-transparent"
                      )}>
                        {selectedValues.includes(option.value) && <X className="h-3 w-3 text-white" />}
                      </div>
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
          <div key={filter.key} className="w-full min-w-0 space-y-1.5 col-span-1 sm:col-span-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">{filter.label} Range</label>
            <div className="flex items-center gap-2 w-full">
              <DatePicker
                date={(pendingValues[fromKey] as string) || ''}
                onChange={(date) => {
                  const newDate = date ? date.toISOString().split('T')[0] : ''
                  setPendingValues(prev => ({ ...prev, [fromKey]: newDate }))
                }}
                placeholder="From"
                className="h-11 rounded-2xl bg-muted/20 border-border/40 flex-1"
                disabled={loading}
              />
              <span className="text-muted-foreground/30 text-xs font-bold uppercase shrink-0">to</span>
              <DatePicker
                date={(pendingValues[toKey] as string) || ''}
                onChange={(date) => {
                  const newDate = date ? date.toISOString().split('T')[0] : ''
                  setPendingValues(prev => ({ ...prev, [toKey]: newDate }))
                }}
                placeholder="To"
                className="h-11 rounded-2xl bg-muted/20 border-border/40 flex-1"
                disabled={loading}
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const FilterContent = () => (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="flex-1 py-2 pr-1 no-scrollbar space-y-6">
        {showSearch && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Keyword Search</label>
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors group-focus-within:text-primary" />
              <Input
                placeholder={searchPlaceholder}
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                className="pl-10 h-11 bg-muted/20 border-border/40 focus:bg-background transition-all duration-200 rounded-2xl"
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && handleApply()}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filters.map(renderFilter)}
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-6 mt-4 border-t border-border/40">
        <Button
          onClick={handleApply}
          className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 gap-2"
          disabled={loading}
        >
          Show Results
          <ChevronDown className="h-4 w-4 -rotate-90" />
        </Button>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={clearAllFilters}
            className="flex-1 h-10 rounded-xl text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-wider"
            disabled={loading}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-2" />
            Reset All
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowFilters(false)}
            className="flex-1 h-10 rounded-xl text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-wider md:hidden"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )


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


          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(true)}
            className={cn(
              "h-10 px-4 gap-2 whitespace-nowrap rounded-xl transition-all duration-300 font-bold",
              showFilters || getActiveFiltersCount() > 0 ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" : "bg-background border-border hover:border-primary/50"
            )}
            disabled={loading}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-[10px] bg-white/20 text-white border-none flex items-center justify-center rounded-full p-0">
                {getActiveFiltersCount()}
              </Badge>
            )}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", showFilters && "rotate-180")} />
          </Button>

          <Transition show={showFilters} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setShowFilters(false)}>
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
              </TransitionChild>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 text-center">
                  <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 translate-y-full sm:translate-y-4 sm:scale-95"
                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                    leaveTo="opacity-0 translate-y-full sm:translate-y-4 sm:scale-95"
                  >
                    <DialogPanel className="w-full max-w-lg transform rounded-t-[2.5rem] sm:rounded-[2rem] bg-background p-6 sm:p-8 text-left align-middle shadow-2xl transition-all border-x border-t sm:border border-border/40">
                      <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6 sm:hidden" />
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <DialogTitle as="h3" className="text-2xl font-bold tracking-tight text-foreground">
                            Filter Results
                          </DialogTitle>
                          <p className="text-sm text-muted-foreground mt-1">Refine what you're looking for</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="h-10 w-10 p-0 rounded-full hover:bg-muted font-bold">
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                      <FilterContent />
                    </DialogPanel>
                  </TransitionChild>
                </div>
              </div>
            </Dialog>
          </Transition>

          {getActiveFiltersCount() > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 min-w-0 max-w-xs sm:max-w-md md:max-w-lg">
              {showSearch && searchValue && (
                <Badge variant="secondary" className="pl-2 pr-0.5 py-0 h-7 rounded-lg border-primary/20 bg-primary/5 text-primary gap-1 font-bold text-[10px] group hover:bg-primary/10 transition-colors">
                  <Search className="h-2.5 w-2.5 opacity-50" />
                  <span className="max-w-[80px] truncate">{searchValue}</span>
                  <Button variant="ghost" size="sm" onClick={() => onSearchChange('')} className="h-5 w-5 p-0 hover:bg-primary hover:text-white rounded-full transition-all">
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {Object.entries(values).map(([key, value]) => {
                if (!value || (Array.isArray(value) && value.length === 0) || value === 'all') return null
                const filter = filters.find((f) => f.type === 'dateRange' ? (key === `${f.key}From` || key === `${f.key}To`) : f.key === key)
                if (!filter) return null
                let label = filter.label
                let display = Array.isArray(value) ? `${value.length} selected` : filter.options?.find((opt) => opt.value === value)?.label || (value as string)
                if (filter.type === 'dateRange') {
                  label = key.endsWith('From') ? `${filter.label} From` : `${filter.label} To`
                  try { display = format(parseISO(value as string), 'dd-MMM') } catch (e) { }
                }
                return (
                  <Badge key={key} variant="secondary" className="pl-2 pr-0.5 py-0 h-7 rounded-lg border-border/50 bg-background text-foreground gap-1 font-bold text-[10px] group hover:border-primary/30 transition-all">
                    <span className="text-muted-foreground opacity-60">{label.split(' ')[0]}:</span>
                    <span className="max-w-[80px] truncate text-primary">{display}</span>
                    <Button variant="ghost" size="sm" onClick={() => clearFilter(key)} className="h-5 w-5 p-0 hover:bg-destructive hover:text-white rounded-full transition-all">
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )
              })}
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive group">
                <RotateCcw className="h-3.5 w-3.5 group-hover:rotate-180 transition-transform duration-500" />
              </Button>
            </div>
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



      {/* Active Filters */}
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