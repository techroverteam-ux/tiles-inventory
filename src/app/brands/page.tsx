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
import { Filter, Plus, Edit, Trash2, Package } from 'lucide-react'
import { RowDetailsDialog } from '@/components/ui/row-details-dialog'
import { cn } from '@/lib/utils'

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
    products: number
  }
}

interface FormData {
  name: string
  description: string
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
  const [showDetails, setShowDetails] = useState(false)
  const [selectedDetailItem, setSelectedDetailItem] = useState<Brand | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
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

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setEditingBrand(null)
      resetForm()
      setShowForm(true)
    }
  }, [searchParams])

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
      isActive: true
    })
  }

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    setFormData({
      name: brand.name,
      description: brand.description || '',
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
    <Card className="h-full hover:shadow-premium transition-all duration-300 border-border/50 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors">
              {brand.name}
            </CardTitle>
          </div>
          <Badge 
            variant={brand.isActive ? 'default' : 'secondary'}
            className={cn(brand.isActive ? "bg-primary/20 text-primary border-none" : "")}
          >
            {brand.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {brand.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 italic">
            {brand.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5 font-medium">
            <Package className="h-3 w-3" />
            Products: {brand._count?.products || 0}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mb-6 space-y-1 bg-muted/30 p-2.5 rounded-xl border border-border/30">
          <div className="flex justify-between"><span>Created:</span> <span className="font-medium text-foreground">{formatDate(brand.createdAt)}</span></div>
          {brand.updatedAt && brand.updatedAt !== brand.createdAt && (
            <div className="flex justify-between"><span>Updated:</span> <span className="font-medium text-foreground">{formatDate(brand.updatedAt)}</span></div>
          )}
          {brand.createdBy && (
            <div className="flex justify-between"><span>By:</span> <span className="font-medium text-foreground">{brand.createdBy.name}</span></div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEdit(brand); }}
            className="flex-1 rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 gap-2 font-bold h-9"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setDeleteBrand(brand); }}
            className="flex-1 rounded-xl text-destructive hover:text-destructive border-border/50 hover:bg-destructive/10 hover:border-destructive/30 gap-2 font-bold h-9"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [formatDate])

  const renderListRow = useCallback((brand: Brand) => (
    <>
      <td className="px-6 py-4">
        <div className="font-bold text-foreground group-hover:text-primary transition-colors">{brand.name}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-muted-foreground max-w-xs truncate italic">
          {brand.description || 'No description'}
        </div>
      </td>
      <td className="px-6 py-4">
        <Badge 
          variant={brand.isActive ? 'default' : 'secondary'}
          className={cn(brand.isActive ? "bg-primary/20 text-primary border-none" : "")}
        >
          {brand.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-6 py-4 text-sm font-medium text-foreground">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          {brand._count?.products || 0}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">{formatDate(brand.createdAt)}</div>
        <div className="text-xs">{brand.createdBy?.name || 'System'}</div>
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground">
        {brand.updatedAt && brand.updatedAt !== brand.createdAt ? (
          <div>
            <div className="font-medium text-foreground">{formatDate(brand.updatedAt)}</div>
            <div className="text-xs">{brand.updatedBy?.name || 'System'}</div>
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
            onClick={(e) => { e.stopPropagation(); handleEdit(brand); }}
            className="rounded-xl hover:bg-primary/10 hover:text-primary gap-2 font-bold px-3 transition-all"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setDeleteBrand(brand); }}
            className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 font-bold px-3 transition-all"
          >
            <Trash2 className="h-4 w-4" />
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
    <div className="w-full px-3 sm:px-4 md:px-6 space-y-6">
      {/* Filters */}
      <TableFilters
        title="Brands"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setFiltersOpen((prev) => !prev)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
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
                  size="sm"
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
              <DialogContent className="glass backdrop-blur-3xl border-border/50 max-w-md rounded-3xl shadow-premium animate-in zoom-in-95 duration-200">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                    {editingBrand ? 'Edit Brand' : 'Add New Brand'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/80 ml-1">Name <span className="text-destructive">*</span></label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter brand name"
                      required
                      className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/80 ml-1">Description</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter description"
                      className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12"
                    />
                  </div>



                  <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-2xl border border-border/30 group hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-5 w-5 rounded-lg border-primary/30 text-primary transition-all cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">Active Status</span>
                      <span className="text-xs text-muted-foreground">Visible in product selection</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <Button type="submit" disabled={submitting} className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20">
                      {submitting ? 'Saving...' : editingBrand ? 'Update Brand' : 'Create Brand'}
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

      <DataView
        items={brands}
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
          headers: ['Name', 'Description', 'Status', 'Products', 'Created', 'Updated', 'Actions'],
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

      {/* Row Details Dialog */}
      <RowDetailsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        title="Brand Details"
        data={selectedDetailItem}
      />
    </div>
  )
}