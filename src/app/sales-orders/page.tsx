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

export default function SalesOrdersPage() {
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
  const [deleteOrder, setDeleteOrder] = useState<SalesOrder | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedDetailItem, setSelectedDetailItem] = useState<SalesOrder | null>(null)
  
  const [filters, setFilters] = useState({
    brandId: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

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

  const clearFilters = () => {
    setFilters({
      brandId: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  }

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 space-y-8 pb-10">
      {/* Header */}
      <div className="page-header">
        <div className="space-y-1">
          <h1 className="page-title">Sales Orders</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary/60" />
            Manage and track your sales transactions and orders
          </p>
        </div>
        <div className="flex flex-wrap gap-2 pt-2 sm:pt-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "rounded-xl border-border/50 font-bold gap-2 transition-all",
              showFilters ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50"
            )}
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl font-bold gap-2 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl glass backdrop-blur-xl border-border/50 rounded-3xl shadow-premium animate-in zoom-in-95 duration-200">
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-premium transition-all duration-300 border-border/50 rounded-3xl overflow-hidden glass-card group">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <div className="text-3xl font-extrabold text-foreground tracking-tight">{orders.length}</div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider opacity-70">Total Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-premium transition-all duration-300 border-border/50 rounded-3xl overflow-hidden glass-card group text-primary">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <div className="text-3xl font-extrabold text-primary tracking-tight">
                {orders.filter(o => o.status === 'DELIVERED').length}
              </div>
              <p className="text-sm font-bold opacity-70 uppercase tracking-wider">Sold Units</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-premium transition-all duration-300 border-border/50 rounded-3xl overflow-hidden glass-card group">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <div className="text-3xl font-extrabold text-foreground tracking-tight">
                ₹{orders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}
              </div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider opacity-70">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-premium transition-all duration-300 border-border/50 rounded-3xl overflow-hidden glass-card group">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <div className="text-3xl font-extrabold text-foreground tracking-tight">
                {orders.reduce((sum, o) => sum + o.items?.reduce((s, i) => s + (i.quantity || 0), 0), 0)}
              </div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider opacity-70">Total Items</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="border-border/50 rounded-3xl overflow-hidden glass-card shadow-premium animate-in slide-in-from-top-4 duration-300">
          <CardHeader className="pb-4 border-b border-border/30 bg-muted/20">
            <CardTitle className="text-xl font-bold text-foreground">Filter Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 ml-1">Brand</label>
                <SearchableSelect
                  value={filters.brandId}
                  onValueChange={(value) => setFilters({ ...filters, brandId: value })}
                  options={[
                    { value: 'none', label: 'All brands' },
                    ...brands.map(b => ({ value: b.id, label: b.name }))
                  ]}
                  placeholder="All brands"
                  className="h-12"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-8">
              <Button 
                variant="ghost" 
                onClick={clearFilters}
                className="rounded-xl font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 px-6 h-12"
              >
                Clear All Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card className="border-border/50 rounded-3xl overflow-hidden glass-card shadow-premium">
        <CardHeader className="pb-4 border-b border-border/30 bg-muted/20">
          <CardTitle className="text-xl font-bold text-foreground">Sales History ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          {loading ? (
            <LoadingPage view="list" showHeader={false} items={8} />
          ) : (
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Order #</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Dimensions</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Sold Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Sale Price</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow 
                      key={order.id} 
                      className="border-b border-border hover:bg-accent/50 cursor-pointer"
                      onClick={() => {
                        setSelectedDetailItem(order)
                        setShowDetails(true)
                      }}
                    >
                      <TableCell><div className="font-semibold">{order.orderNumber}</div></TableCell>
                      <TableCell>{order.brand?.name || '—'}</TableCell>
                      <TableCell>
                        <code className="bg-muted/60 px-2 py-0.5 rounded-md text-xs font-mono">
                          {order.items?.[0]?.batch?.batchNumber || '—'}
                        </code>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                      </TableCell>
                      <TableCell>{order.items?.[0]?.product?.category?.name || '—'}</TableCell>
                      <TableCell>{order.items?.[0]?.product?.size?.name || '—'}</TableCell>
                      <TableCell>{order.items?.[0]?.batch?.location?.name || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{formatDate(order.orderDate)}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
                          SOLD
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold font-mono tabular-nums">
                        ₹{order.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        <div className="text-sm">{formatDate(order.createdAt)}</div>
                        <div className="text-xs opacity-70">{order.createdBy?.name || 'System'}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {order.updatedAt && order.updatedAt !== order.createdAt
                          ? (
                            <>
                              <div className="text-sm">{formatDate(order.updatedAt)}</div>
                              <div className="text-xs opacity-70">{order.updatedBy?.name || 'System'}</div>
                            </>
                          )
                          : <span className="text-xs opacity-30">—</span>
                        }
                      </TableCell>
                      <TableCell className="text-right">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="glass backdrop-blur-xl border-border/50 max-w-lg rounded-3xl shadow-premium animate-in zoom-in-95 duration-200 p-8">
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
        <DialogContent className="max-w-4xl glass backdrop-blur-xl border-border/50 rounded-3xl shadow-premium animate-in zoom-in-95 duration-200">
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
