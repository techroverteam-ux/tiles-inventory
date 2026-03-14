'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Eye,
  ShoppingCart
} from 'lucide-react'
import SalesOrderForm from '@/components/SalesOrderForm'
import { useToast } from '@/contexts/ToastContext'

interface SalesOrder {
  id: string
  orderNumber: string
  brand: { name: string }
  orderDate: string
  status: string
  totalAmount: number
  items: any[]
  createdAt: string
}

export default function SalesOrdersPage() {
  const { showToast } = useToast()
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
  
  const [filters, setFilters] = useState({
    search: '',
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

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this sales order?')) {
      try {
        const response = await fetch(`/api/sales-orders/${id}`, { method: 'DELETE' })
        if (response.ok) {
          showToast('Sales order deleted successfully', 'success')
          fetchOrders()
        }
      } catch (error) {
        console.error('Error deleting sales order:', error)
        showToast('Error deleting sales order', 'error')
      }
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
      search: '',
      brandId: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Orders</h1>
          <p className="text-muted-foreground mt-1">Manage your sales orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            Filters
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-card">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create Sales Order</DialogTitle>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{orders.length}</div>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {orders.filter(o => o.status === 'DELIVERED').length}
            </div>
            <p className="text-sm text-muted-foreground">Sold</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">
              ₹{orders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Total Value</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">
              {orders.reduce((sum, o) => sum + o.items?.reduce((s, i) => s + (i.quantity || 0), 0), 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total Units</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search orders..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Brand</label>
                <Select value={filters.brandId} onValueChange={(value) => setFilters({ ...filters, brandId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All brands</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Sales Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <ShoppingCart className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
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
                    <TableHead className="text-right text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="border-b border-border hover:bg-gray-50 dark:hover:bg-gray-700/50">
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
                          {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-600">
                          SOLD
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          ₹{order.totalAmount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(order)}>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(order)}>
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(order.id)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
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
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">View Sales Order</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="text-foreground"><strong>Order Number:</strong> {selectedOrder.orderNumber}</div>
              <div className="text-foreground"><strong>Brand:</strong> {selectedOrder.brand?.name}</div>
              <div className="text-foreground"><strong>Order Date:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString()}</div>
              <div className="text-foreground"><strong>Status:</strong> SOLD</div>
              <div className="text-foreground"><strong>Sale Price:</strong> ₹{selectedOrder.totalAmount.toLocaleString()}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Sales Order</DialogTitle>
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
    </div>
  )
}
