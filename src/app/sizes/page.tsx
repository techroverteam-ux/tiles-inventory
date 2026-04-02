'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/contexts/ToastContext'
import { DataView } from '@/components/ui/data-view'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmationDialog, useDeleteConfirmation } from '@/components/ui/confirmation-dialog'
import { Pagination, usePagination } from '@/components/ui/pagination'
import { TableFilters, useTableFilters, FilterConfig } from '@/components/ui/table-filters'
import { commonColumns } from '@/lib/excel-export'
import { PageExportButton } from '@/components/reports/PageExport'
import { LoadingPage } from '@/components/ui/skeleton'
import { Filter, Plus, Edit, Trash2, Package, Ruler } from 'lucide-react'
import { RowDetailsDialog } from '@/components/ui/row-details-dialog'
import { cn, formatMmToFeetInches } from '@/lib/utils'
import { useResponsiveDefaultView } from '@/hooks/use-responsive-default-view'

interface Size {
  id: string
  name: string
  description?: string
  length?: number
  width?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: {
    name: string
    email: string
  }
  updatedBy?: {
    name: string
    email: string
  }
  _count?: {
    products: number
  }
}

interface Brand {
  id: string
  name: string
  isActive: boolean
}

interface Category {
  id: string
  name: string
  isActive: boolean
}

interface FormData {
  name: string
  description: string
  length: string
  width: string
  isActive: boolean
}

interface SizeEntry {
  name: string
  description: string
  length: string
  width: string
  isActive: boolean
}

interface ApiResponse {
  sizes: Size[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export default function SizesPage() {
  const [sizes, setSizes] = useState<Size[]>([])
  const [loading, setLoading] = useState(true)
  const { view, setView } = useResponsiveDefaultView()
  const [showForm, setShowForm] = useState(false)
  const [editingSize, setEditingSize] = useState<Size | null>(null)
  const [deleteSize, setDeleteSize] = useState<Size | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedDetailItem, setSelectedDetailItem] = useState<Size | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    length: '',
    width: '',
    isActive: true
  })
  const [entries, setEntries] = useState<SizeEntry[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const deleteConfirmation = useDeleteConfirmation()

  // Pagination
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange
  } = usePagination(1, 5)

  // Filters
  const {
    filters,
    search,
    updateFilters,
    updateSearch
  } = useTableFilters()

  // Filter configurations
  const filterConfigs: FilterConfig[] = useMemo(() => [

    {
      key: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ],
      placeholder: 'All Status',
      defaultValue: 'all'
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      type: 'dateRange',
    }
  ], [])

  // Fetch sizes with pagination and filters
  const fetchSizes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: search || '',
      })
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '' && value !== 'all') params.append(key, value as string)
      })

      const response = await fetch(`/api/sizes?${params}`)
      if (response.ok) {
        const data: ApiResponse = await response.json()
        setSizes(data.sizes || [])
        setTotalCount(data.totalCount || 0)
        setTotalPages(data.totalPages || 0)
      } else {
        showToast('Failed to fetch sizes', 'error')
      }
    } catch (error) {
      showToast('Error fetching sizes', 'error')
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, search, filters, showToast])

  useEffect(() => {
    fetchSizes()
  }, [fetchSizes])



  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setEditingSize(null)
      resetForm()
      setShowForm(true)
    }
  }, [searchParams])



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalName = formData.name.trim() || (formData.length && formData.width ? `${formData.length}x${formData.width}mm` : '')

    if (!finalName) {
      showToast('Please enter a name or provide length and width', 'error')
      return
    }

    setSubmitting(true)
    try {
      if (editingSize) {
        const response = await fetch(`/api/sizes/${editingSize.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            name: finalName,
            length: formData.length ? parseFloat(formData.length) : undefined,
            width: formData.width ? parseFloat(formData.width) : undefined
          })
        })
        if (response.ok) {
          showToast('Size updated successfully!', 'success')
          setShowForm(false)
          setEditingSize(null)
          resetForm()
          fetchSizes()
        } else {
          const errorData = await response.json()
          showToast(errorData.error || 'Failed to save size', 'error')
        }
      } else {
        const allEntries = [...entries, { ...formData, name: finalName }].filter(e => e.name.trim())
        let successCount = 0
        const errors: string[] = []
        for (const entry of allEntries) {
          const entryName = entry.name.trim() || (entry.length && entry.width ? `${entry.length}x${entry.width}mm` : entry.name)
          const response = await fetch('/api/sizes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...entry,
              name: entryName,
              length: entry.length ? parseFloat(entry.length) : undefined,
              width: entry.width ? parseFloat(entry.width) : undefined
            })
          })
          if (response.ok) {
            successCount++
          } else {
            const errorData = await response.json()
            errors.push(errorData.error || `Failed to create "${entryName}"`)
          }
        }
        if (successCount > 0) {
          showToast(`${successCount} size(s) created successfully!`, 'success')
          setShowForm(false)
          setEntries([])
          resetForm()
          fetchSizes()
        }
        if (errors.length > 0) {
          showToast(errors.join(' | '), 'error')
        }
      }
    } catch (error) {
      showToast('Error saving size', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', length: '', width: '', isActive: true })
    setEntries([])
  }

  const handleEdit = async (size: Size) => {
    setEditingSize(size)
    setFormData({
      name: size.name,
      description: size.description || '',
      length: size.length?.toString() || '',
      width: size.width?.toString() || '',
      isActive: size.isActive
    })
    setShowForm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteSize) return

    try {
      const response = await fetch(`/api/sizes/${deleteSize.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('Size deleted successfully!', 'success')
        setDeleteSize(null)
        fetchSizes()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to delete size', 'error')
      }
    } catch (error) {
      showToast('Error deleting size', 'error')
    }
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    const day = d.getDate().toString().padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`
  }

  const renderGridItem = useCallback((size: Size) => (
    <Card className="flex flex-col hover:shadow-premium transition-all duration-300 border-border/50 group overflow-hidden h-full">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-bold text-card-foreground group-hover:text-primary transition-colors line-clamp-1 flex-1">
            {size.name}
          </CardTitle>
          <Badge variant={size.isActive ? 'default' : 'secondary'} className={cn("shrink-0", size.isActive ? "bg-primary/20 text-primary border-none" : "")}>
            {size.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col flex-1">
        {/* Fixed height description */}
        <p className="text-xs text-muted-foreground italic h-8 line-clamp-2 mb-3">
          {size.description?.trim() || ''}
        </p>
        {/* Fixed height dimensions row */}
        <div className="flex items-center gap-2 text-xs font-medium text-foreground bg-primary/5 px-2.5 py-2 rounded-lg border border-primary/10 mb-2 h-9">
          <Ruler className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">
            {size.length && size.width
              ? `${size.length} × ${size.width} mm`
              : 'No dimensions'}
          </span>
        </div>
        {/* Fixed height products row */}
        <div className="flex items-center text-xs text-muted-foreground mb-3 h-5">
          <span className="flex items-center gap-1 font-medium">
            <Package className="h-3 w-3" />
            {size._count?.products || 0} Products
          </span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-2.5 rounded-xl border border-border/30 mb-3">
          <div className="flex justify-between"><span>Created:</span><span className="font-medium text-foreground">{formatDate(size.createdAt)}</span></div>
          <div className="flex justify-between"><span>Updated:</span><span className="font-medium text-foreground">{size.updatedAt && size.updatedAt !== size.createdAt ? formatDate(size.updatedAt) : 'N/A'}</span></div>
          <div className="flex justify-between"><span>By:</span><span className="font-medium text-foreground">{size.createdBy?.name || 'N/A'}</span></div>
        </div>
        <div className="flex gap-2 mt-auto">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(size) }} className="flex-1 rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 gap-1.5 font-bold h-8 text-xs">
            <Edit className="h-3 w-3" />Edit
          </Button>
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteSize(size) }} className="flex-1 rounded-xl text-destructive hover:text-destructive border-border/50 hover:bg-destructive/10 gap-1.5 font-bold h-8 text-xs">
            <Trash2 className="h-3 w-3" />Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [formatDate])

  const renderListRow = useCallback((size: Size) => (
    <>
      <td className="px-4 py-2.5">
        <div className="font-bold text-foreground group-hover:text-primary transition-colors">{size.name}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {size.length && size.width ? `${size.length} × ${size.width} mm (${formatMmToFeetInches(size.length)} × ${formatMmToFeetInches(size.width)})` : 'N/A'}
        </div>
      </td>

      <td className="px-4 py-2.5">
        <div className="font-bold text-foreground">{size._count?.products || 0}</div>
      </td>
      <td className="px-4 py-2.5">
        <Badge
          variant={size.isActive ? 'default' : 'secondary'}
          className={cn(size.isActive ? "bg-primary/20 text-primary border-none" : "")}
        >
          {size.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-2.5 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">{formatDate(size.createdAt)}</div>
        <div className="text-xs">{size.createdBy?.name || 'N/A'}</div>
      </td>
      <td className="px-4 py-2.5 text-sm text-muted-foreground">
        <div>
          <div className="font-medium text-foreground">{size.updatedAt && size.updatedAt !== size.createdAt ? formatDate(size.updatedAt) : 'N/A'}</div>
          <div className="text-xs">{size.updatedAt && size.updatedAt !== size.createdAt ? (size.updatedBy?.name || 'N/A') : 'N/A'}</div>
        </div>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEdit(size); }}
            className="rounded-xl hover:bg-primary/10 hover:text-primary gap-2 font-bold px-3 transition-all"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setDeleteSize(size); }}
            className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 font-bold px-3 transition-all"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </td>
    </>
  ), [formatDate])

  const makeExportRows = (data: Size[]) => data.map(s => ({
    col1: s.isActive ? 'Active' : 'Inactive',
    col2: s.length && s.width ? `${s.length}×${s.width}mm` : 'N/A',
    col3: s.name,
    qty: s._count?.products || 0,
    badge: s.isActive ? 'Active' : 'Inactive',
  }))

  const exportConfig = useMemo(() => ({
    title: 'Sizes Report',
    rows: makeExportRows(sizes),
    grandTotal: totalCount,
    grandTotalLabel: 'Total Sizes',
    excelColumns: commonColumns.size,
    excelData: sizes,
    filename: 'sizes-export',
    sheetName: 'Sizes',
    fetchAllData: async () => {
      const params = new URLSearchParams({ page: '1', limit: '10000', search: search || '' })
      Object.entries(filters).forEach(([k, v]) => { if (v && v !== '' && v !== 'all') params.append(k, v as string) })
      const res = await fetch(`/api/sizes?${params}`)
      const data = await res.json()
      const all: Size[] = data.sizes || []
      return { rows: makeExportRows(all), excelData: all }
    },
  }), [sizes, totalCount, filters, search])

  const customExportFilters = useMemo(() => ({
    statuses: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
    filterData: ({ status, dateFrom, dateTo }: any) => {
      let filtered = sizes
      if (status === 'active') filtered = filtered.filter(s => s.isActive)
      if (status === 'inactive') filtered = filtered.filter(s => !s.isActive)
      if (dateFrom) filtered = filtered.filter(s => new Date(s.createdAt) >= new Date(dateFrom))
      if (dateTo) filtered = filtered.filter(s => new Date(s.createdAt) <= new Date(dateTo))
      return { rows: makeExportRows(filtered), excelData: filtered }
    },
  }), [sizes])

  if (loading && sizes.length === 0) {
    return <LoadingPage view={view} title="Sizes" />
  }

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 space-y-6">
      {/* Filters */}
      <TableFilters
        title="Sizes"
        actions={
          <div className="flex items-center gap-2">
            <PageExportButton config={exportConfig} customFilters={customExportFilters} disabled={sizes.length === 0} />
            <Button
              size="sm"
              onClick={() => {
                setEditingSize(null)
                resetForm()
                setShowForm(true)
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Size
            </Button>
          </div>
        }
        filters={filterConfigs}
        values={filters}
        onFiltersChange={updateFilters}
        searchValue={search}
        onSearchChange={updateSearch}
        showSearch={true}
        showFilterToggle={true}
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
        loading={loading}
      />

      {/* Data View */}
      <DataView
        items={sizes}
        view={view}
        onViewChange={setView}
        loading={loading}
        autoResponsive={true}
        onItemClick={(item) => {
          setSelectedDetailItem(item)
          setShowDetails(true)
        }}
        gridProps={{
          renderItem: renderGridItem,
          columns: 3
        }}
        listProps={{
          headers: ['Size', 'Products', 'Status', 'Created', 'Updated', 'Actions'],
          renderRow: renderListRow
        }}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="glass backdrop-blur-xl border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl shadow-premium animate-in zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              {editingSize ? 'Edit Size' : 'Add New Size'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {/* Queued entries */}
            {!editingSize && entries.length > 0 && (
              <div className="space-y-2">
                {entries.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="flex-1 text-sm font-bold text-foreground">{entry.name || `${entry.length}x${entry.width}mm`}</div>
                    <div className="text-xs text-muted-foreground">{entry.length && entry.width ? `${entry.length} × ${entry.width} mm` : '—'}</div>
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={() => setEntries(entries.filter((_, i) => i !== idx))}>
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 ml-1">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., 600x600mm"
                  className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 ml-1">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description (optional)"
                  className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <div className="space-y-2">
                <label className="text-sm font-bold text-primary/80 ml-1 flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Length (mm)
                </label>
                <Input
                  type="number"
                  value={formData.length}
                  onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                  placeholder="Enter length"
                  className="rounded-xl bg-background border-primary/20 focus:border-primary transition-all h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-primary/80 ml-1 flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Width (mm)
                </label>
                <Input
                  type="number"
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                  placeholder="Enter width"
                  className="rounded-xl bg-background border-primary/20 focus:border-primary transition-all h-11"
                />
              </div>
              {(formData.length || formData.width) && (
                <div className="col-span-1 md:col-span-2 text-sm text-primary/80 bg-primary/10 p-2 rounded-xl border border-primary/20 flex items-center justify-center gap-2 font-medium">
                  {formData.length && formData.width ? (
                    <>Equivalent: {formatMmToFeetInches(Number(formData.length))} × {formatMmToFeetInches(Number(formData.width))}</>
                  ) : (
                    <>Equivalent: {formData.length ? formatMmToFeetInches(Number(formData.length)) : '?'} × {formData.width ? formatMmToFeetInches(Number(formData.width)) : '?'}</>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-2xl border border-border/30 group hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}>
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-5 w-5 rounded-lg border-primary/30 text-primary transition-all cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">Active Status</span>
                <span className="text-xs text-muted-foreground">Visible in product selection</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {!editingSize && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const name = formData.name.trim() || (formData.length && formData.width ? `${formData.length}x${formData.width}mm` : '')
                    if (!name) { showToast('Enter a name or dimensions first', 'error'); return }
                    setEntries([...entries, { ...formData, name }])
                    setFormData({ name: '', description: '', length: '', width: '', isActive: true })
                  }}
                  className="rounded-2xl h-12 px-5 border-primary/30 text-primary hover:bg-primary/10 font-bold gap-2"
                >
                  <Plus className="h-4 w-4" /> Add More
                </Button>
              )}
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20"
              >
                {submitting ? 'Saving...' : editingSize ? 'Update Size' : entries.length > 0 ? `Create ${entries.length + 1} Sizes` : 'Create Size'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowForm(false); setEntries([]) }}
                className="rounded-2xl h-12 px-6 border-border/50 font-bold hover:bg-muted/50"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        loading={loading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteSize}
        onOpenChange={(open) => !open && setDeleteSize(null)}
        title={deleteConfirmation.title}
        description={`Are you sure you want to delete "${deleteSize?.name}"? This action cannot be undone.`}
        confirmText={deleteConfirmation.confirmText}
        variant={deleteConfirmation.variant}
        onConfirm={handleDeleteConfirm}
        icon={deleteConfirmation.icon}
      />

      <RowDetailsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        title="Size Details"
        data={selectedDetailItem}
        fields={[
          { label: 'Name', value: selectedDetailItem?.name },
          { label: 'Description', value: selectedDetailItem?.description },
          { label: 'Dimensions (mm)', value: selectedDetailItem?.length && selectedDetailItem?.width ? `${selectedDetailItem.length} × ${selectedDetailItem.width} mm` : undefined },
          { label: 'Dimensions (ft/in)', value: selectedDetailItem?.length && selectedDetailItem?.width ? `${formatMmToFeetInches(selectedDetailItem.length)} × ${formatMmToFeetInches(selectedDetailItem.width)}` : undefined },
          { label: 'Status', value: selectedDetailItem?.isActive, variant: 'badge' as const },
          { label: 'Products Using This Size', value: selectedDetailItem?._count?.products || 0, variant: 'number' as const },
          { label: 'Created At', value: selectedDetailItem?.createdAt },
          { label: 'Created By', value: selectedDetailItem?.createdBy?.name },
          { label: 'Updated At', value: selectedDetailItem?.updatedAt !== selectedDetailItem?.createdAt ? selectedDetailItem?.updatedAt : undefined },
          { label: 'Updated By', value: selectedDetailItem?.updatedAt !== selectedDetailItem?.createdAt ? selectedDetailItem?.updatedBy?.name : undefined },
        ].filter(f => f.value !== undefined)}
      />
    </div>
  )
}