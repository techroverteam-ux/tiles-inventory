'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
import { Plus, Edit, Trash2 } from 'lucide-react'

interface Size {
  id: string
  name: string
  description?: string
  length?: number
  width?: number
  brandId: string
  categoryId: string
  brand: { name: string }
  category: { name: string }
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
  brandId: string
  categoryId: string
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
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'list'>('list') // Default to list for desktop
  const [showForm, setShowForm] = useState(false)
  const [editingSize, setEditingSize] = useState<Size | null>(null)
  const [deleteSize, setDeleteSize] = useState<Size | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    length: '',
    width: '',
    brandId: '',
    categoryId: '',
    isActive: true
  })
  const [submitting, setSubmitting] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  const { showToast } = useToast()
  const router = useRouter()
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
      key: 'brandId',
      label: 'Brand',
      type: 'select',
      options: brands.map(brand => ({ value: brand.id, label: brand.name })),
      placeholder: 'All Brands'
    },
    {
      key: 'categoryId',
      label: 'Category',
      type: 'select',
      options: categories.map(category => ({ value: category.id, label: category.name })),
      placeholder: 'All Categories'
    },
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
  ], [brands, categories])

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

  const fetchBrands = useCallback(async () => {
    try {
      const response = await fetch('/api/brands')
      if (response.ok) {
        const data = await response.json()
        setBrands(data.brands?.filter((b: Brand) => b.isActive) || [])
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories?.filter((c: Category) => c.isActive) || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [])

  useEffect(() => {
    fetchSizes()
  }, [fetchSizes])

  useEffect(() => {
    fetchBrands()
    fetchCategories()
  }, [fetchBrands, fetchCategories])

  // Fetch filtered categories based on brand selection
  useEffect(() => {
    if (formData.brandId) {
      fetchCategoriesByBrand(formData.brandId)
    } else {
      setFilteredCategories([])
    }
  }, [formData.brandId])

  const fetchCategoriesByBrand = async (brandId: string) => {
    try {
      const response = await fetch(`/api/categories?brandId=${brandId}`)
      const data = await response.json()
      setFilteredCategories(data.categories?.filter((c: any) => c.isActive) || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.brandId || !formData.categoryId) {
      showToast('Please fill in all required fields', 'error')
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
      brandId: '',
      categoryId: '',
      isActive: true
    })
    setFilteredCategories([])
  }

  const handleEdit = (size: Size) => {
    setEditingSize(size)
    setFormData({
      name: size.name,
      description: size.description || '',
      length: size.length?.toString() || '',
      width: size.width?.toString() || '',
      brandId: size.brandId,
      categoryId: size.categoryId,
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
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const renderGridItem = useCallback((size: Size) => (
    <Card className="h-full hover:shadow-lg transition-shadow bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-card-foreground">
              {size.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {size.brand.name} - {size.category.name}
            </p>
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
            onClick={() => handleEdit(size)}
            className="flex-1 border-border text-foreground hover:bg-accent gap-1"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteSize(size)}
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
        <div className="text-sm">
          <div className="text-foreground">{size.brand.name}</div>
          <div className="text-muted-foreground">{size.category.name}</div>
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
        {size.createdBy && (
          <div className="text-xs">{size.createdBy.name}</div>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {size.updatedAt && size.updatedAt !== size.createdAt ? (
          <div>
            <div>{formatDate(size.updatedAt)}</div>
            {size.updatedBy && (
              <div className="text-xs">{size.updatedBy.name}</div>
            )}
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
            onClick={() => handleEdit(size)}
            className="text-foreground hover:bg-accent gap-1"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteSize(size)}
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Filters */}
      <TableFilters
        filters={filterConfigs}
        values={filters}
        onFiltersChange={updateFilters}
        searchValue={search}
        onSearchChange={updateSearch}
        searchPlaceholder="Search sizes..."
        loading={loading}
      />

      {/* Data View */}
      <DataView
        items={sizes}
        view={view}
        onViewChange={setView}
        loading={loading}
        autoResponsive={true}
        title="Sizes"
        actions={
          <div className="flex items-center gap-2">
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
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingSize(null)
                    resetForm()
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Size
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-card-foreground font-semibold">
                    {editingSize ? 'Edit Size' : 'Add New Size'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Name *</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., 600x600mm"
                        required
                        className="bg-background border-input text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Brand *</label>
                      <select
                        value={formData.brandId}
                        onChange={(e) => setFormData({ ...formData, brandId: e.target.value, categoryId: '' })}
                        required
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      >
                        <option value="">Select a brand</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Category *</label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        disabled={!formData.brandId}
                        required
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground disabled:opacity-50"
                      >
                        <option value="">Select a category</option>
                        {filteredCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
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
          </div>
        }
        gridProps={{
          renderItem: renderGridItem,
          columns: 3
        }}
        listProps={{
          headers: ['Name & Dimensions', 'Brand & Category', 'Description', 'Status', 'Products', 'Created', 'Updated', 'Actions'],
          renderRow: renderListRow
        }}
      />

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
    </div>
  )
}