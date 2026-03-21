'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LoadingPage } from '@/components/ui/skeleton'
import { ExportButton, ExportColumn } from '@/lib/excel-export'
import { BarChart3, Calendar, Filter, Search, PieChart, TrendingUp } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { cn } from '@/lib/utils'

type ReportType = 'sales' | 'purchase' | 'inventory'

const COMPANY_LOGO_HEADER_COLOR = '#1E40AF'

interface ReportColumn {
  key: string
  label: string
}

export default function ReportsPage() {
  const { showToast } = useToast()
  const fromDateInputRef = useRef<HTMLInputElement>(null)
  const toDateInputRef = useRef<HTMLInputElement>(null)

  const [reportType, setReportType] = useState<ReportType>('sales')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [brandId, setBrandId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [sizeId, setSizeId] = useState('')
  const [locationId, setLocationId] = useState('')

  const [brands, setBrands] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [sizes, setSizes] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])

  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  const [columns, setColumns] = useState<ReportColumn[]>([])
  const [rows, setRows] = useState<any[]>([])

  const reportTitle = useMemo(() => {
    if (reportType === 'sales') return 'Sales Report'
    if (reportType === 'purchase') return 'Purchase Report'
    return 'Inventory Report'
  }, [reportType])

  const formatDateDisplay = (value: string | Date) => {
    if (!value) return ''
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)

    const day = String(date.getDate()).padStart(2, '0')
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]
    const year = date.getFullYear()

    return `${day}-${month}-${year}`
  }

  const openNativeDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const input = ref.current
    if (!input) return

    const pickerInput = input as HTMLInputElement & { showPicker?: () => void }
    if (pickerInput.showPicker) {
      pickerInput.showPicker()
    } else {
      input.focus()
    }
  }

  const formatCellValue = (key: string, value: any) => {
    if (value === null || value === undefined) return '-'
    if (key.toLowerCase().includes('date')) {
      const date = new Date(value)
      if (!Number.isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0')
        const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]
        return `${day}-${month}-${date.getFullYear()}`
      }
    }
    if (typeof value === 'number' && (key.toLowerCase().includes('price') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('value'))) {
      return value.toLocaleString('en-IN', { maximumFractionDigits: 2 })
    }
    return String(value)
  }

  const excelColumns: ExportColumn[] = useMemo(() => {
    return columns.map((column) => ({
      key: column.key,
      label: column.label,
      width: 18,
      format: (value: any) => formatCellValue(column.key, value),
    }))
  }, [columns])

  const fetchFilters = async () => {
    try {
      const [brandsRes, categoriesRes, sizesRes, locationsRes] = await Promise.all([
        fetch('/api/brands?limit=1000&isActive=true'),
        fetch('/api/categories?limit=1000&isActive=true'),
        fetch('/api/sizes?limit=1000&isActive=true'),
        fetch('/api/locations?limit=1000&isActive=true'),
      ])

      const [brandsData, categoriesData, sizesData, locationsData] = await Promise.all([
        brandsRes.json(),
        categoriesRes.json(),
        sizesRes.json(),
        locationsRes.json(),
      ])

      setBrands(brandsData.brands || [])
      setCategories(categoriesData.categories || [])
      setSizes(sizesData.sizes || [])
      setLocations(locationsData.locations || [])
    } catch (error) {
      showToast('Failed to fetch report filters', 'error')
    }
  }

  useEffect(() => {
    fetchFilters()
  }, [])

  useEffect(() => {
    if (!brandId) {
      setCategoryId('')
      setSizeId('')
      return
    }
    if (categoryId) {
      const category = categories.find(c => c.id === categoryId)
      if (category?.brandId !== brandId) {
        setCategoryId('')
        setSizeId('')
      }
    }
  }, [brandId, categoryId, categories])

  useEffect(() => {
    if (!categoryId) {
      setSizeId('')
      return
    }
    if (sizeId) {
      const size = sizes.find(s => s.id === sizeId)
      if (size?.categoryId !== categoryId) {
        setSizeId('')
      }
    }
  }, [categoryId, sizeId, sizes])

  const filteredCategories = useMemo(() => {
    if (!brandId) return categories
    return categories.filter(c => c.brandId === brandId)
  }, [categories, brandId])

  const filteredSizes = useMemo(() => {
    if (!brandId && !categoryId) return sizes
    return sizes.filter(s => {
      const matchBrand = brandId ? s.brandId === brandId : true
      const matchCategory = categoryId ? s.categoryId === categoryId : true
      return matchBrand && matchCategory
    })
  }, [sizes, brandId, categoryId])

  const searchReport = async () => {
    if (!dateFrom || !dateTo) {
      showToast('Please select date range using calendar', 'warning')
      return
    }

    if (new Date(dateFrom).getTime() > new Date(dateTo).getTime()) {
      showToast('From date cannot be after To date', 'warning')
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        reportType,
        dateFrom,
        dateTo,
        ...(brandId ? { brandId } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(sizeId ? { sizeId } : {}),
        ...(locationId ? { locationId } : {}),
      })

      const response = await fetch(`/api/reports?${params}`)
      if (!response.ok) {
        const error = await response.json()
        showToast(error.error || 'Failed to load report', 'error')
        return
      }

      const data = await response.json()
      setColumns(data.columns || [])
      setRows(data.rows || [])
      showToast(`${reportTitle} loaded`, 'success')
    } catch (error) {
      showToast('Failed to search report', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 space-y-8 pb-10">
      {/* Header */}
      <div className="page-header">
        <div className="space-y-1">
          <h1 className="page-title">Analytics & Reports</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary/60" />
            Generate insights and export data for your business
          </p>
        </div>
        <div className="flex flex-wrap gap-2 pt-2 sm:pt-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters((prev) => !prev)}
            className={cn(
              "rounded-xl border-border/50 font-bold gap-2 transition-all",
              showFilters ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50"
            )}
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <ExportButton
            data={rows}
            columns={excelColumns}
            filename={reportType === 'sales' ? 'sales-report' : reportType === 'purchase' ? 'purchase-report' : 'inventory-report'}
            sheetName={reportTitle}
            reportTitle={`${reportTitle} (${formatDateDisplay(dateFrom)} to ${formatDateDisplay(dateTo)})`}
            headerColor={COMPANY_LOGO_HEADER_COLOR}
            disabled={rows.length === 0}
            className="w-full sm:w-auto rounded-xl font-bold shadow-lg shadow-primary/10"
          />
        </div>
      </div>

      {showFilters && (
        <Card className="border-border/50 rounded-3xl overflow-hidden glass-card shadow-premium animate-in slide-in-from-top-4 duration-300">
          <CardHeader className="pb-4 border-b border-border/30 bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              Report Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2 lg:col-span-1">
                <label className="text-sm font-bold text-foreground/80 ml-1">Report Category</label>
                <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                  <SelectTrigger className="rounded-2xl bg-muted/20 border-border/40 transition-all h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="sales">Sales Transactions</SelectItem>
                    <SelectItem value="purchase">Inventory Purchases</SelectItem>
                    <SelectItem value="inventory">Batch Stock Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 ml-1">Period From</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 group">
                    <Input
                      type="text"
                      value={dateFrom ? formatDateDisplay(dateFrom) : ''}
                      placeholder="DD-MMM-YYYY"
                      readOnly
                      className="rounded-2xl bg-muted/20 border-border/40 h-12 pr-10 cursor-pointer hover:bg-muted/30 transition-all"
                      onClick={() => openNativeDatePicker(fromDateInputRef)}
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors pointer-events-none" />
                  </div>
                  <input
                    ref={fromDateInputRef}
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="sr-only"
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 ml-1">Period To</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 group">
                    <Input
                      type="text"
                      value={dateTo ? formatDateDisplay(dateTo) : ''}
                      placeholder="DD-MMM-YYYY"
                      readOnly
                      className="rounded-2xl bg-muted/20 border-border/40 h-12 pr-10 cursor-pointer hover:bg-muted/30 transition-all"
                      onClick={() => openNativeDatePicker(toDateInputRef)}
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors pointer-events-none" />
                  </div>
                  <input
                    ref={toDateInputRef}
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="sr-only"
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 ml-1">Brand</label>
                <Select value={brandId || '__all__'} onValueChange={(value) => setBrandId(value === '__all__' ? '' : value)}>
                  <SelectTrigger className="rounded-2xl bg-muted/20 border-border/40 transition-all h-12">
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="__all__">All Brands</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 ml-1">Category</label>
                <Select value={categoryId || '__all__'} onValueChange={(value) => setCategoryId(value === '__all__' ? '' : value)}>
                  <SelectTrigger className="rounded-2xl bg-muted/20 border-border/40 transition-all h-12">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="__all__">All Categories</SelectItem>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 ml-1">Size Specification</label>
                <Select value={sizeId || '__all__'} onValueChange={(value) => setSizeId(value === '__all__' ? '' : value)}>
                  <SelectTrigger className="rounded-2xl bg-muted/20 border-border/40 transition-all h-12">
                    <SelectValue placeholder="All Sizes" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="__all__">All Sizes</SelectItem>
                    {filteredSizes.map((size) => (
                      <SelectItem key={size.id} value={size.id}>{size.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 ml-1">Physical Location</label>
                <Select value={locationId || '__all__'} onValueChange={(value) => setLocationId(value === '__all__' ? '' : value)}>
                  <SelectTrigger className="rounded-2xl bg-muted/20 border-border/40 transition-all h-12">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="__all__">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end lg:col-span-1">
                <Button 
                  onClick={searchReport} 
                  disabled={loading} 
                  className="w-full rounded-2xl h-12 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Search className="h-5 w-5 mr-2" />
                  {loading ? 'Searching...' : 'Explore Data'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 rounded-3xl overflow-hidden glass-card shadow-premium">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/30 bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            {reportTitle} Visualized
          </CardTitle>
          <ExportButton
            data={rows}
            columns={excelColumns}
            filename={reportType === 'sales' ? 'sales-report' : reportType === 'purchase' ? 'purchase-report' : 'inventory-report'}
            sheetName={reportTitle}
            reportTitle={`${reportTitle} (${formatDateDisplay(dateFrom)} to ${formatDateDisplay(dateTo)})`}
            headerColor={COMPANY_LOGO_HEADER_COLOR}
            disabled={rows.length === 0}
            className="rounded-xl font-bold border-border/50"
          />
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10">
              <LoadingPage view="list" showHeader={false} items={8} />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center justify-center gap-4">
              <div className="p-6 rounded-full bg-muted/20 text-muted-foreground">
                <PieChart className="h-12 w-12 opacity-20" />
              </div>
              <div className="max-w-xs">
                <p className="text-lg font-bold text-foreground/50">No Data to Display</p>
                <p className="text-sm text-muted-foreground mt-1">Configure your filters and click 'Explore Data' to generate insights here.</p>
              </div>
            </div>
          ) : (
            <div className="table-container">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/50 bg-muted/30">
                    {columns.map((column) => (
                      <TableHead key={column.key} className="font-bold text-foreground py-4 px-6 uppercase tracking-wider text-[10px]">{column.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={index} className="border-b border-border/20 hover:bg-muted/10 transition-colors group">
                      {columns.map((column) => (
                        <TableCell key={`${index}-${column.key}`} className="py-4 px-6 font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                          {formatCellValue(column.key, row[column.key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}