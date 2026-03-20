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
import { Filter, Plus, Edit, Trash2 } from 'lucide-react'
import { RowDetailsDialog } from '@/components/ui/row-details-dialog'

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
    <Card className="h-full hover:shadow-lg transition-shadow bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-card-foreground">
              {size.name}
            </CardTitle>
          </div>
          <Badge variant={size.isActive ? 'default' : 'secondary'}>
            {size.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {size.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {size.description}
          </p>
        )}
        {(size.length || size.width) && (
          <div className="text-sm text-muted-foreground mb-3">
            Dimensions: {size.length || '?'} x {size.width || '?'} mm
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>Products: {size._count?.products || 0}</span>
        </div>
        <div className="text-xs text-muted-foreground mb-4 space-y-1">
          <div>Created: {formatDate(size.createdAt)}</div>
          {size.updatedAt && size.updatedAt !== size.createdAt && (
            <div>Updated: {formatDate(size.updatedAt)}</div>
          )}
          {size.createdBy && (
            <div>By: {size.createdBy.name}</div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEdit(size); }}
            className="flex-1 border-border text-foreground hover:bg-accent gap-1"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setDeleteSize(size); }}
            className="flex-1 text-destructive hover:text-destructive border-border hover:bg-destructive/10 gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [formatDate])

  const renderListRow = useCallback((size: Size) => (
    <>
      <td className="px-4 py-3">
        <div className="font-medium text-foreground">{size.name}</div>
        <div className="text-sm text-muted-foreground">
          {size.length && size.width ? `${size.length} x ${size.width} mm` : 'No dimensions'}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {size.description || 'No description'}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={size.isActive ? 'default' : 'secondary'}>
          {size.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {size._count?.products || 0}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        <div>{formatDate(size.createdAt)}</div>
        <div className="text-xs">{size.createdBy?.name || 'System'}</div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {size.updatedAt && size.updatedAt !== size.createdAt ? (
          <div>
            <div>{formatDate(size.updatedAt)}</div>
            <div className="text-xs">{size.updatedBy?.name || 'System'}</div>
          </div>
        ) : (
          <span className="text-xs">-</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEdit(size); }}
            className="text-foreground hover:bg-accent gap-1"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setDeleteSize(size); }}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
          >
            <Trash2 className="h-3 w-3" />
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
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-card-foreground font-semibold">
              {editingSize ? 'Edit Size' : 'Add New Size'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., 600x600mm"
                  className="bg-background border-input text-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description (optional)"
                  className="bg-background border-input text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Length (mm)</label>
                <Input
                  type="number"
                  value={formData.length}
                  onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                  placeholder="Enter length in mm"
                  className="bg-background border-input text-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Width (mm)</label>
                <Input
                  type="number"
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                  placeholder="Enter width in mm"
                  className="bg-background border-input text-foreground"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-input"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-foreground">
                Active
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                {submitting ? 'Saving...' : editingSize ? 'Update' : 'Create'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="border-border text-foreground hover:bg-accent font-medium"
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