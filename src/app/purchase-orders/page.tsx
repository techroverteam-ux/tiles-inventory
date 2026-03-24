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
import PurchaseOrderForm from '@/components/PurchaseOrderForm'
import { useToast } from '@/contexts/ToastContext'
import { RowDetailsDialog } from '@/components/ui/row-details-dialog'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { cn } from '@/lib/utils'
import { Truck, Eye, Edit, Trash2, Plus, Filter } from 'lucide-react'
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

interface PurchaseOrder {
  id: string
  orderNumber: string
  brand: { name: string }
  orderDate: string
  expectedDate?: string
  receivedDate?: string
  status: string
  totalAmount: number
  notes?: string
  items: any[]
  createdAt: string
  updatedAt?: string
  createdBy?: { name: string }
  updatedBy?: { name: string }
}

export default function PurchaseOrdersPage() {
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { view, setView } = useResponsiveDefaultView()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showLocationDialog, setShowLocationDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [deleteOrder, setDeleteOrder] = useState<PurchaseOrder | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedDetailItem, setSelectedDetailItem] = useState<PurchaseOrder | null>(null)
  const [selectedLocation, setSelectedLocation] = useState('')
  const [changingStatus, setChangingStatus] = useState<string | null>(null)
  
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
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'CONFIRMED', label: 'Confirmed' },
        { value: 'DELIVERED', label: 'Delivered' },
        { value: 'CANCELLED', label: 'Cancelled' }
      ],
      placeholder: 'All Status'
    }
  ], [brands])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/purchase-orders')
      const data = await response.json()
      
      if (response.ok) {
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
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

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      const data = await response.json()
      if (response.ok) setLocations(data.locations || [])
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchBrands()
    fetchLocations()
  }, [])

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setShowAddDialog(true)
    }
  }, [searchParams])

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (newStatus === 'DELIVERED') {
      // Show location dialog
      setSelectedOrder(orders.find(o => o.id === orderId) || null)
      setShowLocationDialog(true)
    } else {
      // Direct status update
      try {
        const response = await fetch(`/api/purchase-orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        })

        if (response.ok) {
          showToast('Status updated successfully', 'success')
          fetchOrders()
        } else {
          showToast('Failed to update status', 'error')
        }
      } catch (error) {
        console.error('Error updating status:', error)
        showToast('Error updating status', 'error')
      }
    }
  }

  const handleDelivery = async () => {
    if (!selectedLocation || !selectedOrder) {
      showToast('Please select a location', 'error')
      return
    }

    setChangingStatus(selectedOrder.id)
    try {
      const response = await fetch(`/api/purchase-orders/${selectedOrder.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId: selectedLocation })
      })

      if (response.ok) {
        showToast('Order delivered and inventory updated successfully', 'success')
        setShowLocationDialog(false)
        setSelectedLocation('')
        setSelectedOrder(null)
        fetchOrders()
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to process delivery', 'error')
      }
    } catch (error) {
      console.error('Error processing delivery:', error)
      showToast('Error processing delivery', 'error')
    } finally {
      setChangingStatus(null)
    }
  }

  const handleDelete = (order: PurchaseOrder) => {
    setDeleteOrder(order)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteOrder) return

    try {
      const response = await fetch(`/api/purchase-orders/${deleteOrder.id}`, { method: 'DELETE' })
      if (response.ok) {
        showToast('Purchase order deleted successfully', 'success')
        setDeleteOrder(null)
        fetchOrders()
      }
    } catch (error) {
      console.error('Error deleting purchase order:', error)
      showToast('Error deleting purchase order', 'error')
    }
  }

  const handleView = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setShowViewDialog(true)
  }

  const handleEdit = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setShowEditDialog(true)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PENDING': return 'secondary'
      case 'CONFIRMED': return 'default'
      case 'DELIVERED': return 'default'
      case 'CANCELLED': return 'destructive'
      default: return 'secondary'
    }
  }

  const renderGridItem = useCallback((order: PurchaseOrder) => (
    <Card className="h-full hover:shadow-premium transition-all duration-300 border-border/50 group overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/30 bg-muted/20">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Order #</div>
            <CardTitle className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors">
              {order.orderNumber}
            </CardTitle>
          </div>
          <Badge 
            variant={getStatusBadgeVariant(order.status)} 
            className={cn("font-bold border-none", order.status === 'DELIVERED' ? "bg-primary text-primary-foreground" : "bg-warning text-warning-foreground")}
          >
            {order.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Brand</span>
            <div className="font-bold text-foreground truncate">{order.brand?.name || '—'}</div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Amount</span>
            <div className="font-bold text-foreground tabular-nums">₹{order.totalAmount.toLocaleString()}</div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Date</span>
            <div className="font-medium text-foreground">{formatDate(order.orderDate)}</div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Items</span>
            <div className="font-medium text-foreground">{order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}</div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/30 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleView(order); }}
            className="flex-1 rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary gap-1.5 font-bold h-9"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEdit(order); }}
            className="flex-1 rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary gap-1.5 font-bold h-9"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleDelete(order); }}
            className="h-9 w-9 rounded-xl p-0 text-destructive hover:text-destructive border-border/50 hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [])

  const renderListRow = useCallback((order: PurchaseOrder) => (
    <>
      <td className="px-4 py-3"><div className="font-bold">{order.orderNumber}</div></td>
      <td className="px-4 py-3"><div className="font-medium">{order.brand?.name || '—'}</div></td>
      <td className="px-4 py-3 tabular-nums text-right">
        {order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
      </td>
      <td className="px-4 py-3 font-bold text-foreground tabular-nums text-right">
        ₹{order.totalAmount.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-sm text-foreground">{formatDate(order.orderDate)}</td>
      <td className="px-4 py-3">
        <div onClick={(e) => e.stopPropagation()}>
          <Select 
            value={order.status} 
            onValueChange={(value) => handleStatusChange(order.id, value)}
            disabled={changingStatus === order.id}
          >
            <SelectTrigger className="w-32 h-8 rounded-lg text-xs font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => handleView(order)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => handleEdit(order)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(order)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </>
  ), [changingStatus, handleStatusChange])

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 space-y-8 pb-10">
      <TableFilters
        title="Purchase Orders"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={orders}
              columns={commonColumns.purchaseOrder}
              filename="purchase-orders-export"
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
                  <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Create Purchase Order</DialogTitle>
                </DialogHeader>
                <PurchaseOrderForm onSuccess={() => {
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
          headers: ['Order #', 'Brand', 'Qty', 'Amount', 'Date', 'Status', 'Actions'],
          renderRow: renderListRow
        }}
      />

      {/* Location Selection Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="glass backdrop-blur-xl border-border/50 max-w-md max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl shadow-premium animate-in zoom-in-95 duration-200">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Confirm Delivery</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <p className="text-sm text-foreground/80 font-medium leading-relaxed">
                Please select the storage location where this order's stock will be received. This will update the inventory counts.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 ml-1">Storage Location</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="rounded-2xl bg-muted/20 border-border/40 transition-all h-12">
                  <SelectValue placeholder="Choose a location" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <Button 
                onClick={handleDelivery} 
                disabled={!selectedLocation || changingStatus !== null}
                className="rounded-2xl h-12 font-bold shadow-lg shadow-primary/20"
              >
                {changingStatus ? 'Processing Delivery...' : 'Confirm & Update Stock'}
              </Button>
              <Button 
                variant="outline" 
                className="rounded-2xl h-12 border-border/50 font-bold"
                onClick={() => {
                  setShowLocationDialog(false)
                  setSelectedLocation('')
                  setSelectedOrder(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="glass backdrop-blur-xl border-border/50 max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl shadow-premium animate-in zoom-in-95 duration-200 p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Purchase Order Details</DialogTitle>
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
                <div className={cn(
                  "p-3 rounded-2xl border font-bold text-center",
                  selectedOrder.status === 'DELIVERED' ? "bg-primary/10 text-primary border-primary/20" : "bg-warning/10 text-warning border-warning/20"
                )}>
                  {selectedOrder.status}
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
              <div className="col-span-2 mt-4 space-y-1 text-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Purchase Amount</span>
                <div className="text-4xl font-extrabold text-foreground">₹{selectedOrder.totalAmount.toLocaleString()}</div>
              </div>
              {selectedOrder.notes && (
                <div className="col-span-2 mt-2 space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes</span>
                  <div className="text-sm text-foreground bg-muted/20 p-4 rounded-2xl border border-border/30 italic">
                    {selectedOrder.notes}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="mt-8">
            <Button className="w-full rounded-2xl h-12 font-bold" onClick={() => setShowViewDialog(false)}>
              Close Order View
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl glass backdrop-blur-xl border-border/50 rounded-3xl shadow-premium animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 tracking-tight">Edit Purchase Order</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <PurchaseOrderForm 
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
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteOrder(null)
        }}
        title="Delete Purchase Order"
        description={deleteOrder ? `Are you sure you want to delete purchase order ${deleteOrder.orderNumber}? This action cannot be undone.` : ''}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        variant="destructive"
      />

      <RowDetailsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        title="Purchase Order Details"
        data={selectedDetailItem}
        fields={[
          { label: 'Order Number', value: selectedDetailItem?.orderNumber },
          { label: 'Brand', value: selectedDetailItem?.brand?.name },
          { label: 'Total Amount', value: selectedDetailItem?.totalAmount ? `₹${selectedDetailItem.totalAmount.toLocaleString()}` : undefined },
          { label: 'Status', value: selectedDetailItem?.status, variant: 'badge' as const },
          { label: 'Order Date', value: selectedDetailItem?.orderDate },
          { label: 'Total Quantity', value: selectedDetailItem?.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0), variant: 'number' as const },
          { label: 'First Item Batch', value: selectedDetailItem?.items?.[0]?.batchNumber },
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

