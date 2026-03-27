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
import { useResponsiveDefaultView } from '@/hooks/use-responsive-default-view'

interface Category {
  id: string
  name: string
  description?: string
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

interface CategoryEntry {
  name: string
  description: string
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
  const [loading, setLoading] = useState(true)
  const { view, setView } = useResponsiveDefaultView()
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedDetailItem, setSelectedDetailItem] = useState<Category | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    isActive: true
  })
  const [entries, setEntries] = useState<CategoryEntry[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

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



  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])



  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setEditingCategory(null)
      resetForm()
      setShowForm(true)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      showToast('Please fill in Name', 'error')
      return
    }

    setSubmitting(true)
    try {
      if (editingCategory) {
        const response = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (response.ok) {
          showToast('Category updated successfully!', 'success')
          setShowForm(false)
          setEditingCategory(null)
          resetForm()
          fetchCategories()
        } else {
          const errorData = await response.json()
          showToast(errorData.error || 'Failed to save category', 'error')
        }
      } else {
        const allEntries = [...entries, formData].filter(e => e.name.trim())
        let successCount = 0
        for (const entry of allEntries) {
          const response = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
          })
          if (response.ok) successCount++
        }
        showToast(`${successCount} category(s) created successfully!`, 'success')
        setShowForm(false)
        setEntries([])
        resetForm()
        fetchCategories()
      }
    } catch (error) {
      showToast('Error saving category', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', isActive: true })
    setEntries([])
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
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
    const d = new Date(dateString)
    const day = d.getDate().toString().padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`
  }

  const renderGridItem = useCallback((category: Category) => (
    <Card className="h-full hover:shadow-premium transition-all duration-300 border-border/50 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors">
              {category.name}
            </CardTitle>
          </div>
          <Badge
            variant={category.isActive ? 'default' : 'secondary'}
            className={cn(category.isActive ? "bg-primary/20 text-primary border-none" : "")}
          >
            {category.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 italic min-h-10">
          {category.description?.trim() || 'N/A'}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5 font-medium">
            <Package className="h-3 w-3" />
            Products: {category._count?.products || 0}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mb-6 space-y-1 bg-muted/30 p-2.5 rounded-xl border border-border/30">
          <div className="flex justify-between"><span>Created:</span> <span className="font-medium text-foreground">{formatDate(category.createdAt)}</span></div>
          <div className="flex justify-between">
            <span>Updated:</span>
            <span className="font-medium text-foreground">{category.updatedAt && category.updatedAt !== category.createdAt ? formatDate(category.updatedAt) : 'N/A'}</span>
          </div>
          <div className="flex justify-between"><span>By:</span> <span className="font-medium text-foreground">{category.createdBy?.name || 'N/A'}</span></div>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEdit(category); }}
            className="flex-1 rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 gap-2 font-bold h-9"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setDeleteCategory(category); }}
            className="flex-1 rounded-xl text-destructive hover:text-destructive border-border/50 hover:bg-destructive/10 hover:border-destructive/30 gap-2 font-bold h-9"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [formatDate])

  const renderListRow = useCallback((category: Category) => (
    <>
      <td className="px-4 py-2.5">
        <div className="font-bold text-foreground group-hover:text-primary transition-colors">{category.name}</div>
      </td>
      <td className="px-4 py-2.5">
        <div className="font-bold text-foreground">{category._count?.products || 0}</div>
      </td>
      <td className="px-4 py-2.5">
        <Badge
          variant={category.isActive ? 'default' : 'secondary'}
          className={cn(category.isActive ? "bg-primary/20 text-primary border-none" : "")}
        >
          {category.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-2.5 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">{formatDate(category.createdAt)}</div>
        <div className="text-xs">{category.createdBy?.name || 'N/A'}</div>
      </td>
      <td className="px-4 py-2.5 text-sm text-muted-foreground">
        <div>
          <div className="font-medium text-foreground">{category.updatedAt && category.updatedAt !== category.createdAt ? formatDate(category.updatedAt) : 'N/A'}</div>
          <div className="text-xs">{category.updatedAt && category.updatedAt !== category.createdAt ? (category.updatedBy?.name || 'N/A') : 'N/A'}</div>
        </div>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEdit(category); }}
            className="rounded-xl hover:bg-primary/10 hover:text-primary gap-2 font-bold px-3 transition-all"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setDeleteCategory(category); }}
            className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 font-bold px-3 transition-all"
          >
            <Trash2 className="h-4 w-4" />
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
    <div className="w-full px-3 sm:px-4 md:px-6 space-y-6">
      <TableFilters
        title="Categories"
        filters={filterConfigs}
        values={filters}
        onFiltersChange={updateFilters}
        searchValue={search}
        onSearchChange={updateSearch}
        loading={loading}
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
            <Button size="sm" onClick={() => {
              setEditingCategory(null)
              resetForm()
              setShowForm(true)
            }} className="h-10 rounded-xl gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </div>
        }
      />

      {/* Data View */}
      <DataView
        items={categories}
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
          headers: ['Category', 'Products', 'Status', 'Created', 'Updated', 'Actions'],
          renderRow: renderListRow
        }}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="glass backdrop-blur-xl border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl shadow-premium animate-in zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            {/* Queued entries */}
            {!editingCategory && entries.length > 0 && (
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
                placeholder="Enter category name"
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
              {!editingCategory && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!formData.name.trim()) { showToast('Enter a category name first', 'error'); return }
                    setEntries([...entries, { ...formData }])
                    setFormData({ name: '', description: '', isActive: true })
                  }}
                  className="rounded-2xl h-12 px-5 border-primary/30 text-primary hover:bg-primary/10 font-bold gap-2"
                >
                  <Plus className="h-4 w-4" /> Add More
                </Button>
              )}
              <Button type="submit" disabled={submitting} className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20">
                {submitting ? 'Saving...' : editingCategory ? 'Update Category' : entries.length > 0 ? `Create ${entries.length + 1} Categories` : 'Create Category'}
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
        open={!!deleteCategory}
        onOpenChange={(open) => !open && setDeleteCategory(null)}
        title={deleteConfirmation.title}
        description={`Are you sure you want to delete "${deleteCategory?.name}"? This action cannot be undone.`}
        confirmText={deleteConfirmation.confirmText}
        variant={deleteConfirmation.variant}
        onConfirm={handleDeleteConfirm}
        icon={deleteConfirmation.icon}
      />

      <RowDetailsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        title="Category Details"
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