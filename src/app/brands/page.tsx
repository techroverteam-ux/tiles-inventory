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

interface Brand {
  id: string
  name: string
  description?: string
  contactInfo?: string
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
    categories: number
    products: number
  }
}

interface FormData {
  name: string
  description: string
  contactInfo: string
  isActive: boolean
}

interface ApiResponse {
  brands: Brand[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'list'>('list') // Default to list for desktop
  const [showForm, setShowForm] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [deleteBrand, setDeleteBrand] = useState<Brand | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    contactInfo: '',
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

  // Fetch brands with pagination and filters
  const fetchBrands = useCallback(async () => {
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

      const response = await fetch(`/api/brands?${params}`)
      if (response.ok) {
        const data: ApiResponse = await response.json()
        setBrands(data.brands || [])
        setTotalCount(data.totalCount || 0)
        setTotalPages(data.totalPages || 0)
      } else {
        showToast('Failed to fetch brands', 'error')
      }
    } catch (error) {
      showToast('Error fetching brands', 'error')
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, search, filters, showToast])

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      showToast('Please enter a brand name', 'error')
      return
    }

    setSubmitting(true)
    try {
      const url = editingBrand ? `/api/brands/${editingBrand.id}` : '/api/brands'
      const method = editingBrand ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showToast(
          editingBrand ? 'Brand updated successfully!' : 'Brand created successfully!',
          'success'
        )
        setShowForm(false)
        setEditingBrand(null)
        resetForm()
        fetchBrands()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to save brand', 'error')
      }
    } catch (error) {
      showToast('Error saving brand', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      contactInfo: '',
      isActive: true
    })
  }

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    setFormData({
      name: brand.name,
      description: brand.description || '',
      contactInfo: brand.contactInfo || '',
      isActive: brand.isActive
    })
    setShowForm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteBrand) return

    try {
      const response = await fetch(`/api/brands/${deleteBrand.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('Brand deleted successfully!', 'success')
        setDeleteBrand(null)
        fetchBrands()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to delete brand', 'error')
      }
    } catch (error) {
      showToast('Error deleting brand', 'error')
    }
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    const day = d.getDate().toString().padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`
  }

  const renderGridItem = useCallback((brand: Brand) => (
    <Card className="h-full hover:shadow-lg transition-shadow bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-card-foreground">
              {brand.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {brand.contactInfo || 'No contact info'}
            </p>
          </div>
          <Badge variant={brand.isActive ? 'default' : 'secondary'}>
            {brand.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {brand.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {brand.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>Categories: {brand._count?.categories || 0}</span>
          <span>Products: {brand._count?.products || 0}</span>
        </div>
        <div className="text-xs text-muted-foreground mb-4 space-y-1">
          <div>Created: {formatDate(brand.createdAt)}</div>
          {brand.updatedAt && brand.updatedAt !== brand.createdAt && (
            <div>Updated: {formatDate(brand.updatedAt)}</div>
          )}
          {brand.createdBy && (
            <div>By: {brand.createdBy.name}</div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(brand)}
            className="flex-1 border-border text-foreground hover:bg-accent gap-1"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteBrand(brand)}
            className="flex-1 text-destructive hover:text-destructive border-border hover:bg-destructive/10 gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [formatDate])

  const renderListRow = useCallback((brand: Brand) => (
    <>
      <td className="px-4 py-3">
        <div className="font-medium text-foreground">{brand.name}</div>
        <div className="text-sm text-muted-foreground">{brand.contactInfo || 'No contact'}</div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {brand.description || 'No description'}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={brand.isActive ? 'default' : 'secondary'}>
          {brand.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {brand._count?.categories || 0}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {brand._count?.products || 0}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        <div>{formatDate(brand.createdAt)}</div>
        {brand.createdBy && (
          <div className="text-xs">{brand.createdBy.name}</div>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {brand.updatedAt && brand.updatedAt !== brand.createdAt ? (
          <div>
            <div>{formatDate(brand.updatedAt)}</div>
            {brand.updatedBy && (
              <div className="text-xs">{brand.updatedBy.name}</div>
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
            onClick={() => handleEdit(brand)}
            className="text-foreground hover:bg-accent gap-1"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteBrand(brand)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      </td>
    </>
  ), [formatDate])

  if (loading && brands.length === 0) {
    return <LoadingPage view={view} title="Brands" />
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
        searchPlaceholder="Search brands..."
        loading={loading}
      />

      {/* Data View */}
      <DataView
        items={brands}
        view={view}
        onViewChange={setView}
        loading={loading}
        autoResponsive={true}
        title="Brands"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={brands}
              columns={commonColumns.brand}
              filename="brands-export"
              onExportComplete={(result) => {
                if (result.success) {
                  showToast(`Exported ${brands.length} brands successfully!`, 'success')
                } else {
                  showToast(result.error || 'Export failed', 'error')
                }
              }}
              disabled={brands.length === 0}
            />
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingBrand(null)
                    resetForm()
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Brand
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-card-foreground font-semibold">
                    {editingBrand ? 'Edit Brand' : 'Add New Brand'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter brand name"
                      required
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
                  <div>
                    <label className="text-sm font-medium text-foreground">Contact Info</label>
                    <Input
                      value={formData.contactInfo}
                      onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                      placeholder="Enter contact information (optional)"
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
                    <Button 
                      type="submit" 
                      disabled={submitting} 
                      className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                    >
                      {submitting ? 'Saving...' : editingBrand ? 'Update' : 'Create'}
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
          headers: ['Name & Contact', 'Description', 'Status', 'Categories', 'Products', 'Created', 'Updated', 'Actions'],
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
        open={!!deleteBrand}
        onOpenChange={(open) => !open && setDeleteBrand(null)}
        title={deleteConfirmation.title}
        description={`Are you sure you want to delete "${deleteBrand?.name}"? This action cannot be undone.`}
        confirmText={deleteConfirmation.confirmText}
        variant={deleteConfirmation.variant}
        onConfirm={handleDeleteConfirm}
        icon={deleteConfirmation.icon}
      />
    </div>
  )
}