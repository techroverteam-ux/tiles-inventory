'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/contexts/ToastContext'
import { DataView } from '@/components/ui/data-view'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import ImageUpload from '@/components/ui/image-upload'

interface Product {
  id: string
  name: string
  code: string
  brandId: string
  categoryId: string
  sizeId: string
  finishTypeId: string
  sqftPerBox: number
  pcsPerBox: number
  imageUrl?: string
  isActive: boolean
  createdAt: string
  brand: { name: string }
  category: { name: string }
  size: { name: string }
  finishType: { name: string }
  _count?: {
    batches: number
  }
}

interface FormData {
  name: string
  code: string
  brandId: string
  categoryId: string
  sizeId: string
  finishTypeId: string
  sqftPerBox: string
  pcsPerBox: string
  imageUrl: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [sizes, setSizes] = useState<any[]>([])
  const [finishTypes, setFinishTypes] = useState<any[]>([])
  const [filteredCategories, setFilteredCategories] = useState<any[]>([])
  const [filteredSizes, setFilteredSizes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    brandId: '',
    categoryId: '',
    sizeId: '',
    finishTypeId: '',
    sqftPerBox: '',
    pcsPerBox: '',
    imageUrl: ''
  })
  const [submitting, setSubmitting] = useState(false)
  
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchProducts()
    fetchDropdownData()
  }, [])

  useEffect(() => {
    if (formData.brandId) {
      fetchCategoriesByBrand(formData.brandId)
    } else {
      setFilteredCategories([])
    }
  }, [formData.brandId])

  useEffect(() => {
    if (formData.brandId && formData.categoryId) {
      fetchSizesByBrandAndCategory(formData.brandId, formData.categoryId)
    } else {
      setFilteredSizes([])
    }
  }, [formData.brandId, formData.categoryId])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      } else {
        showToast('Failed to fetch products', 'error')
      }
    } catch (error) {
      showToast('Error fetching products', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdownData = async () => {
    try {
      const [brandsRes, finishTypesRes] = await Promise.all([
        fetch('/api/brands'),
        fetch('/api/finish-types')
      ])

      const [brandsData, finishTypesData] = await Promise.all([
        brandsRes.json(),
        finishTypesRes.json()
      ])

      setBrands(brandsData.brands?.filter((b: any) => b.isActive) || [])
      setFinishTypes(finishTypesData.finishTypes?.filter((f: any) => f.isActive) || [])
    } catch (error) {
      console.error('Error fetching dropdown data:', error)
    }
  }

  const fetchCategoriesByBrand = async (brandId: string) => {
    try {
      const response = await fetch(`/api/categories?brandId=${brandId}`)
      const data = await response.json()
      setFilteredCategories(data.categories?.filter((c: any) => c.isActive) || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchSizesByBrandAndCategory = async (brandId: string, categoryId: string) => {
    try {
      const response = await fetch(`/api/sizes?brandId=${brandId}&categoryId=${categoryId}`)
      const data = await response.json()
      setFilteredSizes(data.sizes || [])
    } catch (error) {
      console.error('Error fetching sizes:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.code.trim() || !formData.brandId || !formData.categoryId || !formData.finishTypeId) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    setSubmitting(true)
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sqftPerBox: parseFloat(formData.sqftPerBox) || 1,
          pcsPerBox: parseInt(formData.pcsPerBox) || 1
        })
      })

      if (response.ok) {
        showToast(
          editingProduct ? 'Product updated successfully!' : 'Product created successfully!',
          'success'
        )
        setShowForm(false)
        setEditingProduct(null)
        resetForm()
        fetchProducts()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to save product', 'error')
      }
    } catch (error) {
      showToast('Error saving product', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      brandId: '',
      categoryId: '',
      sizeId: '',
      finishTypeId: '',
      sqftPerBox: '',
      pcsPerBox: '',
      imageUrl: ''
    })
    setFilteredCategories([])
    setFilteredSizes([])
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      code: product.code,
      brandId: product.brandId,
      categoryId: product.categoryId,
      sizeId: product.sizeId || '',
      finishTypeId: product.finishTypeId,
      sqftPerBox: product.sqftPerBox.toString(),
      pcsPerBox: product.pcsPerBox.toString(),
      imageUrl: product.imageUrl || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('Product deleted successfully!', 'success')
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

  const renderGridItem = (product: Product) => (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-card-foreground">
              {product.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {product.code}
            </p>
          </div>
          <Badge variant={product.isActive ? 'default' : 'secondary'}>
            {product.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {product.imageUrl && (
          <div className="mb-4">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-32 object-cover rounded-md"
            />
          </div>
        )}
        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div>Brand: {product.brand.name}</div>
          <div>Category: {product.category.name}</div>
          <div>Size: {product.size.name}</div>
          <div>Finish: {product.finishType.name}</div>
          <div>Box: {product.pcsPerBox} pcs / {product.sqftPerBox} sqft</div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(product)}
            className="flex-1"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(product)}
            className="flex-1 text-destructive hover:text-destructive"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderListRow = (product: Product) => (
    <>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-3">
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-10 h-10 object-cover rounded"
            />
          )}
          <div>
            <div className="font-medium text-foreground">{product.name}</div>
            <div className="text-sm text-muted-foreground">{product.code}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm">
          <div>{product.brand.name}</div>
          <div className="text-muted-foreground">{product.category.name}</div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {product.size.name}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {product.finishType.name}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {product.pcsPerBox} pcs<br />
        {product.sqftPerBox} sqft
      </td>
      <td className="px-4 py-3">
        <Badge variant={product.isActive ? 'default' : 'secondary'}>
          {product.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(product)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(product)}
            className="text-destructive hover:text-destructive"
          >
            Delete
          </Button>
        </div>
      </td>
    </>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <DataView
        items={products}
        view={view}
        onViewChange={setView}
        title="Products"
        actions={
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingProduct(null)
                resetForm()
              }}>
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name"
                      required
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Code *</label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="Enter product code"
                      required
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Brand *</label>
                    <select
                      value={formData.brandId}
                      onChange={(e) => setFormData({ ...formData, brandId: e.target.value, categoryId: '', sizeId: '' })}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="">Select a brand</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Category *</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, sizeId: '' })}
                      disabled={!formData.brandId}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground disabled:opacity-50"
                    >
                      <option value="">Select a category</option>
                      {filteredCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Size</label>
                    <select
                      value={formData.sizeId}
                      onChange={(e) => setFormData({ ...formData, sizeId: e.target.value })}
                      disabled={!formData.categoryId}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground disabled:opacity-50"
                    >
                      <option value="">Select a size</option>
                      {filteredSizes.map((size) => (
                        <option key={size.id} value={size.id}>
                          {size.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Finish Type *</label>
                    <select
                      value={formData.finishTypeId}
                      onChange={(e) => setFormData({ ...formData, finishTypeId: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="">Select finish type</option>
                      {finishTypes.map((finish) => (
                        <option key={finish.id} value={finish.id}>
                          {finish.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Sq Ft per Box</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.sqftPerBox}
                      onChange={(e) => setFormData({ ...formData, sqftPerBox: e.target.value })}
                      placeholder="Enter sq ft per box"
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Pieces per Box</label>
                    <Input
                      type="number"
                      value={formData.pcsPerBox}
                      onChange={(e) => setFormData({ ...formData, pcsPerBox: e.target.value })}
                      placeholder="Enter pieces per box"
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                </div>

                <ImageUpload 
                  onImageUploaded={handleImageUploaded}
                  currentImage={formData.imageUrl}
                />

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground">
                    {submitting ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="border-border text-foreground"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
        gridProps={{
          renderItem: renderGridItem,
          columns: 3
        }}
        listProps={{
          headers: ['Product', 'Brand & Category', 'Size', 'Finish', 'Box Info', 'Status', 'Actions'],
          renderRow: renderListRow
        }}
      />
    </div>
  )
}