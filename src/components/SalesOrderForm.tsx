'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { DatePicker } from '@/components/ui/date-picker'

interface SalesOrderFormProps {
  onSuccess: () => void
  order?: any
}

interface FormData {
  orderNumber: string
  brandId: string
  soldDate: string
  categoryId: string
  sizeId: string
  locationId: string
  quantity: string
  batchName: string
  amount: string
}

export default function SalesOrderForm({ onSuccess, order }: SalesOrderFormProps) {
  const [formData, setFormData] = useState<FormData>({
    orderNumber: order?.orderNumber || `SO-${Date.now()}`,
    brandId: order?.items?.[0]?.product?.brandId || '',
    soldDate: order?.orderDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    categoryId: order?.items?.[0]?.product?.categoryId || '',
    sizeId: order?.items?.[0]?.product?.sizeId || '',
    locationId: order?.items?.[0]?.batch?.locationId || '',
    quantity: order?.items?.[0]?.quantity?.toString() || '',
    batchName: order?.items?.[0]?.batch?.batchNumber || '',
    amount: order?.totalAmount?.toString() || ''
  })
  
  const [brands, setBrands] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [filteredCategories, setFilteredCategories] = useState<any[]>([])
  const [sizes, setSizes] = useState<any[]>([])
  const [filteredSizes, setFilteredSizes] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
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

      setBrands((brandsData.brands || []).filter((b: any) => b.isActive))
      setLocations((locationsData.locations || []).filter((l: any) => l.isActive))
    } catch (error) {
      console.error('Error fetching dropdown data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = order ? `/api/sales-orders/${order.id}` : '/api/sales-orders'
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
            orderNumber: `SO-${Date.now()}`,
            brandId: '',
            soldDate: new Date().toISOString().split('T')[0],
            categoryId: '',
            sizeId: '',
            locationId: '',
            quantity: '',
            batchName: '',
            amount: ''
          })
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to save sales order')
        console.error('API Error:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error saving sales order:', error)
      alert('Error saving sales order')
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
          <SearchableSelect
            value={formData.brandId}
            onValueChange={(value) => setFormData({ ...formData, brandId: value, categoryId: '', sizeId: '' })}
            options={brands.map(b => ({ value: b.id, label: b.name }))}
            placeholder="Select brand"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Sold Date</label>
          <DatePicker
            date={formData.soldDate}
            onChange={(date) => setFormData({ ...formData, soldDate: date ? date.toISOString().split('T')[0] : '' })}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <SearchableSelect
            value={formData.categoryId}
            onValueChange={(value) => setFormData({ ...formData, categoryId: value, sizeId: '' })}
            options={filteredCategories.map(c => ({ value: c.id, label: c.name }))}
            placeholder="Select category"
            disabled={!formData.brandId}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Size</label>
          <SearchableSelect
            value={formData.sizeId}
            onValueChange={(value) => setFormData({ ...formData, sizeId: value })}
            options={filteredSizes.map(s => ({ value: s.id, label: s.name }))}
            placeholder="Select size"
            disabled={!formData.categoryId}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Location</label>
          <SearchableSelect
            value={formData.locationId}
            onValueChange={(value) => setFormData({ ...formData, locationId: value })}
            options={locations.map(l => ({ value: l.id, label: l.name }))}
            placeholder="Select location"
            required
          />
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
          <label className="text-sm font-medium">Sale Price (Optional)</label>
          <Input
            type="number"
            placeholder="Enter sale price"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? (order ? 'Updating...' : 'Creating...') : (order ? 'Update Order' : 'Create Order')}
        </Button>
        <Button type="button" variant="outline" onClick={() => onSuccess()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
