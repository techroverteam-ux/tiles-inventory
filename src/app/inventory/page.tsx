'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { MobileCard, MobileCardHeader, MobileCardField, MobileStatsCard } from '@/components/ui/mobile-card'
import { useToast } from '@/contexts/ToastContext'
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
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react'

interface InventoryItem {
  id: string
  product: {
    name: string
    code: string
    brand: { name: string }
    category: { name: string }
    size?: { name: string }
    sqftPerBox: number
  }
  location: { name: string }
  batchNumber: string
  quantity: number
  purchasePrice: number
  sellingPrice: number
  expiryDate?: string
  createdAt: string
}

interface Filters {
  search: string
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
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null)
  const [editFormData, setEditFormData] = useState({
    batchNumber: '',
    quantity: '',
    purchasePrice: '',
    sellingPrice: ''
  })
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    locationId: '',
    brandId: '',
    categoryId: '',
    lowStock: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
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
  }, [pagination.page, pagination.limit, filters])

  useEffect(() => {
    fetchLocations()
    fetchBrands()
    fetchCategories()
  }, [])

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
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
      sellingPrice: item.sellingPrice.toString()
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
          sellingPrice: parseFloat(editFormData.sellingPrice)
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

  const getTotalValue = () => {
    return inventory.reduce((total, item) => total + (item.quantity * item.sellingPrice), 0)
  }

  const getLowStockCount = () => {
    return inventory.filter(item => item.quantity < 10).length
  }

  const getTotalQuantity = () => {
    return inventory.reduce((total, item) => total + item.quantity, 0)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your stock levels and batches</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 md:mr-2 text-muted-foreground" />
            <span className="hidden md:inline">Filters</span>
          </Button>
          <Button variant="outline" size="sm" className="hidden md:flex">
            <Download className="h-4 w-4 mr-2 text-muted-foreground" />
            Export
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Add Stock</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-card">
              <DialogHeader>
                <DialogTitle className="text-foreground">Add Stock Batch</DialogTitle>
              </DialogHeader>
              <div className="text-center py-8 text-muted-foreground">
                Stock batch form will be implemented here
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mobile Stats Cards */}
      <div className="grid grid-cols-2 md:hidden gap-3">
        <MobileStatsCard
          title="Batches"
          value={inventory.length}
          subtitle="Total batches"
          icon={<Package className="h-4 w-4 text-primary" />}
        />
        <MobileStatsCard
          title="Low Stock"
          value={getLowStockCount()}
          subtitle="Need attention"
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
        />
        <MobileStatsCard
          title="Total Value"
          value={`₹${(getTotalValue() / 1000).toFixed(0)}K`}
          subtitle="Inventory value"
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
        />
        <MobileStatsCard
          title="Units"
          value={getTotalQuantity()}
          subtitle="Total units"
          icon={<BarChart3 className="h-4 w-4 text-primary" />}
        />
      </div>

      {/* Desktop Stats Cards */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{inventory.length}</div>
                <p className="text-sm text-muted-foreground">Total Batches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">{getLowStockCount()}</div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">₹{getTotalValue().toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{getTotalQuantity()}</div>
                <p className="text-sm text-muted-foreground">Total Units</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search inventory..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base md:text-lg text-foreground">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2 md:block hidden">
                <label className="text-sm font-medium text-foreground">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search inventory..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Location</label>
                <Select value={filters.locationId} onValueChange={(value) => handleFilterChange('locationId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Brand</label>
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
                <label className="text-sm font-medium text-foreground">Category</label>
                <Select value={filters.categoryId} onValueChange={(value) => handleFilterChange('categoryId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Stock Level</label>
                <Select value={filters.lowStock} onValueChange={(value) => handleFilterChange('lowStock', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All stock levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All stock levels</SelectItem>
                    <SelectItem value="low">Low Stock (&lt; 10)</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date From</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date To</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Sort By</label>
                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Date Added</SelectItem>
                    <SelectItem value="quantity">Stock Quantity</SelectItem>
                    <SelectItem value="sellingPrice">Selling Price</SelectItem>
                    <SelectItem value="expiryDate">Expiry Date</SelectItem>
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

      {/* Mobile Inventory List */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Stock Batches ({pagination.total})</h2>
          <Select 
            value={pagination.limit.toString()} 
            onValueChange={(value) => setPagination(prev => ({ ...prev, limit: parseInt(value), page: 1 }))}
          >
            <SelectTrigger className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Package className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {inventory.map((item) => (
              <MobileCard key={item.id}>
                <MobileCardHeader
                  title={item.product.name}
                  subtitle={`${item.product.brand.name} • ${item.product.code}`}
                  badge={
                    <div className="flex items-center gap-2 flex-nowrap">
                      <Badge variant={getStockBadgeVariant(item.quantity)} className="text-xs whitespace-nowrap">
                        {item.quantity} units
                      </Badge>
                      {item.quantity < 10 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </div>
                  }
                  actions={
                    <>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  }
                />
                <MobileCardField label="Category" value={item.product.category.name} />
                <MobileCardField label="Size" value={item.product.size?.name || 'N/A'} />
                <MobileCardField label="Batch" value={<code className="bg-muted px-2 py-1 rounded text-xs">{item.batchNumber}</code>} />
                <MobileCardField label="Location" value={item.location.name} />
                <MobileCardField label="Purchase Price" value={`₹${item.purchasePrice.toLocaleString()}`} />
                <MobileCardField label="Selling Price" value={`₹${item.sellingPrice.toLocaleString()}`} />
                <MobileCardField label="Total Value" value={`₹${(item.quantity * item.sellingPrice).toLocaleString()}`} />
              </MobileCard>
            ))}
            
            {/* Mobile Pagination */}
            <div className="flex items-center justify-between pt-4">
              <div className="text-xs text-muted-foreground">
                {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">{pagination.page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Desktop Inventory Table */}
      <Card className="bg-card border-border hidden md:block">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">Stock Batches ({pagination.total})</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
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
              <Package className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border">
                    <TableHead className="text-foreground">Product</TableHead>
                    <TableHead className="text-foreground">Category</TableHead>
                    <TableHead className="text-foreground">Size</TableHead>
                    <TableHead className="text-foreground">Batch</TableHead>
                    <TableHead className="text-foreground">Location</TableHead>
                    <TableHead className="text-foreground">Stock</TableHead>
                    <TableHead className="text-foreground">Purchase Price</TableHead>
                    <TableHead className="text-foreground">Selling Price</TableHead>
                    <TableHead className="text-foreground">Value</TableHead>
                    <TableHead className="text-right text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id} className="border-b border-border hover:bg-accent/50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">{item.product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.product.brand.name} • {item.product.code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{item.product.category.name}</TableCell>
                      <TableCell className="text-foreground">{item.product.size?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm text-foreground">
                          {item.batchNumber}
                        </code>
                      </TableCell>
                      <TableCell className="text-foreground">{item.location.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-nowrap">
                          <Badge variant={getStockBadgeVariant(item.quantity)} className="whitespace-nowrap">
                            {item.quantity} units
                          </Badge>
                          {item.quantity < 10 && (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">₹{item.purchasePrice.toLocaleString()}</TableCell>
                      <TableCell className="text-foreground">₹{item.sellingPrice.toLocaleString()}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        ₹{(item.quantity * item.sellingPrice).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Desktop Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
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
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Inventory Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Batch Number</label>
              <Input
                value={editFormData.batchNumber}
                onChange={(e) => setEditFormData({ ...editFormData, batchNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Quantity</label>
              <Input
                type="number"
                value={editFormData.quantity}
                onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Purchase Price</label>
              <Input
                type="number"
                value={editFormData.purchasePrice}
                onChange={(e) => setEditFormData({ ...editFormData, purchasePrice: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Selling Price</label>
              <Input
                type="number"
                value={editFormData.sellingPrice}
                onChange={(e) => setEditFormData({ ...editFormData, sellingPrice: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!deleteItem}
        onOpenChange={(open) => {
          if (!open) setDeleteItem(null)
        }}
        title="Delete Batch"
        description={deleteItem ? `Are you sure you want to delete batch ${deleteItem.batchNumber}? This will also remove related purchase and sales records.` : ''}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  )
}
