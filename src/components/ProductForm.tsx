'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/contexts/ToastContext'
import ImageUpload from '@/components/ui/image-upload'

interface ProductFormProps {
  onSuccess: () => void
  product?: any
}

interface FormData {
  name: string
  code: string
  sizeId: string
  categoryId: string
  brandId: string
  locationId: string
  batchName: string
  stock: string
  imageUrl: string
}

export default function ProductForm({ onSuccess, product }: ProductFormProps) {
  const { showToast } = useToast()
  const [formData, setFormData] = useState<FormData>({
    name: product?.name || '',
    code: product?.code || '',
    sizeId: product?.sizeId || product?.finishTypeId || '',
    categoryId: product?.categoryId || '',
    brandId: product?.brandId || '',
    locationId: '',
    batchName: '',
    stock: product?.pcsPerBox?.toString() || '',
    imageUrl: product?.imageUrl || ''
  })
  
  const [sizes, setSizes] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchDropdownData()
  }, [])





  const fetchDropdownData = async () => {
    try {
      const [brandsRes, categoriesRes, sizesRes, locationsRes] = await Promise.all([
        fetch('/api/brands'),
        fetch('/api/categories'),
        fetch('/api/sizes'),
        fetch('/api/locations')
      ])

      const [brandsData, categoriesData, sizesData, locationsData] = await Promise.all([
        brandsRes.json(),
        categoriesRes.json(),
        sizesRes.json(),
        locationsRes.json()
      ])

      setBrands((brandsData.brands || []).filter((b: any) => b.isActive))
      setCategories((categoriesData.categories || []).filter((c: any) => c.isActive))
      setSizes((sizesData.sizes || []).filter((s: any) => s.isActive))
      setLocations((locationsData.locations || []).filter((l: any) => l.isActive))
    } catch (error) {
      console.error('Error fetching dropdown data:', error)
    }
  }

  const handleImageUploaded = (url: string) => {
    setFormData({ ...formData, imageUrl: url })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.name.trim()) {
        showToast('Please enter a product name', 'error')
        setLoading(false)
        return
      }

      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'
      
      const submitData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        sizeId: formData.sizeId,
        categoryId: formData.categoryId,
        brandId: formData.brandId,
        finishTypeId: formData.sizeId,
        locationId: formData.locationId,
        batchName: formData.batchName.trim(),
        stock: formData.stock,
        sqftPerBox: '1',
        pcsPerBox: formData.stock,
        imageUrl: formData.imageUrl
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        showToast(
          product ? 'Product updated successfully!' : 'Product created successfully!',
          'success'
        )
        onSuccess()
        
        if (!product) {
          setFormData({
            name: '',
            code: '',
            sizeId: '',
            categoryId: '',
            brandId: '',
            locationId: '',
            batchName: '',
            stock: '',
            imageUrl: ''
          })
        }
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to save product', 'error')
      }
    } catch (error: any) {
      console.error('Error submitting product:', error)
      showToast(error.message || 'Failed to connect to server', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-4 p-6 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tile Name *</label>
            <Input
              placeholder="Enter tile name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Item Code *</label>
            <Input
              placeholder="Enter item code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Brand *</label>
            <Select value={formData.brandId} onValueChange={(value) => {
              setFormData({ ...formData, brandId: value })
            }} required>
              <SelectTrigger className="bg-background border-input text-foreground">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id} className="text-popover-foreground">
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Category *</label>
            <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })} required>
              <SelectTrigger className="bg-background border-input text-foreground">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id} className="text-popover-foreground">
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Size *</label>
            <Select value={formData.sizeId} onValueChange={(value) => setFormData({ ...formData, sizeId: value })} required>
              <SelectTrigger className="bg-background border-input text-foreground">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {sizes.map((size) => (
                  <SelectItem key={size.id} value={size.id} className="text-popover-foreground">
                    {size.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Stock Quantity *</label>
            <Input
              type="number"
              placeholder="Enter stock"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              required
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Location {!product && '*'}</label>
            <Select value={formData.locationId} onValueChange={(value) => setFormData({ ...formData, locationId: value })} required={!product}>
              <SelectTrigger className="bg-background border-input text-foreground">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id} className="text-popover-foreground">
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Batch Name {!product && '*'}</label>
            <Input
              placeholder="Enter batch name"
              value={formData.batchName}
              onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
              required={!product}
              className="bg-background border-input text-foreground"
            />
          </div>
        </div>

        <ImageUpload 
          onImageUploaded={handleImageUploaded}
          currentImage={formData.imageUrl}
        />

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
            {loading ? (product ? 'Updating...' : 'Creating...') : (product ? 'Update' : 'Create')}
          </Button>
          <Button type="button" variant="outline" onClick={() => onSuccess()} className="border-border text-foreground hover:bg-accent">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}