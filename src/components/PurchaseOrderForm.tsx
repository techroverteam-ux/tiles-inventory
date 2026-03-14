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
  quantity: string
  batchName: string
  amount: string
}

export default function PurchaseOrderForm({ onSuccess, order }: PurchaseOrderFormProps) {
  const [formData, setFormData] = useState<FormData>({
    orderNumber: order?.orderNumber || `PO-${Date.now()}`,
    brandId: order?.brandId || '',
    orderDate: order?.orderDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    expectedDate: order?.expectedDate?.split('T')[0] || '',
    categoryId: order?.items?.[0]?.product?.categoryId || '',
    sizeId: order?.items?.[0]?.product?.sizeId || '',
    quantity: order?.items?.[0]?.quantity?.toString() || '',
    batchName: order?.items?.[0]?.batchNumber || '',
    amount: order?.totalAmount?.toString() || ''
  })
  
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<any[]>([])
  const [sizes, setSizes] = useState<Size[]>([])
  const [filteredSizes, setFilteredSizes] = useState<any[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
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

  const fetchCategoriesByBrand = async (brandId: string) => {
    try {
      const response = await fetch(`/api/categories?brandId=${brandId}`)
      const data = await response.json()
      setFilteredCategories((data.categories || []).filter((c: any) => c.isActive))
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

  const fetchDropdownData = async () => {
    try {
      const [brandsRes, locationsRes] = await Promise.all([
        fetch('/api/brands'),
        fetch('/api/locations')
      ])

      const [brandsData, locationsData] = await Promise.all([
        brandsRes.json(),
        locationsRes.json()
      ])

      setBrands((brandsData.brands || []).filter((b: Brand) => b.isActive))
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
            quantity: '',
            batchName: '',
            amount: ''
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
          <Select value={formData.brandId} onValueChange={(value) => {
            setFormData({ ...formData, brandId: value, categoryId: '', sizeId: '' })
          }} required>
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
          <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value, sizeId: '' })} disabled={!formData.brandId} required>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {filteredCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Size</label>
          <Select value={formData.sizeId} onValueChange={(value) => setFormData({ ...formData, sizeId: value })} disabled={!formData.categoryId} required>
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {filteredSizes.map((size) => (
                <SelectItem key={size.id} value={size.id}>
                  {size.name}
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

        <div className="space-y-2">
          <label className="text-sm font-medium">Batch Name (Optional)</label>
          <Input
            placeholder="Enter batch name"
            value={formData.batchName}
            onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Amount (Optional)</label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
          {loading ? (order ? 'Updating...' : 'Creating...') : (order ? 'Update Order' : 'Create Order')}
        </Button>
        <Button type="button" variant="outline" onClick={() => onSuccess()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
