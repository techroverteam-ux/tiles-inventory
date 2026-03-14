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
      {/* Search and Filter Toggle */}\n      <div className=\"flex items-center gap-2\">\n        <div className=\"relative flex-1 max-w-sm\">\n          <Search className=\"absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4\" />\n          <Input\n            placeholder={searchPlaceholder}\n            value={localSearch}\n            onChange={(e) => setLocalSearch(e.target.value)}\n            className=\"pl-10 h-9\"\n            disabled={loading}\n          />\n          {localSearch && (\n            <Button\n              variant=\"ghost\"\n              size=\"sm\"\n              onClick={() => setLocalSearch('')}\n              className=\"absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0\"\n            >\n              <X className=\"h-3 w-3\" />\n            </Button>\n          )}\n        </div>\n\n        <Button\n          variant=\"outline\"\n          size=\"sm\"\n          onClick={() => setShowFilters(!showFilters)}\n          className=\"h-9 gap-2\"\n          disabled={loading}\n        >\n          <Filter className=\"h-4 w-4\" />\n          Filters\n          {getActiveFiltersCount() > 0 && (\n            <Badge variant=\"secondary\" className=\"ml-1 h-5 min-w-5 text-xs\">\n              {getActiveFiltersCount()}\n            </Badge>\n          )}\n        </Button>\n\n        {getActiveFiltersCount() > 0 && (\n          <Button\n            variant=\"ghost\"\n            size=\"sm\"\n            onClick={clearAllFilters}\n            className=\"h-9 gap-2 text-muted-foreground\"\n            disabled={loading}\n          >\n            <RotateCcw className=\"h-4 w-4\" />\n            Clear\n          </Button>\n        )}\n      </div>\n\n      {/* Filter Controls */}\n      {showFilters && (\n        <div className=\"flex flex-wrap items-center gap-2 p-4 bg-muted/30 rounded-lg border\">\n          {filters.map(renderFilter)}\n        </div>\n      )}\n\n      {/* Active Filters */}\n      {getActiveFiltersCount() > 0 && (\n        <div className=\"flex flex-wrap items-center gap-2\">\n          <span className=\"text-sm text-muted-foreground\">Active filters:</span>\n          \n          {searchValue && (\n            <Badge variant=\"secondary\" className=\"gap-1\">\n              Search: {searchValue}\n              <Button\n                variant=\"ghost\"\n                size=\"sm\"\n                onClick={() => setLocalSearch('')}\n                className=\"h-4 w-4 p-0 hover:bg-transparent\"\n              >\n                <X className=\"h-3 w-3\" />\n              </Button>\n            </Badge>\n          )}\n          \n          {Object.entries(values).map(([key, value]) => {\n            if (!value || (Array.isArray(value) && value.length === 0)) return null\n            \n            const filter = filters.find(f => f.key === key)\n            if (!filter) return null\n            \n            const displayValue = Array.isArray(value) \n              ? `${value.length} selected`\n              : filter.options?.find(opt => opt.value === value)?.label || value\n            \n            return (\n              <Badge key={key} variant=\"secondary\" className=\"gap-1\">\n                {filter.label}: {displayValue}\n                <Button\n                  variant=\"ghost\"\n                  size=\"sm\"\n                  onClick={() => clearFilter(key)}\n                  className=\"h-4 w-4 p-0 hover:bg-transparent\"\n                >\n                  <X className=\"h-3 w-3\" />\n                </Button>\n              </Badge>\n            )\n          })}\n        </div>\n      )}\n    </div>\n  )\n}\n\n// Hook for managing filter state\nexport function useTableFilters(initialFilters: FilterState = {}, initialSearch = '') {\n  const [filters, setFilters] = useState<FilterState>(initialFilters)\n  const [search, setSearch] = useState(initialSearch)\n\n  const updateFilters = (newFilters: FilterState) => {\n    setFilters(newFilters)\n  }\n\n  const updateSearch = (newSearch: string) => {\n    setSearch(newSearch)\n  }\n\n  const reset = () => {\n    setFilters({})\n    setSearch('')\n  }\n\n  return {\n    filters,\n    search,\n    updateFilters,\n    updateSearch,\n    reset\n  }\n}