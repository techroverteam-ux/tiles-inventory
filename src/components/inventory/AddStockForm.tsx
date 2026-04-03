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

interface StockEntry {
  productId: string
  locationId: string
  batchNumber: string
  shade: string
  quantity: string
  purchasePrice: string
  sellingPrice: string
  expiryDate: string
  imageUrl: string
}

export default function AddStockForm({ onSuccess, onCancel }: AddStockFormProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [entries, setEntries] = useState<StockEntry[]>([])
  const [imageResetKey, setImageResetKey] = useState(0)

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
    if (!formData.productId || !formData.quantity) {
      showToast('Please fill in all required fields', 'error')
      return
    }
    setLoading(true)
    try {
      const allEntries = [...entries, formData].filter(e => e.productId && e.quantity)
      let successCount = 0
      for (const entry of allEntries) {
        const response = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...entry,
            quantity: parseInt(entry.quantity),
            purchasePrice: parseFloat(entry.purchasePrice) || 0,
            sellingPrice: parseFloat(entry.sellingPrice) || 0,
          })
        })
        if (response.ok) successCount++
      }
      if (successCount > 0) {
        showToast(`${successCount} stock batch(es) added successfully`, 'success')
        onSuccess()
      } else {
        showToast('Failed to add stock batches', 'error')
      }
    } catch {
      showToast('Error adding stock batch', 'error')
    } finally {
      setLoading(false)
    }
  }

  const isValid = formData.productId && formData.quantity

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-2">

      {/* Queued entries */}
      {entries.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Queued Batches ({entries.length})</div>
          {entries.map((entry, idx) => {
            const product = products.find(p => p.id === entry.productId)
            const location = locations.find(l => l.id === entry.locationId)
            return (
              <div key={idx} className="flex items-center gap-3 p-3 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">{product?.name || entry.productId}</div>
                  <div className="text-xs text-muted-foreground">{entry.batchNumber} • {location?.name} • {entry.quantity} units</div>
                </div>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive flex-shrink-0" onClick={() => setEntries(entries.filter((_, i) => i !== idx))}>
                  ✕
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Product & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground/80 ml-0.5">Product <span className="text-destructive">*</span></label>
          <SearchableSelect
            value={formData.productId}
            onValueChange={(val) => setFormData({ ...formData, productId: val })}
            options={products.map(p => ({ value: p.id, label: p.name }))}
            placeholder="Select a product"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground/80 ml-0.5">Location <span className="text-muted-foreground font-normal text-xs">(Optional)</span></label>
          <SearchableSelect
            value={formData.locationId}
            onValueChange={(val) => setFormData({ ...formData, locationId: val })}
            options={locations.map(l => ({ value: l.id, label: l.name }))}
            placeholder="Select a location"
          />
        </div>
      </div>

      {/* Batch Number & Shade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground/80 ml-0.5">Batch Number <span className="text-muted-foreground font-normal text-xs">(Optional)</span></label>
          <Input
            placeholder="e.g., BATCH-001"
            value={formData.batchNumber}
            onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-visible">
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
        <div className="space-y-1.5 overflow-visible">
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
        <label className="text-sm font-bold text-foreground/80 mb-2.5 block">Stock Location Photo <span className="text-muted-foreground font-normal">(Optional)</span></label>
        <ImageUpload
          key={imageResetKey}
          onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
          currentImage={formData.imageUrl}
          label={null}
        />
        <p className="text-[10px] text-muted-foreground mt-2">Photo of the stock in its warehouse location — helps you find it quickly.</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (!isValid) { showToast('Fill all required fields first', 'error'); return }
            setEntries([...entries, { ...formData }])
            setFormData({ productId: '', locationId: '', batchNumber: '', shade: '', quantity: '', purchasePrice: '', sellingPrice: '', expiryDate: '', imageUrl: '' })
            setImageResetKey(k => k + 1)
          }}
          className="rounded-2xl h-11 px-5 border-primary/30 text-primary hover:bg-primary/10 font-bold gap-2"
        >
          + Add More
        </Button>
        <Button
          type="submit"
          disabled={loading || !isValid}
          className="flex-1 rounded-2xl h-11 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          {loading ? 'Adding...' : entries.length > 0 ? `Add ${entries.length + 1} Batches` : 'Add Stock Batch'}
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
