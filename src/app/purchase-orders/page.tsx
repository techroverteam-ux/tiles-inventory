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
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Calendar,
  Package
} from 'lucide-react'

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
}

interface Filters {
  search: string
  brandId: string
  status: string
  dateFrom: string
  dateTo: string
  sortBy: string
  sortOrder: string
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    brandId: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      })
      
      const response = await fetch(`/api/purchase-orders?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setOrders(data.orders || [])
        setPagination(data.pagination || pagination)
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

  useEffect(() => {
    fetchOrders()
  }, [pagination.page, pagination.limit, filters])

  useEffect(() => {
    fetchBrands()
  }, [])

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      brandId: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PENDING': return 'secondary'
      case 'CONFIRMED': return 'default'
      case 'RECEIVED': return 'default'
      case 'CANCELLED': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Purchase Orders</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your purchase orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-300" />
            Filters
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-300" />
            Export
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-white dark:bg-gray-800">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-gray-100">Create Purchase Order</DialogTitle>
              </DialogHeader>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Purchase order form will be implemented here
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">12</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">5</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">7</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Received</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹2,45,000</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                  <Input
                    placeholder="Search orders..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Brand</label>
                <Select value={filters.brandId} onValueChange={(value) => handleFilterChange('brandId', value)}>
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
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="RECEIVED">Received</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date From</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date To</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort By</label>
                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Date Created</SelectItem>
                    <SelectItem value="orderDate">Order Date</SelectItem>
                    <SelectItem value="totalAmount">Amount</SelectItem>
                    <SelectItem value="orderNumber">Order Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Order</label>
                <Select value={filters.sortOrder} onValueChange={(value) => handleFilterChange('sortOrder', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
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
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 dark:text-gray-100">Purchase Orders ({pagination.total})</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Show</span>
              <Select 
                value={pagination.limit.toString()} 
                onValueChange={(value) => setPagination(prev => ({ ...prev, limit: parseInt(value), page: 1 }))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <ShoppingCart className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-gray-700">
                    <TableHead className="text-gray-900 dark:text-gray-100">Order #</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100">Brand</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100">Order Date</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100">Expected Date</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100">Status</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100">Amount</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100">Items</TableHead>
                    <TableHead className="text-right text-gray-900 dark:text-gray-100">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{order.orderNumber}</div>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">{order.brand?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : 'Not set'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          ₹{order.totalAmount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {order.items?.length || 0} items
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const page = i + 1
                      return (
                        <Button
                          key={page}
                          variant={pagination.page === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPagination(prev => ({ ...prev, page }))}
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
                  >
                    Next
                    <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}