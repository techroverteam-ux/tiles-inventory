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

interface Category {
  id: string
  name: string
  description?: string
  brandId: string
  brand: {
    name: string
  }
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

interface FormData {
  name: string
  description: string
  brandId: string
  isActive: boolean
}

interface ApiResponse {
  categories: Category[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'list'>('list') // Default to list for desktop
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    brandId: '',
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
  ], [brands])

  // Fetch categories with pagination and filters
  const fetchCategories = useCallback(async () => {
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

      const response = await fetch(`/api/categories?${params}`)
      if (response.ok) {
        const data: ApiResponse = await response.json()
        setCategories(data.categories || [])
        setTotalCount(data.totalCount || 0)
        setTotalPages(data.totalPages || 0)
      } else {
        showToast('Failed to fetch categories', 'error')
      }
    } catch (error) {
      showToast('Error fetching categories', 'error')
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

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.brandId) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    setSubmitting(true)
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
      const method = editingCategory ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showToast(
          editingCategory ? 'Category updated successfully!' : 'Category created successfully!',
          'success'
        )
        setShowForm(false)
        setEditingCategory(null)
        resetForm()
        fetchCategories()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to save category', 'error')
      }
    } catch (error) {
      showToast('Error saving category', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      brandId: '',
      isActive: true
    })
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      brandId: category.brandId,
      isActive: category.isActive
    })
    setShowForm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteCategory) return

    try {
      const response = await fetch(`/api/categories/${deleteCategory.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('Category deleted successfully!', 'success')
        setDeleteCategory(null)
        fetchCategories()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to delete category', 'error')
      }
    } catch (error) {
      showToast('Error deleting category', 'error')
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

  const renderGridItem = useCallback((category: Category) => (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-card-foreground">
              {category.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {category.brand.name}
            </p>
          </div>
          <Badge variant={category.isActive ? 'default' : 'secondary'}>
            {category.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {category.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {category.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>Products: {category._count?.products || 0}</span>
        </div>
        <div className="text-xs text-muted-foreground mb-4 space-y-1">
          <div>Created: {formatDate(category.createdAt)}</div>
          {category.updatedAt && category.updatedAt !== category.createdAt && (
            <div>Updated: {formatDate(category.updatedAt)}</div>
          )}
          {category.createdBy && (
            <div>By: {category.createdBy.name}</div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(category)}
            className="flex-1 gap-1"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteCategory(category)}
            className="flex-1 text-destructive hover:text-destructive gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [formatDate])

  const renderListRow = useCallback((category: Category) => (
    <>
      <td className="px-4 py-3">
        <div className="font-medium text-foreground">{category.name}</div>
        <div className="text-sm text-muted-foreground">{category.brand.name}</div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {category.description || 'No description'}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={category.isActive ? 'default' : 'secondary'}>
          {category.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {category._count?.products || 0}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        <div>{formatDate(category.createdAt)}</div>
        {category.createdBy && (
          <div className="text-xs">{category.createdBy.name}</div>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {category.updatedAt && category.updatedAt !== category.createdAt ? (
          <div>
            <div>{formatDate(category.updatedAt)}</div>
            {category.updatedBy && (
              <div className="text-xs">{category.updatedBy.name}</div>
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
            onClick={() => handleEdit(category)}
            className="gap-1"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteCategory(category)}
            className="text-destructive hover:text-destructive gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      </td>
    </>
  ), [formatDate])

  if (loading && categories.length === 0) {
    return <LoadingPage view={view} title="Categories" />
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
        searchPlaceholder="Search categories..."
        loading={loading}
      />

      {/* Data View */}
      <DataView
        items={categories}
        view={view}
        onViewChange={setView}
        loading={loading}
        autoResponsive={true}
        title="Categories"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={categories}
              columns={commonColumns.category}
              filename="categories-export"
              onExportComplete={(result) => {
                if (result.success) {
                  showToast(`Exported ${categories.length} categories successfully!`, 'success')
                } else {
                  showToast(result.error || 'Export failed', 'error')
                }
              }}
              disabled={categories.length === 0}
            />
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingCategory(null)
                  resetForm()
                }} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-card-foreground">
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter category name"
                      required
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Brand *</label>
                    <select
                      value={formData.brandId}
                      onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
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
                  <div>
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter description (optional)"
                      className="bg-background border-input text-foreground"
                    />
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
                    <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground">
                      {submitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="border-border text-foreground"
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
          headers: ['Name & Brand', 'Description', 'Status', 'Products', 'Created', 'Updated', 'Actions'],
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
        open={!!deleteCategory}
        onOpenChange={(open) => !open && setDeleteCategory(null)}
        title={deleteConfirmation.title}
        description={`Are you sure you want to delete "${deleteCategory?.name}"? This action cannot be undone.`}
        confirmText={deleteConfirmation.confirmText}
        variant={deleteConfirmation.variant}
        onConfirm={handleDeleteConfirm}
        icon={deleteConfirmation.icon}
      />
    </div>
  )
}