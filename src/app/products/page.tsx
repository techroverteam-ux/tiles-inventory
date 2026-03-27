'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/contexts/ToastContext'
import { DataView } from '@/components/ui/data-view'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Pagination, usePagination } from '@/components/ui/pagination'
import { TableFilters, useTableFilters, FilterConfig } from '@/components/ui/table-filters'
import { ExportButton, commonColumns } from '@/lib/excel-export'
import { LoadingPage } from '@/components/ui/skeleton'
import ImageUpload from '@/components/ui/image-upload'
import { Filter, Plus, Edit, Trash2, Hash, Layers, Box, Maximize, Package, ZoomIn } from 'lucide-react'
import { RowDetailsDialog } from '@/components/ui/row-details-dialog'
import { ImagePreview } from '@/components/ui/image-preview'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { cn, formatMmToFeetInches } from '@/lib/utils'
import { useResponsiveDefaultView } from '@/hooks/use-responsive-default-view'

interface Product {
  id: string
  name: string
  code: string
  brandId: string
  categoryId: string
  sizeId: string
  sqftPerBox: number
  pcsPerBox: number
  imageUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: {
    name: string
    email: string
  }
  updatedBy?: {
    name: string
    email: string
  }
  brand: { name: string }
  category: { name: string }
  size?: { name: string }
  _count?: {
    batches: number
  }
  totalStock?: number
}

interface FormData {
  name: string
  code: string
  brandId: string
  categoryId: string
  sizeId: string
  sqftPerBox: string
  pcsPerBox: string
  imageUrl: string
}

interface ProductEntry {
  name: string
  code: string
  brandId: string
  categoryId: string
  sizeId: string
  sqftPerBox: string
  pcsPerBox: string
  imageUrl: string
}

interface ApiResponse {
  products: Product[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [sizes, setSizes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { view, setView } = useResponsiveDefaultView()
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedDetailItem, setSelectedDetailItem] = useState<Product | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    brandId: '',
    categoryId: '',
    sizeId: '',
    sqftPerBox: '',
    pcsPerBox: '',
    imageUrl: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<{ src: string, alt: string } | null>(null)
  const [productEntries, setProductEntries] = useState<ProductEntry[]>([])
  const [imageResetKey, setImageResetKey] = useState(0)

  const { showToast } = useToast()
  const searchParams = useSearchParams()
  // Pagination
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange
  } = usePagination(1, 5)

  // Filters
  const {
    filters,
    search,
    updateFilters,
    updateSearch
  } = useTableFilters()

  // Filter configurations
  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      key: 'brandId',
      label: 'Brand',
      type: 'select',
      options: brands.map(brand => ({ value: brand.id, label: brand.name })),
      placeholder: 'All Brands'
    },
    {
      key: 'categoryId',
      label: 'Category',
      type: 'select',
      options: categories.map(category => ({ value: category.id, label: category.name })),
      placeholder: 'All Categories'
    },
    {
      key: 'sizeId',
      label: 'Size',
      type: 'select',
      options: sizes.map(size => ({ value: size.id, label: size.name })),
      placeholder: 'All Sizes'
    },
    {
      key: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ],
      placeholder: 'All Status'
    }
  ], [brands, categories, sizes])

  // Fetch products with pagination and filters
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: search || '',
        ...filters
      })

      const response = await fetch(`/api/products?${params}`)
      if (response.ok) {
        const data: ApiResponse = await response.json()
        setProducts(data.products || [])
        setTotalCount(data.totalCount || 0)
        setTotalPages(data.totalPages || 0)
      } else {
        showToast('Failed to fetch products', 'error')
      }
    } catch (error) {
      showToast('Error fetching products', 'error')
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, search, filters, showToast])

  // Fetch dropdown data
  const fetchDropdownData = useCallback(async () => {
    try {
      const [brandsRes, categoriesRes, sizesRes] = await Promise.all([
        fetch('/api/brands'),
        fetch('/api/categories'),
        fetch('/api/sizes')
      ])

      const [brandsData, categoriesData, sizesData] = await Promise.all([
        brandsRes.json(),
        categoriesRes.json(),
        sizesRes.json()
      ])

      setBrands(brandsData.brands?.filter((b: any) => b.isActive) || [])
      setCategories(categoriesData.categories?.filter((c: any) => c.isActive) || [])
      setSizes(sizesData.sizes?.filter((s: any) => s.isActive) || [])
    } catch (error) {
      console.error('Error fetching dropdown data:', error)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    fetchDropdownData()
  }, [fetchDropdownData])

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setEditingProduct(null)
      resetForm()
      setShowForm(true)
    }
  }, [searchParams])







  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.code.trim() || !formData.brandId || !formData.categoryId || !formData.imageUrl) {
      showToast('Please fill in all required fields including product image', 'error')
      return
    }

    setSubmitting(true)
    try {
      if (editingProduct) {
        const response = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            sqftPerBox: parseFloat(formData.sqftPerBox) || 1,
            pcsPerBox: parseInt(formData.pcsPerBox) || 1
          })
        })
        if (response.ok) {
          showToast('Product updated successfully!', 'success')
          setShowForm(false)
          setEditingProduct(null)
          resetForm()
          fetchProducts()
        } else {
          const errorData = await response.json()
          showToast(errorData.error || 'Failed to save product', 'error')
        }
      } else {
        const allEntries = [...productEntries, formData].filter(e => e.name.trim() && e.code.trim() && e.brandId && e.categoryId && e.imageUrl)
        let successCount = 0
        for (const entry of allEntries) {
          const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...entry,
              sqftPerBox: parseFloat(entry.sqftPerBox) || 1,
              pcsPerBox: parseInt(entry.pcsPerBox) || 1
            })
          })
          if (response.ok) successCount++
        }
        showToast(`${successCount} product(s) created successfully!`, 'success')
        setShowForm(false)
        setProductEntries([])
        resetForm()
        fetchProducts()
      }
    } catch (error) {
      showToast('Error saving product', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const calculateSqFt = (sizeId: string, pcs: string) => {
    if (!sizeId || !pcs) return ''
    const selectedSize = sizes.find(s => s.id === sizeId)
    if (selectedSize && selectedSize.length && selectedSize.width) {
      const areaSqFt = (selectedSize.length / 304.8) * (selectedSize.width / 304.8)
      return (areaSqFt * parseInt(pcs)).toFixed(2)
    }
    return ''
  }

  const handleSizeChange = (value: string) => {
    const newSqFt = calculateSqFt(value, formData.pcsPerBox)
    setFormData(prev => ({
      ...prev,
      sizeId: value,
      ...(newSqFt ? { sqftPerBox: newSqFt } : {})
    }))
  }

  const handlePcsChange = (value: string) => {
    const newSqFt = calculateSqFt(formData.sizeId, value)
    setFormData(prev => ({
      ...prev,
      pcsPerBox: value,
      ...(newSqFt ? { sqftPerBox: newSqFt } : {})
    }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      brandId: '',
      categoryId: '',
      sizeId: '',
      sqftPerBox: '',
      pcsPerBox: '',
      imageUrl: ''
    })
    setProductEntries([])
    setImageResetKey(k => k + 1)
  }

  const handleEdit = async (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      code: product.code,
      brandId: product.brandId,
      categoryId: product.categoryId,
      sizeId: product.sizeId || '',
      sqftPerBox: product.sqftPerBox.toString(),
      pcsPerBox: product.pcsPerBox.toString(),
      imageUrl: product.imageUrl || ''
    })
    setShowForm(true)
  }

  const handleDelete = (product: Product) => {
    setDeleteProduct(product)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteProduct) return

    try {
      const response = await fetch(`/api/products/${deleteProduct.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('Product deleted successfully!', 'success')
        setDeleteProduct(null)
        fetchProducts()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to delete product', 'error')
      }
    } catch (error) {
      showToast('Error deleting product', 'error')
    }
  }

  const handleImageUploaded = (url: string) => {
    setFormData({ ...formData, imageUrl: url })
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    const day = d.getDate().toString().padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`
  }

  const getStockBadgeVariant = (quantity: number) => {
    if (quantity === 0) return 'destructive'
    if (quantity < 10) return 'secondary'
    return 'default'
  }

  const renderGridItem = (product: Product) => (
    <Card className="h-full hover:shadow-premium transition-all duration-300 border-border/50 group overflow-hidden">
      <div
        className="relative aspect-video overflow-hidden bg-muted/30 cursor-zoom-in group/image"
        onClick={(e) => {
          if (product.imageUrl) {
            e.stopPropagation()
            setPreviewImage({ src: product.imageUrl, alt: product.name })
          }
        }}
      >
        {product.imageUrl ? (
          <>
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="text-white opacity-0 group-hover/image:opacity-100 transition-opacity drop-shadow-lg h-8 w-8" />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
            <Package className="h-12 w-12" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge
            variant={product.isActive ? 'default' : 'secondary'}
            className={cn(product.isActive ? "bg-primary text-primary-foreground shadow-lg" : "backdrop-blur-md bg-background/50")}
          >
            {product.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
          <div className="text-white font-bold truncate">{product.code}</div>
        </div>
      </div>
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors truncate">
          {product.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs mb-4">
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/30 border border-border/30 overflow-hidden">
            <Layers className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate">{product.brand.name}</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/30 border border-border/30 overflow-hidden">
            <Filter className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate">{product.category.name}</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/30 border border-border/30 overflow-hidden">
            <Maximize className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate">{product.size?.name || '-'}</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/30 border border-border/30 overflow-hidden">
            <Box className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate">{product.pcsPerBox} pcs</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Stock</span>
          <Badge variant={getStockBadgeVariant(product.totalStock || 0)} className="font-bold tabular-nums">
            {product.totalStock || 0} units
          </Badge>
        </div>

        <div className="text-[10px] sm:text-xs text-muted-foreground mb-4 space-y-1 bg-muted/20 p-2.5 rounded-xl border border-border/20">
          <div className="flex justify-between"><span>Created:</span> <span className="font-medium text-foreground">{formatDate(product.createdAt)}</span></div>
          <div className="flex justify-between"><span>By:</span> <span className="font-medium text-foreground truncate ml-2">{product.createdBy?.name || 'System'}</span></div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
            className="flex-1 rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 gap-2 font-bold h-9"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleDelete(product); }}
            className="flex-1 rounded-xl text-destructive hover:text-destructive border-border/50 hover:bg-destructive/10 hover:border-destructive/30 gap-2 font-bold h-9"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderListRow = (product: Product) => (
    <>
      <td className="px-4 py-2.5">
        <div className="flex items-center space-x-4">
          <div
            className={cn(
              "h-9 w-9 rounded-lg overflow-hidden bg-muted/30 border border-border/50 flex-shrink-0 relative group/thumb",
              product.imageUrl ? "cursor-zoom-in" : ""
            )}
            onClick={(e) => {
              if (product.imageUrl) {
                e.stopPropagation()
                setPreviewImage({ src: product.imageUrl, alt: product.name })
              }
            }}
          >
            {product.imageUrl ? (
              <>
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 transition-colors flex items-center justify-center">
                  <ZoomIn className="text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity h-4 w-4" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                <Package className="h-6 w-6" />
              </div>
            )}
          </div>
          <div>
            <div className="font-bold text-foreground group-hover:text-primary transition-colors">{product.name}</div>
            <div className="text-xs font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full inline-block mt-1">{product.code}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-2.5">
        <Badge
          variant={getStockBadgeVariant(product.totalStock || 0)}
          className="tabular-nums font-bold"
        >
          {product.totalStock || 0} units
        </Badge>
      </td>
      <td className="px-4 py-2.5 text-sm font-medium text-foreground whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <Maximize className="h-4 w-4 text-muted-foreground" />
          {product.size?.name || '-'}
        </div>
      </td>
      <td className="px-4 py-2.5 text-sm text-foreground">
        <div className="font-bold">{product.category.name}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{product.brand.name}</div>
      </td>
      <td className="px-4 py-2.5 text-sm text-muted-foreground">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Box className="h-4 w-4 text-muted-foreground" />
            {product.pcsPerBox} pcs
          </div>
          <div className="text-xs opacity-70 ml-6">{product.sqftPerBox} sqft</div>
        </div>
      </td>
      <td className="px-4 py-2.5">
        <Badge
          variant={product.isActive ? 'default' : 'secondary'}
          className={cn(product.isActive ? "bg-primary/20 text-primary border-none" : "")}
        >
          {product.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-2.5 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">{formatDate(product.createdAt)}</div>
        <div className="text-xs">{product.createdBy?.name || 'System'}</div>
      </td>
      <td className="px-4 py-2.5 text-sm text-muted-foreground">
        {product.updatedAt && product.updatedAt !== product.createdAt
          ? (
            <div>
              <div className="font-medium text-foreground">{formatDate(product.updatedAt)}</div>
              <div className="text-xs">{product.updatedBy?.name || 'System'}</div>
            </div>
          )
          : <span className="text-xs opacity-30">No updates</span>
        }
      </td>
      <td className="px-4 py-2.5">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
            className="rounded-xl hover:bg-primary/10 hover:text-primary gap-2 font-bold px-3 transition-all"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleDelete(product); }}
            className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 font-bold px-3 transition-all"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </td>
    </>
  )

  if (loading && products.length === 0) {
    return <LoadingPage view={view} title="Products" />
  }

  const isFormValid = formData.name.trim() !== '' &&
    formData.code.trim() !== '' &&
    formData.brandId !== '' &&
    formData.categoryId !== '' &&
    formData.imageUrl !== ''

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 space-y-6">
      {/* Filters */}
      <TableFilters
        title="Products"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={products}
              columns={commonColumns.product}
              filename="products-export"
              reportTitle="Products Report"
              onExportComplete={(result) => {
                if (result.success) {
                  showToast(`Exported ${products.length} products successfully!`, 'success')
                } else {
                  showToast(result.error || 'Export failed', 'error')
                }
              }}
              disabled={products.length === 0}
            />
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => {
                  setEditingProduct(null)
                  resetForm()
                }} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-premium animate-in zoom-in-95 duration-200 no-scrollbar">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                  {/* Queued product entries */}
                  {!editingProduct && productEntries.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Queued ({productEntries.length})</div>
                      {productEntries.map((entry, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-primary/5 rounded-2xl border border-primary/10">
                          <div className="h-8 w-8 rounded-lg overflow-hidden bg-muted/30 flex-shrink-0">
                            {entry.imageUrl ? <img src={entry.imageUrl} alt={entry.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground/40" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-foreground truncate">{entry.name}</div>
                            <div className="text-xs text-muted-foreground">{entry.code}</div>
                          </div>
                          <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive flex-shrink-0" onClick={() => setProductEntries(productEntries.filter((_, i) => i !== idx))}>
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/80 ml-1">Name <span className="text-destructive">*</span></label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter product name"
                        required
                        className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/80 ml-1">Code <span className="text-destructive">*</span></label>
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="Enter product code"
                        required
                        className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/80 ml-1">Brand <span className="text-destructive">*</span></label>
                      <SearchableSelect
                        value={formData.brandId}
                        onValueChange={(value) => setFormData({ ...formData, brandId: value })}
                        options={brands.map(b => ({ value: b.id, label: b.name }))}
                        placeholder="Select a brand"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/80 ml-1">Category <span className="text-destructive">*</span></label>
                      <SearchableSelect
                        value={formData.categoryId}
                        onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                        options={categories.map(c => ({ value: c.id, label: c.name }))}
                        placeholder="Select a category"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/80 ml-1 flex items-center gap-2">
                        <Maximize className="h-4 w-4" />
                        Size
                      </label>
                      <SearchableSelect
                        value={formData.sizeId}
                        onValueChange={handleSizeChange}
                        options={sizes.map(s => ({
                          value: s.id,
                          label: s.length && s.width ? `${s.name} (${formatMmToFeetInches(s.length)} × ${formatMmToFeetInches(s.width)})` : s.name
                        }))}
                        placeholder="Select a size"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-primary/5 rounded-3xl border border-primary/10">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-primary/80 ml-1">Sq Ft per Box</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.sqftPerBox}
                        onChange={(e) => setFormData({ ...formData, sqftPerBox: e.target.value })}
                        placeholder="Enter sq ft"
                        className="rounded-xl border-primary/20 focus:border-primary transition-all h-11 bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-primary/80 ml-1">Pieces per Box</label>
                      <Input
                        type="number"
                        value={formData.pcsPerBox}
                        onChange={(e) => handlePcsChange(e.target.value)}
                        placeholder="Enter pieces"
                        className="rounded-xl border-primary/20 focus:border-primary transition-all h-11 bg-background"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-muted/20 rounded-3xl border border-border/30">
                    <label className="text-sm font-bold text-foreground/80 mb-3 block ml-1">Product Image <span className="text-destructive">*</span></label>
                    <ImageUpload
                      key={imageResetKey}
                      onImageUploaded={handleImageUploaded}
                      currentImage={formData.imageUrl}
                      label={null}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    {!editingProduct && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (!isFormValid) { showToast('Please fill all required fields including image', 'error'); return }
                          setProductEntries([...productEntries, { ...formData }])
                          setFormData({ name: '', code: '', brandId: '', categoryId: '', sizeId: '', sqftPerBox: '', pcsPerBox: '', imageUrl: '' })
                          setImageResetKey(k => k + 1)
                        }}
                        className="rounded-2xl h-12 px-5 border-primary/30 text-primary hover:bg-primary/10 font-bold gap-2"
                      >
                        <Plus className="h-4 w-4" /> Add More
                      </Button>
                    )}
                    <Button type="submit" disabled={submitting || !isFormValid} className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
                      {submitting ? 'Saving...' : editingProduct ? 'Update Product' : productEntries.length > 0 ? `Create ${productEntries.length + 1} Products` : 'Create Product'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="rounded-2xl h-12 px-8 border-border/50 font-bold hover:bg-muted/50"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
        filters={filterConfigs}
        values={filters}
        onFiltersChange={updateFilters}
        searchValue={search}
        onSearchChange={updateSearch}
        loading={loading}
      />

      <DataView
        items={products}
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
          headers: ['Product', 'Stock', 'Size', 'Category', 'Box Info', 'Status', 'Created', 'Updated', 'Actions'],
          renderRow: renderListRow
        }}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        loading={loading}
      />

      <ConfirmationDialog
        open={!!deleteProduct}
        onOpenChange={(open) => {
          if (!open) setDeleteProduct(null)
        }}
        title="Delete Product"
        description={deleteProduct ? `Are you sure you want to delete "${deleteProduct.name}"? This action cannot be undone.` : ''}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        variant="destructive"
      />

      <RowDetailsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        title="Product Details"
        data={selectedDetailItem}
        fields={[
          { label: 'Product Name', value: selectedDetailItem?.name },
          { label: 'Product Code', value: selectedDetailItem?.code },
          { label: 'Brand', value: selectedDetailItem?.brand?.name },
          { label: 'Category', value: selectedDetailItem?.category?.name },
          { label: 'Size', value: selectedDetailItem?.size?.name },
          { label: 'Sqft per Box', value: selectedDetailItem?.sqftPerBox, variant: 'number' as const },
          { label: 'Pcs per Box', value: selectedDetailItem?.pcsPerBox, variant: 'number' as const },
          { label: 'Status', value: selectedDetailItem?.isActive, variant: 'badge' as const },
          { label: 'Created Date', value: selectedDetailItem?.createdAt },
          { label: 'Created By', value: selectedDetailItem?.createdBy?.name },
          { label: 'Updated Date', value: selectedDetailItem?.updatedAt !== selectedDetailItem?.createdAt ? selectedDetailItem?.updatedAt : undefined },
          { label: 'Updated By', value: selectedDetailItem?.updatedAt !== selectedDetailItem?.createdAt ? selectedDetailItem?.updatedBy?.name : undefined },
        ].filter(f => f.value !== undefined)}
        imageUrl={selectedDetailItem?.imageUrl}
        onImageClick={(src) => setPreviewImage({ src, alt: selectedDetailItem?.name || '' })}
      />

      <ImagePreview
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        src={previewImage?.src || null}
        alt={previewImage?.alt || ''}
      />
    </div>
  )
}