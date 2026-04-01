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
import { exportToExcel, commonColumns } from '@/lib/excel-export'
import { SmartExportModal } from '@/components/reports/PageExport'
import { LoadingPage } from '@/components/ui/skeleton'
import { Filter, Plus, Edit, Trash2, Package, Download } from 'lucide-react'
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
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportingReport, setExportingReport] = useState(false)
  const [exportBrands, setExportBrands] = useState<any[]>([])
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

  // Fetch categories with pagination and filters
  const fetchCategories = useCallback(async () => {
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
    fetch('/api/brands?limit=1000&isActive=true').then(r => r.json()).then(d => setExportBrands(d.brands || []))
  }, [])

  const handleSmartExport = async (opts: { format: 'excel' | 'pdf' | 'png'; reportType: string; brandId?: string; categoryId?: string; sizeId?: string; status: string }) => {
    setExportingReport(true)
    try {
      const params = new URLSearchParams({ limit: '1000' })
      if (opts.brandId) params.set('brandId', opts.brandId)
      if (opts.status === 'active') params.set('isActive', 'true')
      else if (opts.status === 'inactive') params.set('isActive', 'false')

      let data: any[] = []
      let title = 'Report'
      let cols = commonColumns.category

      if (opts.reportType === 'categories') {
        const res = await fetch(`/api/categories?${params}`)
        data = (await res.json()).categories || []
        title = 'Categories Report'; cols = commonColumns.category
      } else if (opts.reportType === 'products') {
        const res = await fetch(`/api/products?${params}`)
        data = (await res.json()).products || []
        title = 'Products Report'; cols = commonColumns.product
      } else if (opts.reportType === 'inventory') {
        const res = await fetch(`/api/inventory?limit=1000`)
        data = (await res.json()).inventory || []
        title = 'Inventory Report'; cols = commonColumns.inventory
      } else if (opts.reportType === 'sales') {
        const res = await fetch('/api/sales-orders')
        data = (await res.json()).orders || []
        title = 'Sales Orders Report'; cols = commonColumns.salesOrder
      } else if (opts.reportType === 'purchase') {
        const res = await fetch('/api/purchase-orders')
        data = (await res.json()).orders || []
        title = 'Purchase Orders Report'; cols = commonColumns.purchaseOrder
      }

      if (opts.format === 'excel') {
        exportToExcel({ filename: `${opts.reportType}-export`, sheetName: title, columns: cols, data, reportTitle: title })
        setShowExportModal(false)
        return
      }

      // PDF / PNG — build rows and render to temp div
      const NAVY = '#1E3A8A'
      const CB = `1px solid ${NAVY}`
      const NB = `2px solid ${NAVY}`
      const rows = data.slice(0, 60).map((item: any) => ({
        imageUrl: item.imageUrl || item.product?.imageUrl,
        col1: item.brand?.name || item.product?.brand?.name || item.category?.name || '',
        col2: item.size?.name || item.product?.size?.name || item.status || '',
        col3: item.name || item.orderNumber || item.product?.name || '',
        qty: item._count?.products ?? item.quantity ?? undefined,
        badge: item.isActive !== undefined ? (item.isActive ? 'Active' : 'Inactive') : (item.status || ''),
      }))

      const tempDiv = document.createElement('div')
      tempDiv.style.cssText = 'position:fixed;left:-9999px;top:0;background:#fff;width:880px;z-index:-1;'
      document.body.appendChild(tempDiv)
      tempDiv.innerHTML = `<div style="background:#fff;color:#000;font-family:Arial,sans-serif;padding:40px 50px 50px;min-width:680px;max-width:880px;box-sizing:border-box">
        <div style="font-weight:bold;font-size:22px;margin-bottom:8px">${title}</div>
        <div style="border:${NB};padding:6px 14px;color:${NAVY};font-weight:bold;text-align:center;font-size:12px;letter-spacing:.08em;text-transform:uppercase">ITEM DESCRIPTION</div>
        ${rows.map((r: any) => `
          <div style="display:flex;border:${CB};border-top:none">
            <div style="width:20%;min-width:120px;padding:12px 14px;border-right:${CB};font-size:12px;line-height:1.7;flex-shrink:0">
              <div>${r.col1}</div><div>${r.col2}</div><div style="font-weight:bold">${r.col3}</div>
              ${r.badge ? `<div style="margin-top:4px;display:inline-block;padding:1px 6px;background:${NAVY};color:#fff;border-radius:3px;font-size:10px;font-weight:bold">${r.badge}</div>` : ''}
            </div>
            ${r.qty !== undefined ? `<div style="width:10%;min-width:60px;padding:12px 8px;border-right:${CB};text-align:center;flex-shrink:0"><div style="font-weight:bold;font-size:10px">PRE</div><div style="font-weight:bold;font-size:28px">${r.qty}</div></div>` : ''}
            <div style="flex:1;background:${NAVY};overflow:hidden;border-right:${CB}">
              ${r.imageUrl ? `<img src="${r.imageUrl}" crossorigin="anonymous" style="width:100%;height:150px;object-fit:cover;display:block" />` : `<div style="height:150px;display:flex;align-items:center;justify-content:center;color:#93C5FD;font-size:11px">${r.col3}</div>`}
            </div>
            <div style="width:20%;min-width:90px;background:${NAVY};flex-shrink:0"></div>
          </div>`).join('')}
        <div style="display:flex;justify-content:center;align-items:baseline;gap:80px;margin-top:16px;padding-top:14px;border-top:1px solid #ccc;font-weight:bold;font-size:15px">
          <span>GRAND TOTAL :</span><span style="font-size:18px">${data.length}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:40px;font-size:11px;color:#555">
          <span>${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span>Page 1 of 1</span>
        </div>
      </div>`

      await new Promise(r => setTimeout(r, 300))
      const { default: html2canvas } = await import('html2canvas')
      const el = tempDiv.firstElementChild as HTMLElement
      if (el) {
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#fff', logging: false })
        if (opts.format === 'png') {
          const a = document.createElement('a'); a.download = `${opts.reportType}-${Date.now()}.png`; a.href = canvas.toDataURL('image/png'); a.click()
        } else {
          const { default: jsPDF } = await import('jspdf')
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
          const pdfW = pdf.internal.pageSize.getWidth()
          const pdfH = (canvas.height * pdfW) / canvas.width
          const pageH = pdf.internal.pageSize.getHeight()
          let y = 0
          while (y < pdfH) { if (y > 0) pdf.addPage(); pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -y, pdfW, pdfH); y += pageH }
          pdf.save(`${opts.reportType}-${Date.now()}.pdf`)
        }
      }
      document.body.removeChild(tempDiv)
      setShowExportModal(false)
    } catch (e) { console.error(e) }
    finally { setExportingReport(false) }
  }



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
        const errors: string[] = []
        for (const entry of allEntries) {
          const response = await fetch('/api/categories', {
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
          showToast(`${successCount} category(s) created successfully!`, 'success')
          setShowForm(false)
          setEntries([])
          resetForm()
          fetchCategories()
        }
        if (errors.length > 0) {
          showToast(errors.join(' | '), 'error')
        }
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
    <Card className="flex flex-col hover:shadow-premium transition-all duration-300 border-border/50 group overflow-hidden h-full">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-bold text-card-foreground group-hover:text-primary transition-colors line-clamp-1 flex-1">
            {category.name}
          </CardTitle>
          <Badge variant={category.isActive ? 'default' : 'secondary'} className={cn("shrink-0", category.isActive ? "bg-primary/20 text-primary border-none" : "")}>
            {category.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col flex-1">
        <p className="text-xs text-muted-foreground italic h-8 line-clamp-2 mb-3">
          {category.description?.trim() || ''}
        </p>
        <div className="flex items-center text-xs text-muted-foreground mb-3 h-5">
          <span className="flex items-center gap-1 font-medium">
            <Package className="h-3 w-3" />
            {category._count?.products || 0} Products
          </span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-2.5 rounded-xl border border-border/30 mb-3">
          <div className="flex justify-between"><span>Created:</span><span className="font-medium text-foreground">{formatDate(category.createdAt)}</span></div>
          <div className="flex justify-between"><span>Updated:</span><span className="font-medium text-foreground">{category.updatedAt && category.updatedAt !== category.createdAt ? formatDate(category.updatedAt) : 'N/A'}</span></div>
          <div className="flex justify-between"><span>By:</span><span className="font-medium text-foreground">{category.createdBy?.name || 'N/A'}</span></div>
        </div>
        <div className="flex gap-2 mt-auto">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(category) }} className="flex-1 rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 gap-1.5 font-bold h-8 text-xs">
            <Edit className="h-3 w-3" />Edit
          </Button>
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteCategory(category) }} className="flex-1 rounded-xl text-destructive hover:text-destructive border-border/50 hover:bg-destructive/10 gap-1.5 font-bold h-8 text-xs">
            <Trash2 className="h-3 w-3" />Delete
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
            <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}
              className="gap-2 rounded-xl border-border/50 font-bold h-9">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Export</span>
            </Button>
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

      <SmartExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        title="Categories & Reports"
        brands={exportBrands}
        onExport={handleSmartExport}
        exporting={exportingReport}
        reportTypes={[
          { value: 'categories', label: 'Categories List' },
          { value: 'products', label: 'All Products (Design Stock)' },
          { value: 'inventory', label: 'Inventory Stock Report' },
          { value: 'sales', label: 'Sales Orders Report' },
          { value: 'purchase', label: 'Purchase Orders Report' },
        ]}
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