'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { MobileCard, MobileCardHeader, MobileCardField, MobileStatsCard } from '@/components/ui/mobile-card'
import { LoadingPage } from '@/components/ui/skeleton'
import { useToast } from '@/contexts/ToastContext'
import {
  Plus,
  Filter,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  SlidersHorizontal
} from 'lucide-react'
import { commonColumns, ExportButton } from '@/lib/excel-export'
import { TableFilters } from '@/components/ui/table-filters'
import { DataView as AppDataView } from '@/components/ui/data-view'
import { RowDetailsDialog } from '@/components/ui/row-details-dialog'
import AddStockForm from '@/components/inventory/AddStockForm'
import ImageUpload from '@/components/ui/image-upload'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const formatDate = (dateString: string) => {
  const d = new Date(dateString)
  const day = d.getDate().toString().padStart(2, '0')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`
}

interface InventoryItem {
  id: string
  product: {
    name: string
    code: string
    brand: { name: string }
    category: { name: string }
    size?: { name: string }
    sqftPerBox: number
    imageUrl?: string
  }
  location: { name: string }
  batchNumber: string
  quantity: number
  purchasePrice: number
  sellingPrice: number
  expiryDate?: string
  imageUrl?: string
  createdAt: string
  updatedAt?: string
  createdBy?: { name: string }
  updatedBy?: { name: string }
}

interface Filters {
  locationId: string
  brandId: string
  categoryId: string
  lowStock: string
  dateFrom: string
  dateTo: string
  sortBy: string
  sortOrder: string
}

export default function InventoryPage() {
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedDetailItem, setSelectedDetailItem] = useState<InventoryItem | null>(null)
  const [editFormData, setEditFormData] = useState({
    batchNumber: '',
    quantity: '',
    purchasePrice: '',
    sellingPrice: '',
    imageUrl: ''
  })
  
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  })
  
  const [filters, setFilters] = useState<any>({
    locationId: '',
    brandId: '',
    categoryId: '',
    lowStock: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [search, setSearch] = useState('')

  const filterConfigs = useMemo(() => [
    {
      key: 'locationId',
      label: 'Location',
      type: 'select' as const,
      options: [
        { value: 'none', label: 'All Locations' },
        ...locations.map(l => ({ value: l.id, label: l.name }))
      ]
    },
    {
      key: 'brandId',
      label: 'Brand',
      type: 'select' as const,
      options: [
        { value: 'none', label: 'All Brands' },
        ...brands.map(b => ({ value: b.id, label: b.name }))
      ]
    },
    {
      key: 'categoryId',
      label: 'Category',
      type: 'select' as const,
      options: [
        { value: 'none', label: 'All Categories' },
        ...categories.map(c => ({ value: c.id, label: c.name }))
      ]
    },
    {
      key: 'lowStock',
      label: 'Stock Level',
      type: 'select' as const,
      options: [
        { value: 'none', label: 'All Stock Levels' },
        { value: 'low', label: 'Low Stock (< 10)' },
        { value: 'out', label: 'Out of Stock' }
      ]
    }
  ], [locations, brands, categories])

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: search || '',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      })
      
      const response = await fetch(`/api/inventory?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setInventory(data.inventory || [])
        setPagination(data.pagination || pagination)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      const data = await response.json()
      if (response.ok) setLocations(data.locations || [])
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands')
      const data = await response.json()
      if (response.ok) setBrands(data.brands || [])
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (response.ok) setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [pagination.page, pagination.limit, filters, search])

  useEffect(() => {
    fetchLocations()
    fetchBrands()
    fetchCategories()
  }, [])

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setShowAddDialog(true)
    }
  }, [searchParams])

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      locationId: '',
      brandId: '',
      categoryId: '',
      lowStock: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  }

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item)
    setEditFormData({
      batchNumber: item.batchNumber,
      quantity: item.quantity.toString(),
      purchasePrice: item.purchasePrice.toString(),
      sellingPrice: item.sellingPrice.toString(),
      imageUrl: item.imageUrl || ''
    })
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedItem) return
    
    try {
      const response = await fetch(`/api/inventory/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchNumber: editFormData.batchNumber,
          quantity: parseInt(editFormData.quantity),
          purchasePrice: parseFloat(editFormData.purchasePrice),
          sellingPrice: parseFloat(editFormData.sellingPrice),
          imageUrl: editFormData.imageUrl
        })
      })
      
      if (response.ok) {
        setShowEditDialog(false)
        fetchInventory()
      }
    } catch (error) {
      console.error('Error updating batch:', error)
    }
  }

  const handleDelete = (item: InventoryItem) => {
    setDeleteItem(item)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return

    try {
      const response = await fetch(`/api/inventory/${deleteItem.id}`, { method: 'DELETE' })
      const data = await response.json()

      if (response.ok) {
        showToast('Batch deleted successfully', 'success')
        setDeleteItem(null)
        fetchInventory()
      } else {
        showToast(`Failed to delete batch: ${data.error || 'Unknown error'}`, 'error')
        console.error('Delete error:', data)
      }
    } catch (error) {
      console.error('Error deleting batch:', error)
      showToast('Error deleting batch. Please try again.', 'error')
    }
  }

  const getStockBadgeVariant = (quantity: number) => {
    if (quantity === 0) return 'destructive'
    if (quantity < 10) return 'secondary'
    return 'default'
  }

  const renderGridItem = (item: InventoryItem) => (
    <MobileCard 
      className="cursor-pointer h-full border-border/50 hover:shadow-premium transition-all duration-300"
      onClick={() => {
        setSelectedDetailItem(item)
        setShowDetails(true)
      }}
    >
      <MobileCardHeader
        title={item.product.name}
        subtitle={`${item.product.brand.name} • ${item.product.code}`}
        badge={
          <div className="flex items-center gap-2 flex-nowrap">
            <Badge variant={getStockBadgeVariant(item.quantity)} className="text-xs whitespace-nowrap font-bold">
              {item.quantity} units
            </Badge>
            {item.quantity < 10 && <AlertTriangle className="h-4 w-4 text-destructive" />}
          </div>
        }
        actions={
          <div onClick={(e) => e.stopPropagation()} className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10">
              <Edit className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(item)} className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        }
      />
      <div className="space-y-3 mt-4">
        <MobileCardField label="Size" value={item.product.size?.name || 'N/A'} />
        <MobileCardField label="Category" value={item.product.category.name} />
        <MobileCardField label="Batch" value={<code className="bg-muted px-2 py-0.5 rounded text-[10px] font-mono border border-border/40">{item.batchNumber}</code>} />
        <MobileCardField label="Location" value={item.location.name} />
        <div className="pt-3 mt-3 border-t border-border/30 grid grid-cols-2 gap-4">
          <MobileCardField label="Purchase" value={`₹${item.purchasePrice.toLocaleString()}`} />
          <MobileCardField label="Selling" value={`₹${item.sellingPrice.toLocaleString()}`} />
        </div>
        <div className="pt-3 mt-3 border-t border-border/30">
          <MobileCardField label="Total Value" value={`₹${(item.quantity * item.sellingPrice).toLocaleString()}`} className="text-sm font-bold text-primary" />
        </div>
      </div>
    </MobileCard>
  )

  const renderListRow = (item: InventoryItem) => (
    <>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl overflow-hidden bg-muted/20 border border-border/40 flex-shrink-0">
            {item.imageUrl || item.product.imageUrl ? (
              <img 
                src={item.imageUrl || item.product.imageUrl} 
                alt={item.product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground/40">
                <Package className="h-5 w-5" />
              </div>
            )}
          </div>
          <div>
            <div className="font-bold text-foreground group-hover:text-primary transition-colors">{item.product.name}</div>
            <div className="text-xs font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full inline-block mt-1">
              {item.product.brand.name} • {item.product.code}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
          <Badge variant={getStockBadgeVariant(item.quantity)} className="whitespace-nowrap tabular-nums font-bold">
            {item.quantity} units
          </Badge>
          {item.quantity < 10 && (
            <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-sm font-medium">{item.product.size?.name || '—'}</td>
      <td className="px-6 py-4 text-sm">{item.product.category.name}</td>
      <td className="px-6 py-4">
        <code className="bg-muted px-2 py-0.5 rounded-md text-[11px] font-mono border border-border/30">
          {item.batchNumber}
        </code>
      </td>
      <td className="px-6 py-4 text-sm">{item.location.name}</td>
      <td className="px-6 py-4 text-right font-mono tabular-nums text-xs">₹{item.purchasePrice.toLocaleString()}</td>
      <td className="px-6 py-4 text-right font-mono tabular-nums text-xs font-bold">₹{item.sellingPrice.toLocaleString()}</td>
      <td className="px-6 py-4 text-right font-bold font-mono tabular-nums text-primary text-sm">
        ₹{(item.quantity * item.sellingPrice).toLocaleString()}
      </td>
      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
        <div className="text-xs font-bold text-foreground">{formatDate(item.createdAt)}</div>
        <div className="text-[10px] opacity-70">{item.createdBy?.name || 'System'}</div>
      </td>
      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
        {item.updatedAt && item.updatedAt !== item.createdAt
          ? (
            <>
              <div className="text-xs font-bold text-foreground">{formatDate(item.updatedAt)}</div>
              <div className="text-[10px] opacity-70">{item.updatedBy?.name || 'System'}</div>
            </>
          )
          : <span className="text-xs opacity-30">—</span>
        }
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10" onClick={() => handleEdit(item)}>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10" onClick={() => handleDelete(item)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </td>
    </>
  )

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 space-y-8 pb-10">
      {/* Header */}
      <TableFilters
        title="Inventory"
        filters={filterConfigs}
        values={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters)
          setPagination(prev => ({ ...prev, page: 1 }))
        }}
        searchValue={search}
        onSearchChange={setSearch}
        loading={loading}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={inventory}
              columns={commonColumns.inventory}
              filename="inventory-export"
              reportTitle="Inventory Report"
              onExportComplete={(result) => {
                if (result.success) {
                  showToast(`Exported ${inventory.length} items successfully!`, 'success')
                } else {
                  showToast(result.error || 'Export failed', 'error')
                }
              }}
              disabled={inventory.length === 0}
            />
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-10 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" />
                  Add Stock
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl glass backdrop-blur-xl border-border/50 rounded-3xl shadow-premium animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Add Stock Batch</DialogTitle>
                </DialogHeader>
                <AddStockForm
                  onSuccess={() => {
                    setShowAddDialog(false)
                    fetchInventory()
                  }}
                  onCancel={() => setShowAddDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="space-y-6">
        <AppDataView
          items={inventory}
          view={view}
          onViewChange={setView}
          loading={loading}
          autoResponsive={true}
          gridProps={{
            renderItem: renderGridItem,
            columns: 2
          }}
          listProps={{
            headers: ['Product', 'Stock', 'Size', 'Category', 'Batch', 'Location', 'Purchase', 'Selling', 'Total Value', 'Created', 'Updated', 'Actions'],
            renderRow: renderListRow
          }}
        />

        <div className="flex items-center justify-between mt-6 bg-muted/20 p-4 rounded-2xl border border-border/40">
          <div className="text-sm text-muted-foreground font-medium">
            Showing <span className="text-foreground font-bold">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="text-foreground font-bold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="text-foreground font-bold">{pagination.total}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="rounded-xl h-9 px-4 font-bold border-border/50 hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="hidden sm:flex items-center gap-1.5">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={pagination.page === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page }))}
                    className={cn(
                      "h-9 w-9 p-0 rounded-xl font-bold transition-all",
                      pagination.page === page ? "shadow-lg shadow-primary/20" : "border-border/50"
                    )}
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="rounded-xl h-9 px-4 font-bold border-border/50 hover:bg-muted"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

    {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="glass backdrop-blur-xl border-border/50 max-w-md rounded-3xl shadow-premium animate-in zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Edit Inventory Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 ml-1">Batch Number</label>
              <Input
                value={editFormData.batchNumber}
                onChange={(e) => setEditFormData({ ...editFormData, batchNumber: e.target.value })}
                className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 ml-1">Quantity</label>
              <Input
                type="number"
                value={editFormData.quantity}
                onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 ml-1">Purchase Price</label>
                <Input
                  type="number"
                  value={editFormData.purchasePrice}
                  onChange={(e) => setEditFormData({ ...editFormData, purchasePrice: e.target.value })}
                  className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 ml-1">Selling Price</label>
                <Input
                  type="number"
                  value={editFormData.sellingPrice}
                  onChange={(e) => setEditFormData({ ...editFormData, sellingPrice: e.target.value })}
                  className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12"
                />
              </div>
            </div>

            <div className="space-y-2 border-t border-border/30 pt-4">
              <label className="text-sm font-bold text-foreground/80 ml-1 italic">Update Batch Photo (Optional)</label>
              <ImageUpload
                onImageUploaded={(url) => setEditFormData({ ...editFormData, imageUrl: url })}
                currentImage={editFormData.imageUrl}
                className="rounded-2xl border-dashed border-2 border-border/40 hover:border-primary/40 transition-all bg-muted/5 max-w-sm"
                label={null}
              />
              <p className="text-[10px] text-muted-foreground ml-1">Update the specific photo for this batch.</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveEdit}
                className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20"
              >
                Save Batch Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="rounded-2xl h-12 px-6 border-border/50 font-bold hover:bg-muted/50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteItem}
        onOpenChange={(open) => {
          if (!open) setDeleteItem(null)
        }}
        title="Delete Batch"
        description={deleteItem ? `Are you sure you want to delete batch ${deleteItem.batchNumber}? This will also remove related purchase and sales records.` : ''}
        onConfirm={() => handleDeleteConfirm()}
        confirmText="Delete"
        variant="destructive"
      />

      <RowDetailsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        title="Inventory Batch Details"
        data={selectedDetailItem}
        fields={[
          { label: 'Product', value: selectedDetailItem?.product?.name },
          { label: 'Code', value: selectedDetailItem?.product?.code },
          { label: 'Batch Number', value: selectedDetailItem?.batchNumber },
          { label: 'Location', value: selectedDetailItem?.location?.name },
          { label: 'Quantity', value: selectedDetailItem?.quantity, variant: 'number' as const },
          { label: 'Purchase Price', value: selectedDetailItem?.purchasePrice ? `₹${selectedDetailItem.purchasePrice.toLocaleString()}` : undefined },
          { label: 'Selling Price', value: selectedDetailItem?.sellingPrice ? `₹${selectedDetailItem.sellingPrice.toLocaleString()}` : undefined },
          { label: 'Brand', value: selectedDetailItem?.product?.brand?.name },
          { label: 'Category', value: selectedDetailItem?.product?.category?.name },
          { label: 'Size', value: selectedDetailItem?.product?.size?.name },
          { label: 'Created At', value: selectedDetailItem?.createdAt },
        ].filter(f => f.value !== undefined)}
        imageUrl={selectedDetailItem?.product?.imageUrl}
      />
    </div>
  )
}
