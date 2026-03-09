'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MobileCard, MobileCardHeader, MobileCardField, MobileCardActions } from '@/components/ui/mobile-card'
import ProductForm from '@/components/ProductForm'
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
  Calendar,
  MoreVertical
} from 'lucide-react'

interface Product {
  id: string
  name: string
  code: string
  description?: string
  brand: { name: string }
  category: { name: string }
  finishType: { name: string }
  length: number
  width: number
  thickness?: number
  sqftPerBox: number
  pcsPerBox: number
  totalStock: number
  isActive: boolean
  createdAt: string
  batches?: { location?: { name: string } }[]
}

interface Filters {
  search: string
  brandId: string
  categoryId: string
  isActive: string
  sortBy: string
  sortOrder: string
  dateFrom: string
  dateTo: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    brandId: '',
    categoryId: '',
    isActive: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    dateFrom: '',
    dateTo: ''
  })

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      
      if (response.ok) {
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands')
      const data = await response.json()
      if (response.ok) setBrands(data)
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (response.ok) setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
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
      brandId: '',
      categoryId: '',
      isActive: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      dateFrom: '',
      dateTo: ''
    })
  }

  const handleView = (product: Product) => {
    setSelectedProduct(product)
    setShowViewDialog(true)
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setShowEditDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`/api/products/${id}`, { method: 'DELETE' })
        if (response.ok) {
          fetchProducts()
        }
      } catch (error) {
        console.error('Error deleting product:', error)
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Products</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your tile inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Filters</span>
          </Button>
          <Button variant="outline" size="sm" className="hidden md:flex">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Add Product</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <ProductForm onSuccess={() => {
                setShowAddDialog(false)
                fetchProducts()
              }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-base md:text-lg text-gray-900 dark:text-gray-100">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2 md:block hidden">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search products..."
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
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
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
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <Select value={filters.isActive} onValueChange={(value) => handleFilterChange('isActive', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
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
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                    <SelectItem value="totalStock">Stock</SelectItem>
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

      {/* Mobile Products List */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Products ({products.length})</h2>
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
            <Package className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500" />
          </div>
        ) : (
          <>
            {products.map((product) => (
              <MobileCard key={product.id}>
                <MobileCardHeader
                  title={product.name}
                  subtitle={`${product.brand.name} • ${product.code}`}
                  badge={<Badge variant={product.pcsPerBox > 0 ? 'default' : 'destructive'} className="text-xs">{product.pcsPerBox} units</Badge>}
                  actions={
                    <>
                      <Button variant="ghost" size="sm" onClick={() => handleView(product)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </>
                  }
                />
                <MobileCardField label="Category" value={product.category.name} />
                <MobileCardField label="Finish" value={product.finishType.name} />
                <MobileCardField label="Pieces/Box" value={`${product.pcsPerBox} pcs`} />
                <MobileCardField label="Location" value={product.batches?.[0]?.location?.name || 'No location'} />
                <MobileCardField label="Created" value={new Date(product.createdAt).toLocaleDateString()} />
              </MobileCard>
            ))}
            
            {/* Mobile Pagination */}
            <div className="flex items-center justify-between pt-4">
              <div className="text-xs text-gray-500 dark:text-gray-400">
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
                <span className="text-sm text-gray-600 dark:text-gray-400">{pagination.page}</span>
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

      {/* Desktop Products Table */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hidden md:block">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 dark:text-gray-100">Products ({products.length})</CardTitle>
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
              <Package className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-gray-700">
                    <TableHead className="text-gray-900 dark:text-gray-100">Product</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100">Brand</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100">Category</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100">Dimensions</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100">Stock</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100">Location</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100">Created</TableHead>
                    <TableHead className="text-right text-gray-900 dark:text-gray-100">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{product.code}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">{product.brand.name}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">{product.category.name}</TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {product.finishType.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {product.pcsPerBox} pcs
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.pcsPerBox > 0 ? 'default' : 'destructive'}>
                          {product.pcsPerBox} units
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {product.batches?.[0]?.location?.name || 'No location'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(product)}>
                            <Eye className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                            <Edit className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Desktop Pagination */}
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
                    <ChevronLeft className="h-4 w-4" />
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
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Product</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="text-gray-900 dark:text-gray-100"><strong>Name:</strong> {selectedProduct.name}</div>
              <div className="text-gray-900 dark:text-gray-100"><strong>Code:</strong> {selectedProduct.code}</div>
              <div className="text-gray-900 dark:text-gray-100"><strong>Brand:</strong> {selectedProduct.brand.name}</div>
              <div className="text-gray-900 dark:text-gray-100"><strong>Category:</strong> {selectedProduct.category.name}</div>
              <div className="text-gray-900 dark:text-gray-100"><strong>Size:</strong> {selectedProduct.finishType.name}</div>
              <div className="text-gray-900 dark:text-gray-100"><strong>Stock:</strong> {selectedProduct.pcsPerBox} units</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductForm 
              product={selectedProduct}
              onSuccess={() => {
                setShowEditDialog(false)
                fetchProducts()
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}