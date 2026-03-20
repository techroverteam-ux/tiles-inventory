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
import { ExportButton, commonColumns } from '@/lib/excel-export'
import { LoadingPage } from '@/components/ui/skeleton'
import { Filter, Plus, Edit, Trash2, Package, Ruler } from 'lucide-react'
import { RowDetailsDialog } from '@/components/ui/row-details-dialog'
import { cn } from '@/lib/utils'

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

interface ApiResponse {
  sizes: Size[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export default function SizesPage() {
  const [sizes, setSizes] = useState<Size[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'list'>('list') // Default to list for desktop
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
  } = usePagination(1, 25)
  
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
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ],
      placeholder: 'All Status'
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
      // Append all filters except empty values
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') params.append(key, value as string)
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
      const url = editingSize ? `/api/sizes/${editingSize.id}` : '/api/sizes'
      const method = editingSize ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: finalName,
          length: formData.length ? parseFloat(formData.length) : undefined,
          width: formData.width ? parseFloat(formData.width) : undefined
        })
      })

      if (response.ok) {
        showToast(
          editingSize ? 'Size updated successfully!' : 'Size created successfully!',
          'success'
        )
        setShowForm(false)
        setEditingSize(null)
        resetForm()
        fetchSizes()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to save size', 'error')
      }
    } catch (error) {
      showToast('Error saving size', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      length: '',
      width: '',
      isActive: true
    })
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
    <Card className="h-full hover:shadow-premium transition-all duration-300 border-border/50 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors">
              {size.name}
            </CardTitle>
          </div>
          <Badge 
            variant={size.isActive ? 'default' : 'secondary'}
            className={cn(size.isActive ? "bg-primary/20 text-primary border-none" : "")}
          >
            {size.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {size.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 italic">
            {size.description}
          </p>
        )}
        <div className="flex flex-col gap-2 mb-4">
          {(size.length || size.width) && (
            <div className="flex items-center gap-2 text-sm font-medium text-foreground bg-primary/5 p-2 rounded-lg border border-primary/10">
              <Ruler className="h-4 w-4 text-primary" />
              <span>{size.length || '?'} × {size.width || '?'} mm</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground ml-1">
            <Package className="h-3 w-3" />
            <span>Products: {size._count?.products || 0}</span>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground mb-6 space-y-1 bg-muted/30 p-2.5 rounded-xl border border-border/30">
          <div className="flex justify-between"><span>Created:</span> <span className="font-medium text-foreground">{formatDate(size.createdAt)}</span></div>
          {size.updatedAt && size.updatedAt !== size.createdAt && (
            <div className="flex justify-between"><span>Updated:</span> <span className="font-medium text-foreground">{formatDate(size.updatedAt)}</span></div>
          )}
          {size.createdBy && (
            <div className="flex justify-between"><span>By:</span> <span className="font-medium text-foreground">{size.createdBy.name}</span></div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEdit(size); }}
            className="rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 gap-2 font-bold"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setDeleteSize(size); }}
            className="rounded-xl text-destructive hover:text-destructive border-border/50 hover:bg-destructive/10 hover:border-destructive/30 gap-2 font-bold"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [formatDate])

  const renderListRow = useCallback((size: Size) => (
    <>
      <td className="px-6 py-4">
        <div className="font-bold text-foreground group-hover:text-primary transition-colors">{size.name}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
          <Ruler className="h-3 w-3" />
          {size.length && size.width ? `${size.length} × ${size.width} mm` : 'No dimensions'}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="text-sm text-muted-foreground max-w-xs truncate italic">
          {size.description || 'No description'}
        </div>
      </td>
      <td className="px-6 py-4">
        <Badge 
          variant={size.isActive ? 'default' : 'secondary'}
          className={cn(size.isActive ? "bg-primary/20 text-primary border-none" : "")}
        >
          {size.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-6 py-4 text-sm font-medium text-foreground">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          {size._count?.products || 0}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">{formatDate(size.createdAt)}</div>
        <div className="text-xs">{size.createdBy?.name || 'System'}</div>
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground">
        {size.updatedAt && size.updatedAt !== size.createdAt ? (
          <div>
            <div className="font-medium text-foreground">{formatDate(size.updatedAt)}</div>
            <div className="text-xs">{size.updatedBy?.name || 'System'}</div>
          </div>
        ) : (
          <span className="text-xs opacity-30 text-muted-foreground">No updates</span>
        )}
      </td>
      <td className="px-6 py-4">
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
            <Button size="sm" variant="outline" onClick={() => setFiltersOpen((prev) => !prev)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <ExportButton
              data={sizes}
              columns={commonColumns.size}
              filename="sizes-export"
              reportTitle="Sizes Report"
              onExportComplete={(result) => {
                if (result.success) {
                  showToast(`Exported ${sizes.length} sizes successfully!`, 'success')
                } else {
                  showToast(result.error || 'Export failed', 'error')
                }
              }}
              disabled={sizes.length === 0}
            />
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
        showSearch={false}
        showFilterToggle={false}
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
          headers: ['Size', 'Description', 'Status', 'Products', 'Created', 'Updated', 'Actions'],
          renderRow: renderListRow
        }}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="glass backdrop-blur-3xl border-border/50 max-w-2xl rounded-3xl shadow-premium animate-in zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              {editingSize ? 'Edit Size' : 'Add New Size'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
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

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20"
              >
                {submitting ? 'Saving...' : editingSize ? 'Update Size' : 'Create Size'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
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
      />
    </div>
  )
}