'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableSkeleton } from '@/components/ui/skeleton'
import { ExportButton, ExportColumn, commonColumns } from '@/lib/excel-export'
import { PageExportButton } from '@/components/reports/PageExport'
import { BarChart3, Calendar, Filter, Search, PieChart, TrendingUp, Clock, CalendarRange, LayoutGrid } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'
import { DesignStockReportView } from '@/components/reports/DesignStockReport'

type ReportType = 'sales' | 'purchase' | 'inventory'
type TabType = 'standard' | 'design-stock'

const COMPANY_LOGO_HEADER_COLOR = '#1E40AF'

interface ReportColumn { key: string; label: string }

export default function ReportsPage() {
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState<TabType>('standard')
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
  const [dateMode, setDateMode] = useState<'alltime' | 'custom'>('custom')

  // Design stock state
  const [dsLoading, setDsLoading] = useState(false)
  const [dsBrands, setDsBrands] = useState<any[]>([])
  const [dsGrandTotal, setDsGrandTotal] = useState(0)
  const [dsLoaded, setDsLoaded] = useState(false)
  const [dsPartyName, setDsPartyName] = useState('')

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
    const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getMonth()]
    return `${day}-${month}-${date.getFullYear()}`
  }

  const exportReportTitle = useMemo(() => {
    const base = reportTitle
    if (dateMode === 'alltime') return `${base} (All Time)`
    if (dateFrom && dateTo) return `${base} (${formatDateDisplay(dateFrom)} to ${formatDateDisplay(dateTo)})`
    return base
  }, [reportTitle, dateMode, dateFrom, dateTo])

  const formatCellValue = (key: string, value: any) => {
    if (value === null || value === undefined) return '-'
    if (key.toLowerCase().includes('date')) {
      const date = new Date(value)
      if (!Number.isNaN(date.getTime())) return formatDateDisplay(date)
    }
    if (typeof value === 'number' && (key.toLowerCase().includes('price') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('value'))) {
      return value.toLocaleString('en-IN', { maximumFractionDigits: 2 })
    }
    return String(value)
  }

  const excelColumns: ExportColumn[] = useMemo(() =>
    columns.map(col => ({ key: col.key, label: col.label, width: 18, format: (v: any) => formatCellValue(col.key, v) })),
    [columns]
  )

  const fetchFilters = async () => {
    try {
      const [b, c, s, l] = await Promise.all([
        fetch('/api/brands?limit=1000&isActive=true'),
        fetch('/api/categories?limit=1000&isActive=true'),
        fetch('/api/sizes?limit=1000&isActive=true'),
        fetch('/api/locations?limit=1000&isActive=true'),
      ])
      const [bd, cd, sd, ld] = await Promise.all([b.json(), c.json(), s.json(), l.json()])
      setBrands(bd.brands || [])
      setCategories(cd.categories || [])
      setSizes(sd.sizes || [])
      setLocations(ld.locations || [])
    } catch {
      showToast('Failed to fetch filters', 'error')
    }
  }

  useEffect(() => { fetchFilters() }, [])

  useEffect(() => {
    if (!brandId) { setCategoryId(''); setSizeId(''); return }
    if (categoryId) {
      const cat = categories.find(c => c.id === categoryId)
      if (cat?.brandId !== brandId) { setCategoryId(''); setSizeId('') }
    }
  }, [brandId])

  useEffect(() => {
    if (!categoryId) { setSizeId(''); return }
    if (sizeId) {
      const sz = sizes.find(s => s.id === sizeId)
      if (sz?.categoryId !== categoryId) setSizeId('')
    }
  }, [categoryId])

  const filteredCategories = useMemo(() => brandId ? categories.filter(c => c.brandId === brandId) : categories, [categories, brandId])
  const filteredSizes = useMemo(() => sizes.filter(s => {
    const mb = brandId ? s.brandId === brandId : true
    const mc = categoryId ? s.categoryId === categoryId : true
    return mb && mc
  }), [sizes, brandId, categoryId])

  const searchReport = async () => {
    if (dateMode === 'custom') {
      if (!dateFrom || !dateTo) { showToast('Please select a date range', 'warning'); return }
      if (new Date(dateFrom) > new Date(dateTo)) { showToast('From date cannot be after To date', 'warning'); return }
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({
        reportType,
        ...(dateMode === 'custom' && dateFrom ? { dateFrom } : {}),
        ...(dateMode === 'custom' && dateTo ? { dateTo } : {}),
        ...(brandId ? { brandId } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(sizeId ? { sizeId } : {}),
        ...(locationId ? { locationId } : {}),
      })
      const res = await fetch(`/api/reports?${params}`)
      if (!res.ok) { const e = await res.json(); showToast(e.error || 'Failed to load report', 'error'); return }
      const data = await res.json()
      setColumns(data.columns || [])
      setRows(data.rows || [])
      showToast(`${reportTitle} loaded`, 'success')
    } catch { showToast('Failed to search report', 'error') }
    finally { setLoading(false) }
  }

  const loadDesignStock = async () => {
    setDsLoading(true)
    try {
      const params = new URLSearchParams({
        ...(brandId ? { brandId } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(sizeId ? { sizeId } : {}),
        ...(locationId ? { locationId } : {}),
      })
      const res = await fetch(`/api/reports/design-stock?${params}`)
      if (!res.ok) { showToast('Failed to load design stock report', 'error'); return }
      const data = await res.json()
      setDsBrands(data.brands || [])
      setDsGrandTotal(data.grandTotal || 0)
      setDsPartyName(brandId ? (brands.find(b => b.id === brandId)?.name || '') : '')
      setDsLoaded(true)
      showToast('Design Stock Report loaded', 'success')
    } catch { showToast('Failed to load design stock report', 'error') }
    finally { setDsLoading(false) }
  }

  const makeReportExportRows = useMemo(() => rows.map(row => ({
    col1: columns[1] ? formatCellValue(columns[1].key, row[columns[1].key]) : '',
    col2: columns[2] ? formatCellValue(columns[2].key, row[columns[2].key]) : '',
    col3: columns[0] ? formatCellValue(columns[0].key, row[columns[0].key]) : '',
    badge: row['status'] || row['isActive'] !== undefined ? (row['isActive'] ? 'Active' : row['status'] || '') : undefined,
  })), [rows, columns])

  const pageExportConfig = useMemo(() => ({
    title: exportReportTitle,
    rows: makeReportExportRows,
    grandTotal: rows.length,
    grandTotalLabel: 'Total Records',
    excelColumns: excelColumns,
    excelData: rows,
    filename: reportType === 'sales' ? 'sales-report' : reportType === 'purchase' ? 'purchase-report' : 'inventory-report',
    sheetName: reportTitle,
    fetchAllData: async () => {
      const params = new URLSearchParams({
        reportType,
        ...(dateMode === 'custom' && dateFrom ? { dateFrom } : {}),
        ...(dateMode === 'custom' && dateTo ? { dateTo } : {}),
        ...(brandId ? { brandId } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(sizeId ? { sizeId } : {}),
        ...(locationId ? { locationId } : {}),
      })
      const res = await fetch(`/api/reports?${params}`)
      const data = await res.json()
      const allRows = data.rows || []
      return {
        rows: allRows.map((row: any) => ({
          col1: columns[1] ? formatCellValue(columns[1].key, row[columns[1].key]) : '',
          col2: columns[2] ? formatCellValue(columns[2].key, row[columns[2].key]) : '',
          col3: columns[0] ? formatCellValue(columns[0].key, row[columns[0].key]) : '',
          badge: row['status'] || undefined,
        })),
        excelData: allRows,
      }
    },
  }), [makeReportExportRows, rows, exportReportTitle, excelColumns, reportTitle, reportType, dateMode, dateFrom, dateTo, brandId, categoryId, sizeId, locationId, columns])

  const filterBar = (
    <Card className="border-border/50 rounded-3xl overflow-hidden glass-card shadow-premium animate-in slide-in-from-top-4 duration-300">
      <CardHeader className="pb-4 border-b border-border/30 bg-muted/20">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
          <div className="p-2 rounded-xl bg-primary/10 text-primary"><Calendar className="h-5 w-5" /></div>
          Report Parameters
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeTab === 'standard' && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 ml-1">Report Category</label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger className="rounded-2xl bg-muted/20 border-border/40 h-12"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="sales">Sales Transactions</SelectItem>
                  <SelectItem value="purchase">Inventory Purchases</SelectItem>
                  <SelectItem value="inventory">Batch Stock Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {activeTab === 'standard' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 ml-1">Date Range</label>
                <div className="flex rounded-2xl border border-border/40 overflow-hidden h-12 bg-muted/20">
                  <button type="button" onClick={() => setDateMode('alltime')}
                    className={cn('flex-1 flex items-center justify-center gap-1.5 text-xs font-bold transition-all',
                      dateMode === 'alltime' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50')}>
                    <Clock className="h-3.5 w-3.5" />All Time
                  </button>
                  <button type="button" onClick={() => setDateMode('custom')}
                    className={cn('flex-1 flex items-center justify-center gap-1.5 text-xs font-bold transition-all',
                      dateMode === 'custom' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50')}>
                    <CalendarRange className="h-3.5 w-3.5" />Custom
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className={cn('text-sm font-bold ml-1', dateMode === 'alltime' ? 'text-muted-foreground/40' : 'text-foreground/80')}>Period From</label>
                <DatePicker date={dateFrom} onChange={(d) => setDateFrom(d ? d.toISOString().split('T')[0] : '')} placeholder="From Date" disabled={dateMode === 'alltime'} />
              </div>
              <div className="space-y-2">
                <label className={cn('text-sm font-bold ml-1', dateMode === 'alltime' ? 'text-muted-foreground/40' : 'text-foreground/80')}>Period To</label>
                <DatePicker date={dateTo} onChange={(d) => setDateTo(d ? d.toISOString().split('T')[0] : '')} placeholder="To Date" disabled={dateMode === 'alltime'} />
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground/80 ml-1">Brand</label>
            <Select value={brandId || '__all__'} onValueChange={(v) => setBrandId(v === '__all__' ? '' : v)}>
              <SelectTrigger className="rounded-2xl bg-muted/20 border-border/40 h-12"><SelectValue placeholder="All Brands" /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="__all__">All Brands</SelectItem>
                {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground/80 ml-1">Category</label>
            <Select value={categoryId || '__all__'} onValueChange={(v) => setCategoryId(v === '__all__' ? '' : v)}>
              <SelectTrigger className="rounded-2xl bg-muted/20 border-border/40 h-12"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="__all__">All Categories</SelectItem>
                {filteredCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground/80 ml-1">Size</label>
            <Select value={sizeId || '__all__'} onValueChange={(v) => setSizeId(v === '__all__' ? '' : v)}>
              <SelectTrigger className="rounded-2xl bg-muted/20 border-border/40 h-12"><SelectValue placeholder="All Sizes" /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="__all__">All Sizes</SelectItem>
                {filteredSizes.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground/80 ml-1">Location</label>
            <Select value={locationId || '__all__'} onValueChange={(v) => setLocationId(v === '__all__' ? '' : v)}>
              <SelectTrigger className="rounded-2xl bg-muted/20 border-border/40 h-12"><SelectValue placeholder="All Locations" /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="__all__">All Locations</SelectItem>
                {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {activeTab === 'design-stock' && (
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <label className="text-sm font-bold text-foreground/80 ml-1">Party Name (optional)</label>
              <Input
                value={dsPartyName}
                onChange={e => setDsPartyName(e.target.value)}
                placeholder="e.g. MAHESHWARI MARBLE INDUSTRIES"
                className="rounded-2xl bg-muted/20 border-border/40 h-12"
              />
            </div>
          )}

          <div className="flex items-end">
            <Button
              onClick={activeTab === 'standard' ? searchReport : loadDesignStock}
              disabled={loading || dsLoading}
              className="w-full rounded-2xl h-12 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Search className="h-5 w-5 mr-2" />
              {(loading || dsLoading) ? 'Loading...' : 'Generate Report'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 space-y-6 pb-10">
      {/* Header */}
      <div className="page-header">
        <div className="space-y-1">
          <h1 className="page-title">Analytics & Reports</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary/60" />
            Generate insights and export data for your business
          </p>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => setShowFilters(p => !p)}
          className={cn('rounded-xl border-border/50 font-bold gap-2 transition-all',
            showFilters ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted/50')}
        >
          <Filter className="h-4 w-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveTab('standard')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border',
            activeTab === 'standard'
              ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
              : 'border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30'
          )}
        >
          <BarChart3 className="h-4 w-4" />
          Standard Reports
        </button>
        <button
          onClick={() => setActiveTab('design-stock')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border',
            activeTab === 'design-stock'
              ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
              : 'border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30'
          )}
        >
          <LayoutGrid className="h-4 w-4" />
          Design Stock Report
        </button>
      </div>

      {showFilters && filterBar}

      {/* Standard Reports */}
      {activeTab === 'standard' && (
        <Card className="border-border/50 rounded-3xl overflow-hidden glass-card shadow-premium">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/30 bg-muted/20 flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <div className="p-2 rounded-xl bg-primary/10 text-primary"><BarChart3 className="h-5 w-5" /></div>
              {reportTitle}
            </CardTitle>
            <PageExportButton
              config={pageExportConfig}
              disabled={rows.length === 0}
              className="rounded-xl font-bold border-border/50"
            />
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <TableSkeleton rows={8} columns={columns.length || 6} className="border-0 rounded-none" />
            ) : rows.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center justify-center gap-4">
                <div className="p-6 rounded-full bg-muted/20 text-muted-foreground">
                  <PieChart className="h-12 w-12 opacity-20" />
                </div>
                <div className="max-w-xs">
                  <p className="text-lg font-bold text-foreground/50">No Data to Display</p>
                  <p className="text-sm text-muted-foreground mt-1">Configure your filters and click 'Generate Report'.</p>
                </div>
              </div>
            ) : (
              <div className="table-container overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/50 bg-muted/30">
                      {columns.map(col => (
                        <TableHead key={col.key} className="font-bold text-foreground py-4 px-6 uppercase tracking-wider text-[10px]">{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={i} className="border-b border-border/20 hover:bg-muted/10 transition-colors group">
                        {columns.map(col => (
                          <TableCell key={`${i}-${col.key}`} className="py-4 px-6 font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                            {formatCellValue(col.key, row[col.key])}
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
      )}

      {/* Design Stock Report */}
      {activeTab === 'design-stock' && (
        <Card className="border-border/50 rounded-3xl overflow-hidden glass-card shadow-premium">
          <CardHeader className="pb-4 border-b border-border/30 bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <div className="p-2 rounded-xl bg-primary/10 text-primary"><LayoutGrid className="h-5 w-5" /></div>
              Design Stock Report
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {dsLoading ? (
              <TableSkeleton rows={6} columns={4} className="border-0 rounded-none" />
            ) : !dsLoaded ? (
              <div className="text-center py-20 flex flex-col items-center justify-center gap-4">
                <div className="p-6 rounded-full bg-muted/20 text-muted-foreground">
                  <LayoutGrid className="h-12 w-12 opacity-20" />
                </div>
                <div className="max-w-xs">
                  <p className="text-lg font-bold text-foreground/50">Design Stock Report</p>
                  <p className="text-sm text-muted-foreground mt-1">Apply filters and click 'Generate Report' to view the design stock with tile images.</p>
                </div>
              </div>
            ) : dsBrands.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">No stock found for selected filters.</div>
            ) : (
              <DesignStockReportView brands={dsBrands} grandTotal={dsGrandTotal} partyName={dsPartyName || undefined} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
