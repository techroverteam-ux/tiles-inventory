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
            <DialogContent className="max-w-4xl glass backdrop-blur-3xl border-border/50 rounded-3xl shadow-premium animate-in zoom-in-95 duration-200">
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
                <Select value={filters.brandId} onValueChange={(value) => setFilters({ ...filters, brandId: value })}>
                  <SelectTrigger className="rounded-2xl bg-muted/20 border-border/40 transition-all h-12">
                    <SelectValue placeholder="All brands" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="none">All brands</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        <CardContent className="p-0">
          {loading ? (
            <LoadingPage view="list" showHeader={false} items={8} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border">
                    <TableHead className="text-foreground">Order #</TableHead>
                    <TableHead className="text-foreground">Brand</TableHead>
                    <TableHead className="text-foreground">Batch Name</TableHead>
                    <TableHead className="text-foreground">Quantity</TableHead>
                    <TableHead className="text-foreground">Category</TableHead>
                    <TableHead className="text-foreground">Dimensions</TableHead>
                    <TableHead className="text-foreground">Location</TableHead>
                    <TableHead className="text-foreground">Sold Date</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-foreground">Sale Price</TableHead>
                    <TableHead className="text-foreground">Created</TableHead>
                    <TableHead className="text-foreground">Updated</TableHead>
                    <TableHead className="text-right text-foreground">Actions</TableHead>
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
                      <TableCell>
                        <div className="font-medium text-foreground">{order.orderNumber}</div>
                      </TableCell>
                      <TableCell className="text-foreground">{order.brand?.name || 'N/A'}</TableCell>
                      <TableCell className="text-foreground">
                        {order.items?.[0]?.batch?.batchNumber || 'N/A'}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {order.items?.[0]?.product?.category?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {order.items?.[0]?.product?.size?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {order.items?.[0]?.batch?.location?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground">
                          {formatDate(order.orderDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-primary text-primary-foreground">
                          SOLD
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          ₹{order.totalAmount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        <div>{formatDate(order.createdAt)}</div>
                        <div className="text-xs">{order.createdBy?.name || 'System'}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {order.updatedAt && order.updatedAt !== order.createdAt
                          ? (
                            <>
                              <div>{formatDate(order.updatedAt)}</div>
                              <div className="text-xs">{order.updatedBy?.name || 'System'}</div>
                            </>
                          )
                          : <span className="text-xs opacity-30 text-muted-foreground">No updates</span>
                        }
                      </TableCell>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleView(order)}
                            className="rounded-xl hover:bg-primary/10 hover:text-primary p-2 transition-all"
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(order)}
                            className="rounded-xl hover:bg-primary/10 hover:text-primary p-2 transition-all"
                          >
                            <Edit className="h-5 w-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(order)}
                            className="rounded-xl hover:bg-destructive/10 hover:text-destructive p-2 transition-all"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="glass backdrop-blur-3xl border-border/50 max-w-lg rounded-3xl shadow-premium animate-in zoom-in-95 duration-200 p-8">
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
        <DialogContent className="max-w-4xl glass backdrop-blur-3xl border-border/50 rounded-3xl shadow-premium animate-in zoom-in-95 duration-200">
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
      />
    </div>
  )
}
