'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
}

export default function ProductForm({ onSuccess, product }: ProductFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: product?.name || '',
    code: product?.code || '',
    sizeId: product?.finishTypeId || '',
    categoryId: product?.categoryId || '',
    brandId: product?.brandId || '',
    locationId: '',
    batchName: '',
    stock: product?.pcsPerBox?.toString() || ''
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
      const [sizesRes, categoriesRes, brandsRes, locationsRes] = await Promise.all([
        fetch('/api/sizes'),
        fetch('/api/categories'),
        fetch('/api/brands'),
        fetch('/api/locations')
      ])

      const [sizesData, categoriesData, brandsData, locationsData] = await Promise.all([
        sizesRes.json(),
        categoriesRes.json(),
        brandsRes.json(),
        locationsRes.json()
      ])

      setSizes((sizesData.sizes || []).filter(s => s.isActive))
      setCategories((categoriesData.categories || []).filter(c => c.isActive))
      setBrands((brandsData.brands || []).filter(b => b.isActive))
      setLocations((locationsData.locations || []).filter(l => l.isActive))
    } catch (error) {
      console.error('Error fetching dropdown data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        console.log('Product created successfully')
        onSuccess()
        setFormData({
          name: '',
          code: '',
          sizeId: '',
          categoryId: '',
          brandId: '',
          locationId: '',
          batchName: '',
          stock: ''
        })
      } else {
        console.error('API Error:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error creating product:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 py-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Tile Name</label>
          <Input
            placeholder="Enter tile name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Item Code</label>
          <Input
            placeholder="Enter item code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Size</label>
          <Select value={formData.sizeId} onValueChange={(value) => setFormData({ ...formData, sizeId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {sizes.map((size) => (
                <SelectItem key={size.id} value={size.id}>
                  {size.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Category</label>
          <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Brand</label>
          <Select value={formData.brandId} onValueChange={(value) => setFormData({ ...formData, brandId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Location</label>
          <Select value={formData.locationId} onValueChange={(value) => setFormData({ ...formData, locationId: value })} required>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Batch Name</label>
          <Input
            placeholder="Enter batch name"
            value={formData.batchName}
            onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Stock Quantity</label>
        <Input
          type="number"
          placeholder="Enter stock quantity"
          value={formData.stock}
          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
          required
          className="w-full"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
          {loading ? (product ? 'Updating...' : 'Creating...') : (product ? 'Update Product' : 'Create Product')}
        </Button>
        <Button type="button" variant="outline" onClick={() => onSuccess()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}