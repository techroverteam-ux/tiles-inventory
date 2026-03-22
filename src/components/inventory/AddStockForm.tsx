'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { DatePicker } from '@/components/ui/date-picker'
import ImageUpload from '@/components/ui/image-upload'
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
    expiryDate: '',
    imageUrl: ''
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
        const err = await response.json()
        showToast(err.error || 'Failed to add stock batch', 'error')
      }
    } catch {
      showToast('Error adding stock batch', 'error')
    } finally {
      setLoading(false)
    }
  }

  const isValid = formData.productId && formData.locationId && formData.batchNumber && formData.quantity

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-2">

      {/* Product & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground/80 ml-0.5">Product <span className="text-destructive">*</span></label>
          <SearchableSelect
            value={formData.productId}
            onValueChange={(val) => setFormData({ ...formData, productId: val })}
            options={products.map(p => ({ value: p.id, label: `${p.name} (${p.code})` }))}
            placeholder="Select a product"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground/80 ml-0.5">Location <span className="text-destructive">*</span></label>
          <SearchableSelect
            value={formData.locationId}
            onValueChange={(val) => setFormData({ ...formData, locationId: val })}
            options={locations.map(l => ({ value: l.id, label: l.name }))}
            placeholder="Select a location"
            required
          />
        </div>
      </div>

      {/* Batch Number & Shade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground/80 ml-0.5">Batch Number <span className="text-destructive">*</span></label>
          <Input
            placeholder="e.g., BATCH-001"
            value={formData.batchNumber}
            onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
            required
            className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-11"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground/80 ml-0.5">Shade / Color</label>
          <Input
            placeholder="e.g., Cream-A"
            value={formData.shade}
            onChange={(e) => setFormData({ ...formData, shade: e.target.value })}
            className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-11"
          />
        </div>
      </div>

      {/* Quantity & Expiry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground/80 ml-0.5">Quantity <span className="text-destructive">*</span></label>
          <Input
            type="number"
            placeholder="Enter unit quantity"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
            className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-11"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground/80 ml-0.5">Expiry Date</label>
          <DatePicker
            date={formData.expiryDate}
            onChange={(date) => setFormData({ ...formData, expiryDate: date ? date.toISOString().split('T')[0] : '' })}
            placeholder="Select date"
            className="h-11 rounded-2xl"
          />
        </div>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-primary/80 ml-0.5">Purchase Price (per unit)</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.purchasePrice}
            onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
            className="rounded-xl border-primary/20 focus:border-primary transition-all h-10 bg-background"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-primary/80 ml-0.5">Selling Price (per unit)</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.sellingPrice}
            onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
            className="rounded-xl border-primary/20 focus:border-primary transition-all h-10 bg-background"
          />
        </div>
      </div>

      {/* Batch Photo */}
      <div className="p-4 bg-muted/20 rounded-2xl border border-border/30">
        <label className="text-sm font-bold text-foreground/80 mb-2.5 block">Batch Photo <span className="text-muted-foreground font-normal">(Optional)</span></label>
        <ImageUpload
          onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
          currentImage={formData.imageUrl}
          label={null}
        />
        <p className="text-[10px] text-muted-foreground mt-2">Add a photo if this batch has unique characteristics or shades.</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading || !isValid}
          className="flex-1 rounded-2xl h-11 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          {loading ? 'Adding Stock...' : 'Add Stock Batch'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-2xl h-11 px-6 border-border/50 font-bold hover:bg-muted/50"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
