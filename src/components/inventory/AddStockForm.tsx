'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/contexts/ToastContext'

interface AddStockFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function AddStockForm({ onSuccess, onCancel }: AddStockFormProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    productId: '',
    locationId: '',
    batchNumber: '',
    shade: '',
    quantity: '',
    purchasePrice: '',
    sellingPrice: '',
    expiryDate: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, locationsRes] = await Promise.all([
        fetch('/api/products?limit=1000'),
        fetch('/api/locations')
      ])
      
      const [productsData, locationsData] = await Promise.all([
        productsRes.json(),
        locationsRes.json()
      ])
      
      setProducts(productsData.products || [])
      setLocations(locationsData.locations || [])
    } catch (error) {
      console.error('Error fetching form data:', error)
      showToast('Failed to load products or locations', 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.productId || !formData.locationId || !formData.batchNumber || !formData.quantity) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
          purchasePrice: parseFloat(formData.purchasePrice) || 0,
          sellingPrice: parseFloat(formData.sellingPrice) || 0,
        })
      })

      if (response.ok) {
        showToast('Stock batch added successfully', 'success')
        onSuccess()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to add stock batch', 'error')
      }
    } catch (error) {
      console.error('Error adding stock:', error)
      showToast('Error adding stock batch', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        <div className="space-y-2">
          <label className="text-sm font-medium">Product *</label>
          <Select value={formData.productId} onValueChange={(val) => setFormData({ ...formData, productId: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} ({product.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Location *</label>
          <Select value={formData.locationId} onValueChange={(val) => setFormData({ ...formData, locationId: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Batch Number *</label>
          <Input 
            placeholder="e.g., BATCH-001" 
            value={formData.batchNumber}
            onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Shade / Color</label>
          <Input 
            placeholder="e.g., Cream-A" 
            value={formData.shade}
            onChange={(e) => setFormData({ ...formData, shade: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Quantity *</label>
          <Input 
            type="number" 
            placeholder="Enter unit quantity" 
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Expiry Date</label>
          <Input 
            type="date" 
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Purchase Price (per unit)</label>
          <Input 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            value={formData.purchasePrice}
            onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Selling Price (per unit)</label>
          <Input 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            value={formData.sellingPrice}
            onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Stock Batch'}
        </Button>
      </div>
    </form>
  )
}
