'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { LoadingPage } from '@/components/ui/skeleton'
import {
  Plus,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  ShoppingCart
} from 'lucide-react'
import SalesOrderForm from '@/components/SalesOrderForm'
import { useToast } from '@/contexts/ToastContext'
import { RowDetailsDialog } from '@/components/ui/row-details-dialog'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { cn } from '@/lib/utils'
import { TableFilters, useTableFilters, FilterConfig } from '@/components/ui/table-filters'
import { DataView as AppDataView } from '@/components/ui/data-view'
import { useMemo, useCallback } from 'react'
import { commonColumns, ExportButton } from '@/lib/excel-export'
import { useResponsiveDefaultView } from '@/hooks/use-responsive-default-view'

const formatDate = (dateString: string) => {
  const d = new Date(dateString)
  const day = d.getDate().toString().padStart(2, '0')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`
}

interface SalesOrder {
  id: string
  orderNumber: string
  brand: { name: string }
  orderDate: string
  status: string
  totalAmount: number
  items: any[]
  createdAt: string
  updatedAt?: string
  createdBy?: { name: string }
  updatedBy?: { name: string }
}

const formatSizeInches = (sizeName?: string) => {
  if (!sizeName) return 'N/A'
  const match = sizeName.match(/([\d.]+)\s*[xX×]\s*([\d.]+)/)
  if (match) return `${match[1]}" × ${match[2]}"`
  return sizeName
}

export default function SalesOrdersPage() {
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { view, setView } = useResponsiveDefaultView()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
  const [deleteOrder, setDeleteOrder] = useState<SalesOrder | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedDetailItem, setSelectedDetailItem] = useState<SalesOrder | null>(null)

  const {
    filters: tableFilters,
    search,
    updateFilters,
    updateSearch
  } = useTableFilters()

  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      key: 'brandId',
      label: 'Brand',
      type: 'select',
      options: brands.map(b => ({ value: b.id, label: b.name })),
      placeholder: 'All Brands'
    }
  ], [brands])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/sales-orders')
      const data = await response.json()

      if (response.ok) {
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error fetching sales orders:', error)
    } finally {
      setLoading(false)
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

  useEffect(() => {
    fetchOrders()
    fetchBrands()
  }, [])

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setShowAddDialog(true)
    }
  }, [searchParams])

  const handleDelete = (order: SalesOrder) => {
    setDeleteOrder(order)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteOrder) return

    try {
      const response = await fetch(`/api/sales-orders/${deleteOrder.id}`, { method: 'DELETE' })
      if (response.ok) {
        showToast('Sales order deleted successfully', 'success')
        setDeleteOrder(null)
        fetchOrders()
      }
    } catch (error) {
      console.error('Error deleting sales order:', error)
      showToast('Error deleting sales order', 'error')
    }
  }

  const handleView = (order: SalesOrder) => {
    setSelectedOrder(order)
    setShowViewDialog(true)
  }

  const handleEdit = (order: SalesOrder) => {
    setSelectedOrder(order)
    setShowEditDialog(true)
  }

  const renderGridItem = useCallback((order: SalesOrder) => {
    const firstItem = order.items?.[0]
    const photo = firstItem?.product?.imageUrl || firstItem?.batch?.imageUrl
    const sizeName = firstItem?.product?.size?.name
    const totalQty = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0
    return (
      <div className="h-full border border-border/50 rounded-2xl overflow-hidden hover:shadow-premium transition-all duration-300 bg-card flex flex-col group">
        {/* Photo - Priority, big */}
        <div className="relative w-full aspect-[4/3] bg-muted/20 flex-shrink-0">
          {photo ? (
            <img src={photo} alt={order.orderNumber} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
              <ShoppingCart className="h-12 w-12" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge variant="default" className="bg-primary text-primary-foreground border-none font-bold text-xs shadow">
              SOLD
            </Badge>
          </div>
        </div>
        <div className="p-3 flex flex-col gap-2 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{order.orderNumber}</div>
              <div className="text-xs text-muted-foreground">{order.brand?.name || '—'}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <div><span className="text-muted-foreground">Date: </span><span className="font-medium">{formatDate(order.orderDate)}</span></div>
            <div><span className="text-muted-foreground">Qty: </span><span className="font-bold">{totalQty}</span></div>
            {sizeName && <div className="col-span-2"><span className="text-muted-foreground">Size: </span><span className="font-bold">{formatSizeInches(sizeName)}</span></div>}
          </div>
          <div className="pt-2 mt-auto border-t border-border/30 flex gap-2">
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleView(order) }} className="flex-1 rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary gap-1.5 font-bold h-8 text-xs">
              <Eye className="h-3 w-3" />View
            </Button>
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(order) }} className="flex-1 rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary gap-1.5 font-bold h-8 text-xs">
              <Edit className="h-3 w-3" />Edit
            </Button>
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(order) }} className="h-8 w-8 rounded-xl p-0 text-destructive hover:text-destructive border-border/50 hover:bg-destructive/10">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    )
  }, [])

  const renderListRow = useCallback((order: SalesOrder) => {
    const firstItem = order.items?.[0]
    const photo = firstItem?.product?.imageUrl || firstItem?.batch?.imageUrl
    const sizeName = firstItem?.product?.size?.name
    const totalQty = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0
    return (
      <>
        {/* Photo - First column */}
        <td className="px-3 py-2">
          <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted/20 border border-border/40 flex-shrink-0">
            {photo ? (
              <img src={photo} alt={order.orderNumber} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground/40">
                <ShoppingCart className="h-6 w-6" />
              </div>
            )}
          </div>
        </td>
        <td className="px-4 py-3"><div className="font-bold">{order.orderNumber}</div></td>
        <td className="px-4 py-3"><div className="font-medium">{order.brand?.name || '—'}</div></td>
        <td className="px-4 py-3 font-bold tabular-nums">{totalQty}</td>
        <td className="px-4 py-3 font-bold text-sm">{formatSizeInches(sizeName)}</td>
        <td className="px-4 py-3 text-sm text-foreground">{formatDate(order.orderDate)}</td>
        <td className="px-4 py-3">
          <Badge variant="default" className="bg-primary text-primary-foreground border-none font-bold text-[10px] h-5">
            SOLD
          </Badge>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="rounded-xl hover:bg-primary/10 hover:text-primary gap-2 font-bold px-3 transition-all" onClick={() => handleView(order)}>
              <Eye className="h-4 w-4" />View
            </Button>
            <Button variant="ghost" size="sm" className="rounded-xl hover:bg-primary/10 hover:text-primary gap-2 font-bold px-3 transition-all" onClick={() => handleEdit(order)}>
              <Edit className="h-4 w-4" />Edit
            </Button>
            <Button variant="ghost" size="sm" className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 font-bold px-3 transition-all" onClick={() => handleDelete(order)}>
              <Trash2 className="h-4 w-4" />Delete
            </Button>
          </div>
        </td>
      </>
    )
  }, [])

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 space-y-8 pb-10">
      <TableFilters
        title="Sales Orders"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={orders}
              columns={commonColumns.salesOrder}
              filename="sales-orders-export"
              onExportComplete={(result) => {
                if (result.success) {
                  showToast(`Exported ${orders.length} orders successfully!`, 'success')
                } else {
                  showToast(result.error || 'Export failed', 'error')
                }
              }}
              disabled={orders.length === 0}
            />
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-xl font-bold gap-2 shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" />
                  New Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl glass-card border-border/50 rounded-3xl shadow-premium animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Create Sales Order</DialogTitle>
                </DialogHeader>
                <SalesOrderForm onSuccess={() => {
                  setShowAddDialog(false)
                  fetchOrders()
                }} />
              </DialogContent>
            </Dialog>
          </div>
        }
        filters={filterConfigs}
        values={tableFilters}
        onFiltersChange={updateFilters}
        searchValue={search}
        onSearchChange={updateSearch}
        loading={loading}
      />

      {/* Data View */}
      <AppDataView
        items={orders}
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
          headers: ['Photo', 'Order #', 'Brand', 'Qty', 'Size (in)', 'Date', 'Status', 'Actions'],
          renderRow: renderListRow
        }}
      />

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="glass backdrop-blur-xl border-border/50 max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl shadow-premium animate-in zoom-in-95 duration-200 p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Sales Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order Number</span>
                <div className="font-bold text-lg text-foreground bg-muted/30 p-3 rounded-2xl border border-border/30">
                  {selectedOrder.orderNumber}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</span>
                <div className="bg-primary/10 text-primary p-3 rounded-2xl border border-primary/20 font-bold text-center">
                  DELIVERED
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Brand</span>
                <div className="text-foreground font-medium">{selectedOrder.brand?.name}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order Date</span>
                <div className="text-foreground font-medium">{formatDate(selectedOrder.orderDate)}</div>
              </div>
              <div className="col-span-2 mt-4 space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Sale Price</span>
                <div className="text-3xl font-extrabold text-primary">₹{selectedOrder.totalAmount.toLocaleString()}</div>
              </div>
            </div>
          )}
          <div className="mt-8">
            <Button className="w-full rounded-2xl h-12 font-bold" onClick={() => setShowViewDialog(false)}>
              Close Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl glass backdrop-blur-xl border-border/50 rounded-3xl shadow-premium animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Edit Sales Order</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <SalesOrderForm
              order={selectedOrder}
              onSuccess={() => {
                setShowEditDialog(false)
                fetchOrders()
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!deleteOrder}
        onOpenChange={(open) => {
          if (!open) setDeleteOrder(null)
        }}
        title="Delete Sales Order"
        description={deleteOrder ? `Are you sure you want to delete sales order ${deleteOrder.orderNumber}? This action cannot be undone.` : ''}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        variant="destructive"
      />

      <RowDetailsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        title="Sales Order Details"
        data={selectedDetailItem}
        fields={[
          { label: 'Order Number', value: selectedDetailItem?.orderNumber },
          { label: 'Brand', value: selectedDetailItem?.brand?.name },
          { label: 'Total Amount', value: selectedDetailItem?.totalAmount ? `₹${selectedDetailItem.totalAmount.toLocaleString()}` : undefined },
          { label: 'Status', value: 'SOLD', variant: 'badge' as const },
          { label: 'Order Date', value: selectedDetailItem?.orderDate },
          { label: 'Total Quantity', value: selectedDetailItem?.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0), variant: 'number' as const },
          { label: 'First Item Batch', value: selectedDetailItem?.items?.[0]?.batch?.batchNumber },
          { label: 'Location', value: selectedDetailItem?.items?.[0]?.batch?.location?.name },
          { label: 'Category', value: selectedDetailItem?.items?.[0]?.product?.category?.name },
          { label: 'Size', value: selectedDetailItem?.items?.[0]?.product?.size?.name },
          { label: 'Created At', value: selectedDetailItem?.createdAt },
          { label: 'Created By', value: selectedDetailItem?.createdBy?.name },
          { label: 'Updated At', value: selectedDetailItem?.updatedAt !== selectedDetailItem?.createdAt ? selectedDetailItem?.updatedAt : undefined },
          { label: 'Updated By', value: selectedDetailItem?.updatedAt !== selectedDetailItem?.createdAt ? selectedDetailItem?.updatedBy?.name : undefined },
        ].filter(f => f.value !== undefined)}
      />
    </div>
  )
}
