'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Brand {
  id: string
  name: string
  isActive: boolean
}

interface Category {
  id: string
  name: string
  isActive: boolean
}

interface Size {
  id: string
  name: string
  isActive: boolean
}

interface Location {
  id: string
  name: string
  isActive: boolean
}

interface PurchaseOrderFormProps {
  onSuccess: () => void
  order?: any
}

interface FormData {
  orderNumber: string
  brandId: string
  orderDate: string
  expectedDate: string
  categoryId: string
  sizeId: string
  locationId: string
  quantity: string
}

export default function PurchaseOrderForm({ onSuccess, order }: PurchaseOrderFormProps) {
  const [formData, setFormData] = useState<FormData>({
    orderNumber: order?.orderNumber || `PO-${Date.now()}`,
    brandId: order?.brandId || '',
    orderDate: order?.orderDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    expectedDate: order?.expectedDate?.split('T')[0] || '',
    categoryId: '',
    sizeId: '',
    locationId: '',
    quantity: ''
  })
  
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sizes, setSizes] = useState<Size[]>([])
  const [locations, setLocations] = useState<Location[]>([])
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

      setBrands((brandsData.brands || []).filter((b: Brand) => b.isActive))
      setCategories((categoriesData.categories || []).filter((c: Category) => c.isActive))
      setSizes((sizesData.sizes || []).filter((s: Size) => s.isActive))
      setLocations((locationsData.locations || []).filter((l: Location) => l.isActive))
    } catch (error) {
      console.error('Error fetching dropdown data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = order ? `/api/purchase-orders/${order.id}` : '/api/purchase-orders'
      const method = order ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSuccess()
        if (!order) {
          setFormData({
            orderNumber: `PO-${Date.now()}`,
            brandId: '',
            orderDate: new Date().toISOString().split('T')[0],
            expectedDate: '',
            categoryId: '',
            sizeId: '',
            locationId: '',
            quantity: ''
          })
        }
      } else {
        console.error('API Error:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error saving purchase order:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Order Number</label>
          <Input
            placeholder="Enter order number"
            value={formData.orderNumber}
            onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Brand</label>
          <Select value={formData.brandId} onValueChange={(value) => setFormData({ ...formData, brandId: value })} required>
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

        <div className="space-y-2">
          <label className="text-sm font-medium">Order Date</label>
          <Input
            type="date"
            value={formData.orderDate}
            onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Expected Date</label>
          <Input
            type="date"
            value={formData.expectedDate}
            onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })} required>
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

        <div className="space-y-2">
          <label className="text-sm font-medium">Size</label>
          <Select value={formData.sizeId} onValueChange={(value) => setFormData({ ...formData, sizeId: value })} required>
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

        <div className="space-y-2">
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

        <div className="space-y-2">
          <label className="text-sm font-medium">Quantity</label>
          <Input
            type="number"
            placeholder="Enter quantity"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
          {loading ? (order ? 'Updating...' : 'Creating...') : (order ? 'Update Order' : 'Create Order')}
        </Button>
        <Button type="button" variant="outline" onClick={() => onSuccess()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}