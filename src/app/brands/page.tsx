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
import { Filter, Plus, Edit, Trash2, Package } from 'lucide-react'
import { RowDetailsDialog } from '@/components/ui/row-details-dialog'
import { cn } from '@/lib/utils'
import { useResponsiveDefaultView } from '@/hooks/use-responsive-default-view'

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

interface BrandEntry {
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
  const { view, setView } = useResponsiveDefaultView()
  const [showForm, setShowForm] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [deleteBrand, setDeleteBrand] = useState<Brand | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedDetailItem, setSelectedDetailItem] = useState<Brand | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    isActive: true
  })
  const [entries, setEntries] = useState<BrandEntry[]>([])
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
        if (value && value !== '' && value !== 'all') params.append(key, value as string)
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
    if (!formData.name.trim() && entries.length === 0) {
      showToast('Please enter a brand name', 'error')
      return
    }

    setSubmitting(true)
    try {
      if (editingBrand) {
        const response = await fetch(`/api/brands/${editingBrand.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (response.ok) {
          showToast('Brand updated successfully!', 'success')
          setShowForm(false)
          setEditingBrand(null)
          resetForm()
          fetchBrands()
        } else {
          const errorData = await response.json()
          showToast(errorData.error || 'Failed to save brand', 'error')
        }
      } else {
        // Submit all entries + current form
        const allEntries = [...entries, formData].filter(e => e.name.trim())
        let successCount = 0
        const errors: string[] = []
        for (const entry of allEntries) {
          const response = await fetch('/api/brands', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
          })
          if (response.ok) {
            successCount++
          } else {
            const errorData = await response.json()
            errors.push(errorData.error || `Failed to create "${entry.name}"`)
          }
        }
        if (successCount > 0) {
          showToast(`${successCount} brand(s) created successfully!`, 'success')
          setShowForm(false)
          setEntries([])
          resetForm()
          fetchBrands()
        }
        if (errors.length > 0) {
          showToast(errors.join(' | '), 'error')
        }
      }
    } catch (error) {
      showToast('Error saving brand', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', isActive: true })
    setEntries([])
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
    const target = deleteBrand
    const previousBrands = brands

    setDeleting(true)
    setBrands((prev) => prev.filter((brand) => brand.id !== target.id))
    setTotalCount((prev) => Math.max(0, prev - 1))
    setDeleteBrand(null)

    try {
      const response = await fetch(`/api/brands/${target.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('Brand deleted successfully!', 'success')
        fetchBrands()
      } else {
        const errorData = await response.json()
        setBrands(previousBrands)
        setTotalCount((prev) => prev + 1)
        showToast(errorData.error || 'Failed to delete brand', 'error')
      }
    } catch (error) {
      setBrands(previousBrands)
      setTotalCount((prev) => prev + 1)
      showToast('Error deleting brand', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    const day = d.getDate().toString().padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`
  }

  const renderGridItem = useCallback((brand: Brand) => (
    <Card className="flex flex-col hover:shadow-premium transition-all duration-300 border-border/50 group overflow-hidden h-full">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-bold text-card-foreground group-hover:text-primary transition-colors line-clamp-1 flex-1">
            {brand.name}
          </CardTitle>
          <Badge variant={brand.isActive ? 'default' : 'secondary'} className={cn("shrink-0", brand.isActive ? "bg-primary/20 text-primary border-none" : "")}>
            {brand.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col flex-1">
        {/* Fixed height description — always reserves space */}
        <p className="text-xs text-muted-foreground italic h-8 line-clamp-2 mb-3">
          {brand.description?.trim() || ''}
        </p>
        {/* Fixed height meta row */}
        <div className="flex items-center text-xs text-muted-foreground mb-3 h-5">
          <span className="flex items-center gap-1 font-medium">
            <Package className="h-3 w-3" />
            {brand._count?.products || 0} Products
          </span>
        </div>
        {/* Fixed height info block */}
        <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-2.5 rounded-xl border border-border/30 mb-3">
          <div className="flex justify-between"><span>Created:</span><span className="font-medium text-foreground">{formatDate(brand.createdAt)}</span></div>
          <div className="flex justify-between"><span>Updated:</span><span className="font-medium text-foreground">{brand.updatedAt && brand.updatedAt !== brand.createdAt ? formatDate(brand.updatedAt) : 'N/A'}</span></div>
          <div className="flex justify-between"><span>By:</span><span className="font-medium text-foreground">{brand.createdBy?.name || 'N/A'}</span></div>
        </div>
        {/* Actions always at bottom */}
        <div className="flex gap-2 mt-auto">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(brand) }} className="flex-1 rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 gap-1.5 font-bold h-8 text-xs">
            <Edit className="h-3 w-3" />Edit
          </Button>
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteBrand(brand) }} className="flex-1 rounded-xl text-destructive hover:text-destructive border-border/50 hover:bg-destructive/10 gap-1.5 font-bold h-8 text-xs">
            <Trash2 className="h-3 w-3" />Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [formatDate])

  const renderListRow = useCallback((brand: Brand) => (
    <>
      <td className="px-4 py-2.5">
        <div className="font-bold text-foreground group-hover:text-primary transition-colors">{brand.name}</div>
      </td>
      <td className="px-4 py-2.5">
        <div className="font-bold text-foreground">{brand._count?.products || 0}</div>
      </td>
      <td className="px-4 py-2.5">
        <Badge
          variant={brand.isActive ? 'default' : 'secondary'}
          className={cn(brand.isActive ? "bg-primary/20 text-primary border-none" : "")}
        >
          {brand.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-2.5 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">{formatDate(brand.createdAt)}</div>
        <div className="text-xs">{brand.createdBy?.name || 'N/A'}</div>
      </td>
      <td className="px-4 py-2.5 text-sm text-muted-foreground">
        <div>
          <div className="font-medium text-foreground">{brand.updatedAt && brand.updatedAt !== brand.createdAt ? formatDate(brand.updatedAt) : 'N/A'}</div>
          <div className="text-xs">{brand.updatedAt && brand.updatedAt !== brand.createdAt ? (brand.updatedBy?.name || 'N/A') : 'N/A'}</div>
        </div>
      </td>
      <td className="px-4 py-2.5">
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

  const makeExportRows = (data: Brand[]) => data.map(b => ({
    col1: b.isActive ? 'Active' : 'Inactive',
    col2: `${b._count?.products || 0} products`,
    col3: b.name,
    badge: b.isActive ? 'Active' : 'Inactive',
  }))

  const exportConfig = useMemo(() => ({
    title: 'Brands Report',
    rows: makeExportRows(brands),
    grandTotal: totalCount,
    grandTotalLabel: 'Total Brands',
    excelColumns: commonColumns.brand,
    excelData: brands,
    filename: 'brands-export',
    sheetName: 'Brands',
    fetchAllData: async () => {
      const params = new URLSearchParams({ page: '1', limit: '10000', search: search || '' })
      Object.entries(filters).forEach(([k, v]) => { if (v && v !== '' && v !== 'all') params.append(k, v as string) })
      const res = await fetch(`/api/brands?${params}`)
      const data = await res.json()
      const all: Brand[] = data.brands || []
      return { rows: makeExportRows(all), excelData: all }
    },
  }), [brands, totalCount, filters, search])

  const customExportFilters = useMemo(() => ({
    statuses: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
    filterData: ({ status, dateFrom, dateTo }: any) => {
      let filtered = brands
      if (status === 'active') filtered = filtered.filter(b => b.isActive)
      if (status === 'inactive') filtered = filtered.filter(b => !b.isActive)
      if (dateFrom) filtered = filtered.filter(b => new Date(b.createdAt) >= new Date(dateFrom))
      if (dateTo) filtered = filtered.filter(b => new Date(b.createdAt) <= new Date(dateTo))
      return { rows: makeExportRows(filtered), excelData: filtered }
    },
  }), [brands])

  if (loading && brands.length === 0) {
    return <LoadingPage view={view} title="Brands" />
  }

  return (
    <div className="admin-page">
      {/* Filters */}
      <TableFilters
        title="Brands"
        actions={
          <div className="flex items-center gap-2">
            <PageExportButton config={exportConfig} customFilters={customExportFilters} disabled={brands.length === 0} />
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingBrand(null)
                    resetForm()
                  }}
                  className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold gap-2 shadow-lg shadow-primary/20"
                >
                  <Plus className="h-4 w-4" />
                  Add Brand
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl shadow-premium animate-in zoom-in-95 duration-200">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                    {editingBrand ? 'Edit Brand' : 'Add New Brand'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                  {/* Queued entries */}
                  {!editingBrand && entries.length > 0 && (
                    <div className="space-y-2">
                      {entries.map((entry, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-primary/5 rounded-2xl border border-primary/10">
                          <div className="flex-1 text-sm font-bold text-foreground">{entry.name}</div>
                          <div className="text-xs text-muted-foreground">{entry.description || '—'}</div>
                          <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={() => setEntries(entries.filter((_, i) => i !== idx))}>
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/80 ml-1">Name <span className="text-destructive">*</span></label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter brand name"
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

                  <div className="flex gap-3 pt-2">
                    {!editingBrand && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (!formData.name.trim()) { showToast('Enter a brand name first', 'error'); return }
                          setEntries([...entries, { ...formData }])
                          setFormData({ name: '', description: '', isActive: true })
                        }}
                        className="rounded-2xl h-12 px-5 border-primary/30 text-primary hover:bg-primary/10 font-bold gap-2"
                      >
                        <Plus className="h-4 w-4" /> Add More
                      </Button>
                    )}
                    <Button type="submit" disabled={submitting} className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20">
                      {submitting ? 'Saving...' : editingBrand ? 'Update Brand' : entries.length > 0 ? `Create ${entries.length + 1} Brands` : 'Create Brand'}
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
          </div>
        }
        filters={filterConfigs}
        values={filters}
        onFiltersChange={updateFilters}
        searchValue={search}
        onSearchChange={updateSearch}
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
          headers: ['Brand', 'Products', 'Status', 'Created', 'Updated', 'Actions'],
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
        showItemsPerPage={view === 'list'}
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
        loading={deleting}
      />

      {/* Row Details Dialog */}
      <RowDetailsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        title="Brand Details"
        data={selectedDetailItem}
        fields={[
          { label: 'Name', value: selectedDetailItem?.name },
          { label: 'Description', value: selectedDetailItem?.description },
          { label: 'Status', value: selectedDetailItem?.isActive, variant: 'badge' as const },
          { label: 'Products', value: selectedDetailItem?._count?.products || 0, variant: 'number' as const },
          { label: 'Created Date', value: selectedDetailItem?.createdAt },
          { label: 'Created By', value: selectedDetailItem?.createdBy?.name },
          { label: 'Updated Date', value: selectedDetailItem?.updatedAt !== selectedDetailItem?.createdAt ? selectedDetailItem?.updatedAt : undefined },
          { label: 'Updated By', value: selectedDetailItem?.updatedAt !== selectedDetailItem?.createdAt ? selectedDetailItem?.updatedBy?.name : undefined },
        ].filter(f => f.value !== undefined)}
      />
    </div>
  )
}
