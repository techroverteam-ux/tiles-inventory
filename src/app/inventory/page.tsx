'use client'

import { useState, useEffect } from 'react'
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
  const [showFilters, setShowFilters] = useState(false)
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
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  
  const [filters, setFilters] = useState<Filters>({
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

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setShowAddDialog(true)
    }
  }, [searchParams])

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
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
    <div className="w-full px-3 sm:px-4 md:px-6 space-y-8 pb-10">
      {/* Header */}
      <div className="page-header">
        <div className="space-y-1">
          <h1 className="page-title">Inventory</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <Package className="h-4 w-4 text-primary/60" />
            Track your stock levels and batches across all locations
          </p>
        </div>
        <div className="flex flex-wrap gap-2 pt-2 md:pt-0">
          <motion.div whileTap={{ scale: 0.93 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "rounded-xl border-border/50 font-bold gap-2 transition-all",
                showFilters ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50"
              )}
            >
              <motion.span
                animate={{ rotate: showFilters ? 90 : 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="flex items-center"
              >
                <Filter className="h-4 w-4" />
              </motion.span>
              Filters
            </Button>
          </motion.div>
          <Button variant="outline" size="sm" className="hidden md:flex rounded-xl border-border/50 font-bold gap-2 hover:bg-muted/50">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl font-bold gap-2 shadow-lg shadow-primary/20">
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
      </div>

      {/* Mobile Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-3">
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
      <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-premium transition-all duration-300 border-border/50 rounded-3xl overflow-hidden glass-card group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-foreground tracking-tight">{inventory.length}</div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider opacity-70">Total Batches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-premium transition-all duration-300 border-border/50 rounded-3xl overflow-hidden glass-card group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive/10 text-destructive rounded-2xl group-hover:bg-destructive group-hover:text-white transition-all duration-300">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-destructive tracking-tight">{getLowStockCount()}</div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider opacity-70">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-premium transition-all duration-300 border-border/50 rounded-3xl overflow-hidden glass-card group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-foreground tracking-tight">₹{getTotalValue().toLocaleString()}</div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider opacity-70">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-premium transition-all duration-300 border-border/50 rounded-3xl overflow-hidden glass-card group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-foreground tracking-tight">{getTotalQuantity()}</div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider opacity-70">Total Units</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Filters */}
      {showFilters && (
        <Card className="border-border/50 rounded-3xl overflow-hidden glass-card shadow-premium animate-in slide-in-from-top-4 duration-300">
          <CardHeader className="pb-4 border-b border-border/30 bg-muted/20">
            <CardTitle className="text-xl font-bold text-foreground">Filter Inventory</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 ml-1">Location</label>
                <Select value={filters.locationId} onValueChange={(value) => handleFilterChange('locationId', value)}>
                  <SelectTrigger className="rounded-2xl bg-muted/20 border-border/40 transition-all h-12">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="none">All locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 ml-1">Brand</label>
                <Select value={filters.brandId} onValueChange={(value) => handleFilterChange('brandId', value)}>
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
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 ml-1">Category</label>
                <Select value={filters.categoryId} onValueChange={(value) => handleFilterChange('categoryId', value)}>
                  <SelectTrigger className="rounded-2xl bg-muted/20 border-border/40 transition-all h-12">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="none">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 ml-1">Stock Level</label>
                <Select value={filters.lowStock} onValueChange={(value) => handleFilterChange('lowStock', value)}>
                  <SelectTrigger className="rounded-2xl bg-muted/20 border-border/40 transition-all h-12">
                    <SelectValue placeholder="All stock levels" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="none">All stock levels</SelectItem>
                    <SelectItem value="low">Low Stock (&lt; 10)</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
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
          <LoadingPage view="grid" showHeader={false} items={4} columns={2} />
        ) : (
          <>
            {inventory.map((item) => (
              <MobileCard 
                key={item.id}
                className="cursor-pointer"
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
                      <Badge variant={getStockBadgeVariant(item.quantity)} className="text-xs whitespace-nowrap">
                        {item.quantity} units
                      </Badge>
                      {item.quantity < 10 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </div>
                  }
                  actions={
                    <div onClick={(e) => e.stopPropagation()} className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  }
                />
                <MobileCardField label="Quantity" value={
                  <div className="flex items-center gap-2 font-bold">
                    <Badge variant={getStockBadgeVariant(item.quantity)}>{item.quantity} units</Badge>
                    {item.quantity < 10 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  </div>
                } />
                <MobileCardField label="Size" value={item.product.size?.name || 'N/A'} />
                <MobileCardField label="Category" value={item.product.category.name} />
                <MobileCardField label="Batch" value={<code className="bg-muted px-2 py-1 rounded text-xs font-mono">{item.batchNumber}</code>} />
                <MobileCardField label="Location" value={item.location.name} />
                <MobileCardField label="Purchase" value={`₹${item.purchasePrice.toLocaleString()}`} />
                <MobileCardField label="Selling" value={`₹${item.sellingPrice.toLocaleString()}`} />
                <MobileCardField label="Total Value" value={`₹${(item.quantity * item.sellingPrice).toLocaleString()}`} className="font-bold text-primary" />
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
      <Card className="border-border/50 rounded-3xl overflow-hidden glass-card shadow-premium hidden md:block">
        <CardHeader className="pb-4 border-b border-border/30 bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-foreground">Stock Batches ({pagination.total})</CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-muted-foreground">Entries</span>
              <Select 
                value={pagination.limit.toString()} 
                onValueChange={(value) => setPagination(prev => ({ ...prev, limit: parseInt(value), page: 1 }))}
              >
                <SelectTrigger className="w-20 rounded-xl bg-background/50 border-border/40 h-10 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          {loading ? (
            <LoadingPage view="list" showHeader={false} items={8} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="w-48 pl-6">Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Batch #</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Purchase</TableHead>
                    <TableHead className="text-right">Selling</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow 
                      key={item.id} 
                      className="border-b border-border hover:bg-accent/50 cursor-pointer"
                      onClick={() => {
                        setSelectedDetailItem(item)
                        setShowDetails(true)
                      }}
                    >
                      <TableCell className="pl-6">
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
                            <div className="font-semibold text-foreground">{item.product.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {item.product.brand.name} • {item.product.code}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                          <Badge variant={getStockBadgeVariant(item.quantity)} className="whitespace-nowrap tabular-nums">
                            {item.quantity} units
                          </Badge>
                          {item.quantity < 10 && (
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.product.size?.name || '—'}</TableCell>
                      <TableCell>{item.product.category.name}</TableCell>
                      <TableCell>
                        <code className="bg-muted/60 px-2 py-0.5 rounded-md text-xs font-mono">
                          {item.batchNumber}
                        </code>
                      </TableCell>
                      <TableCell>{item.location.name}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">₹{item.purchasePrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">₹{item.sellingPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold font-mono tabular-nums">
                        ₹{(item.quantity * item.sellingPrice).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        <div className="text-sm">{formatDate(item.createdAt)}</div>
                        <div className="text-xs opacity-70">{item.createdBy?.name || 'System'}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {item.updatedAt && item.updatedAt !== item.createdAt
                          ? (
                            <>
                              <div className="text-sm">{formatDate(item.updatedAt)}</div>
                              <div className="text-xs opacity-70">{item.updatedBy?.name || 'System'}</div>
                            </>
                          )
                          : <span className="text-xs opacity-30">—</span>
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => handleDelete(item)}>
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
