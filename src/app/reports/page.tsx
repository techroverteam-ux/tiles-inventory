'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LoadingPage } from '@/components/ui/skeleton'
import { ExportButton, ExportColumn } from '@/lib/excel-export'
import { BarChart3, Calendar, Filter, Search } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'

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
    <div className="page-container">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle mt-1">Generate and export Sales, Purchase, and Inventory reports</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters((prev) => !prev)}>
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            Filters
          </Button>
          <ExportButton
            data={rows}
            columns={excelColumns}
            filename={reportType === 'sales' ? 'sales-report' : reportType === 'purchase' ? 'purchase-report' : 'inventory-report'}
            sheetName={reportTitle}
            reportTitle={`${reportTitle} (${formatDateDisplay(dateFrom)} to ${formatDateDisplay(dateTo)})`}
            headerColor={COMPANY_LOGO_HEADER_COLOR}
            disabled={rows.length === 0}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {showFilters && (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Calendar className="h-5 w-5 text-primary" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Report Type</label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Report</SelectItem>
                  <SelectItem value="purchase">Purchase Report</SelectItem>
                  <SelectItem value="inventory">Inventory Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">From Date</label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  type="text"
                  value={dateFrom ? formatDateDisplay(dateFrom) : ''}
                  placeholder="DD-MMM-YYYY"
                  readOnly
                  onClick={() => openNativeDatePicker(fromDateInputRef)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openNativeDatePicker(fromDateInputRef)}
                  aria-label="Open from date calendar"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
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

            <div>
              <label className="text-sm font-medium text-foreground">To Date</label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  type="text"
                  value={dateTo ? formatDateDisplay(dateTo) : ''}
                  placeholder="DD-MMM-YYYY"
                  readOnly
                  onClick={() => openNativeDatePicker(toDateInputRef)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openNativeDatePicker(toDateInputRef)}
                  aria-label="Open to date calendar"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
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

            <div>
              <label className="text-sm font-medium text-foreground">Brand</label>
              <Select value={brandId || '__all__'} onValueChange={(value) => setBrandId(value === '__all__' ? '' : value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All brands</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Category</label>
              <Select value={categoryId || '__all__'} onValueChange={(value) => setCategoryId(value === '__all__' ? '' : value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All categories</SelectItem>
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Size</label>
              <Select value={sizeId || '__all__'} onValueChange={(value) => setSizeId(value === '__all__' ? '' : value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All sizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All sizes</SelectItem>
                  {filteredSizes.map((size) => (
                    <SelectItem key={size.id} value={size.id}>{size.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Location</label>
              <Select value={locationId || '__all__'} onValueChange={(value) => setLocationId(value === '__all__' ? '' : value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={searchReport} disabled={loading} className="min-w-32">
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>
      )}

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <BarChart3 className="h-5 w-5 text-primary" />
            {reportTitle}
          </CardTitle>
          <ExportButton
            data={rows}
            columns={excelColumns}
            filename={reportType === 'sales' ? 'sales-report' : reportType === 'purchase' ? 'purchase-report' : 'inventory-report'}
            sheetName={reportTitle}
            reportTitle={`${reportTitle} (${formatDateDisplay(dateFrom)} to ${formatDateDisplay(dateTo)})`}
            headerColor={COMPANY_LOGO_HEADER_COLOR}
            disabled={rows.length === 0}
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingPage view="list" showHeader={false} items={8} />
          ) : rows.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Click Search to generate report data and view it in table.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.key} className="font-semibold">{column.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={index}>
                      {columns.map((column) => (
                        <TableCell key={`${index}-${column.key}`}>
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