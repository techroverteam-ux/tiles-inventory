'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { DatePicker } from '@/components/ui/date-picker'
import { useToast } from '@/contexts/ToastContext'
import { Plus, X, Package, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SalesOrderFormProps {
  onSuccess: () => void
  order?: any
}

interface OrderEntry {
  productId: string
  locationId: string
  batchId: string
  soldDate: string
  quantity: string
  batchName: string
}

interface BatchInfo {
  id: string
  batchNumber: string
  quantity: number
  location: { id: string; name: string }
}

const emptyEntry = (): OrderEntry => ({
  productId: '',
  locationId: '',
  batchId: '',
  soldDate: new Date().toISOString().split('T')[0],
  quantity: '',
  batchName: '',
})

const formatSizeInches = (sizeName?: string) => {
  if (!sizeName) return null
  const match = sizeName.match(/([\d.]+)\s*[xX×]\s*([\d.]+)/)
  if (match) return `${match[1]}" × ${match[2]}"`
  return sizeName
}

export default function SalesOrderForm({ onSuccess, order }: SalesOrderFormProps) {
  const { showToast } = useToast()
  const [formData, setFormData] = useState<OrderEntry>({
    productId: order?.items?.[0]?.productId || '',
    locationId: order?.items?.[0]?.batch?.locationId || '',
    batchId: order?.items?.[0]?.batchId || '',
    soldDate: order?.orderDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    quantity: order?.items?.[0]?.quantity?.toString() || '',
    batchName: order?.items?.[0]?.batch?.batchNumber || '',
  })
  const [orderNumber, setOrderNumber] = useState(order?.orderNumber || `SO-${Date.now()}`)
  const [entries, setEntries] = useState<OrderEntry[]>([])

  const [products, setProducts] = useState<any[]>([])
  const [productBatches, setProductBatches] = useState<BatchInfo[]>([])
  const [totalStock, setTotalStock] = useState<number | null>(null)
  const [stockLoading, setStockLoading] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/products?limit=1000')
      .then(r => r.json())
      .then(pd => setProducts((pd.products || []).filter((p: any) => p.isActive)))
  }, [])

  // Fetch batches whenever product changes
  useEffect(() => {
    if (!formData.productId) {
      setProductBatches([])
      setTotalStock(null)
      setFormData(prev => ({ ...prev, locationId: '', batchId: '', quantity: '' }))
      return
    }
    setStockLoading(true)
    fetch(`/api/inventory/by-product/${formData.productId}`)
      .then(r => r.json())
      .then(data => {
        setProductBatches(data.batches || [])
        setTotalStock(data.totalStock ?? 0)
        setFormData(prev => ({ ...prev, locationId: '', batchId: '', quantity: '' }))
      })
      .finally(() => setStockLoading(false))
  }, [formData.productId])

  // When location changes, auto-select the batch for that location
  useEffect(() => {
    if (!formData.locationId) {
      setFormData(prev => ({ ...prev, batchId: '', quantity: '' }))
      return
    }
    const batch = productBatches.find(b => b.location.id === formData.locationId)
    setFormData(prev => ({
      ...prev,
      batchId: batch?.id || '',
      batchName: batch?.batchNumber || '',
      quantity: '',
    }))
  }, [formData.locationId])

  const selectedProduct = products.find(p => p.id === formData.productId)
  const selectedBatch = productBatches.find(b => b.location.id === formData.locationId)
  const locationStock = selectedBatch?.quantity ?? 0

  // Deduplicate locations from batches (one batch per location)
  const availableLocations = productBatches.map(b => ({ value: b.location.id, label: `${b.location.name} (${b.quantity} units)` }))

  const noStock = formData.productId && totalStock !== null && totalStock <= 0

  const handleQuantityChange = (val: string) => {
    const num = parseInt(val)
    if (val === '') { setFormData(prev => ({ ...prev, quantity: '' })); return }
    if (isNaN(num) || num <= 0) return
    const capped = Math.min(num, locationStock)
    setFormData(prev => ({ ...prev, quantity: capped.toString() }))
  }

  const isCurrentValid = !!(formData.productId && formData.locationId && formData.batchId && formData.quantity && parseInt(formData.quantity) > 0 && !noStock)

  const handleAddMore = () => {
    if (!isCurrentValid) return
    setEntries(prev => [...prev, { ...formData }])
    setFormData(emptyEntry())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const all = isCurrentValid ? [...entries, { ...formData }] : entries
    if (all.length === 0) { showToast('Please fill in required fields', 'error'); return }

    setLoading(true)
    let success = 0
    try {
      if (order) {
        const response = await fetch(`/api/sales-orders/${order.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, orderNumber }),
        })
        if (response.ok) { success = 1 }
        else { const err = await response.json(); showToast(err.error || 'Failed to update order', 'error') }
      } else {
        for (const entry of all) {
          const response = await fetch('/api/sales-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...entry, orderNumber: `SO-${Date.now()}` }),
          })
          if (response.ok) success++
          else { const err = await response.json(); showToast(err.error || 'Failed to create order', 'error') }
        }
      }
      if (success > 0) {
        showToast(order ? 'Order updated successfully' : `${success} order${success > 1 ? 's' : ''} created`, 'success')
        onSuccess()
      }
    } catch { showToast('Error saving order', 'error') }
    finally { setLoading(false) }
  }

  const submitLabel = order
    ? (loading ? 'Updating...' : 'Update Order')
    : (() => {
        const count = (isCurrentValid ? 1 : 0) + entries.length
        return loading ? 'Creating...' : count > 1 ? `Create ${count} Orders` : 'Create Order'
      })()

  return (
    <form onSubmit={handleSubmit} className="space-y-5 py-2">
      {/* Queued entries */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry, i) => {
            const prod = products.find(p => p.id === entry.productId)
            return (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-primary/5 border border-primary/15 text-sm">
                {prod?.imageUrl && <img src={prod.imageUrl} alt={prod.name} className="h-8 w-8 rounded-lg object-cover flex-shrink-0" />}
                <span className="font-medium text-foreground flex-1 truncate">{prod?.name || 'Order'} — Qty: {entry.quantity}</span>
                <button type="button" onClick={() => setEntries(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive transition-colors ml-2">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {!order && (
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground/80 ml-1">Order Number</label>
          <Input placeholder="Order number" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className="rounded-2xl bg-muted/20 border-border/40 h-11" />
        </div>
      )}

      {/* Product */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-foreground/80 ml-1">Product <span className="text-destructive">*</span></label>
        <SearchableSelect
          value={formData.productId}
          onValueChange={(v) => setFormData(prev => ({ ...prev, productId: v }))}
          options={products
            .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
            .map(p => ({
              value: p.id,
              label: [p.name, p.code, p.brand?.name, p.size?.name ? formatSizeInches(p.size.name) || p.size.name : null].filter(Boolean).join(' · ')
            }))}
          placeholder="Search product by name, code, brand..."
        />

        {/* Product preview + stock info */}
        {selectedProduct && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/15 mt-2">
            <div className="h-14 w-14 rounded-xl overflow-hidden bg-muted/30 border border-border/40 flex-shrink-0">
              {selectedProduct.imageUrl ? (
                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground/30"><Package className="h-6 w-6" /></div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-xs space-y-0.5">
              <div className="font-bold text-foreground text-sm truncate">{selectedProduct.name}</div>
              <div className="text-muted-foreground">Code: <span className="font-mono font-bold text-foreground">{selectedProduct.code}</span></div>
              <div className="text-muted-foreground">Brand: <span className="font-medium text-foreground">{selectedProduct.brand?.name}</span></div>
              {selectedProduct.size?.name && (
                <div className="text-muted-foreground">Size: <span className="font-bold text-primary">{formatSizeInches(selectedProduct.size.name) || selectedProduct.size.name}</span></div>
              )}
              <div className="text-muted-foreground">Category: <span className="font-medium text-foreground">{selectedProduct.category?.name}</span></div>
            </div>
            {/* Stock badge */}
            <div className="flex-shrink-0 text-right">
              {stockLoading ? (
                <div className="text-xs text-muted-foreground">Loading...</div>
              ) : totalStock !== null ? (
                noStock ? (
                  <Badge variant="destructive" className="gap-1 text-xs font-bold">
                    <AlertTriangle className="h-3 w-3" /> Out of Stock
                  </Badge>
                ) : (
                  <div className="space-y-0.5 text-right">
                    <Badge variant="default" className="gap-1 text-xs font-bold bg-emerald-500/20 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" />
                      In Stock
                    </Badge>
                    <div className="text-xs font-bold text-foreground">{totalStock} units total</div>
                  </div>
                )
              ) : null}
            </div>
          </div>
        )}

        {/* Out of stock warning */}
        {noStock && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            This product is out of stock and cannot be sold.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Location — only where stock exists */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground/80 ml-1">
            Location <span className="text-destructive">*</span>
            {formData.productId && !stockLoading && availableLocations.length === 0 && !noStock && (
              <span className="text-muted-foreground font-normal ml-1">(no locations with stock)</span>
            )}
          </label>
          <SearchableSelect
            value={formData.locationId}
            onValueChange={(v) => setFormData(prev => ({ ...prev, locationId: v }))}
            options={availableLocations}
            placeholder={formData.productId ? (stockLoading ? 'Loading...' : 'Select location') : 'Select a product first'}
            disabled={!formData.productId || stockLoading || !!noStock || availableLocations.length === 0}
          />
          {selectedBatch && (
            <p className="text-xs text-muted-foreground ml-1">
              Available at this location: <span className="font-bold text-foreground">{locationStock} units</span>
            </p>
          )}
        </div>

        {/* Quantity — capped at location stock */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground/80 ml-1">
            Quantity <span className="text-destructive">*</span>
            {locationStock > 0 && <span className="text-muted-foreground font-normal ml-1">(max {locationStock})</span>}
          </label>
          <Input
            type="number"
            placeholder="Enter quantity"
            value={formData.quantity}
            min={1}
            max={locationStock || undefined}
            onChange={(e) => handleQuantityChange(e.target.value)}
            disabled={!formData.locationId || !!noStock}
            className="rounded-2xl bg-muted/20 border-border/40 h-11"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground/80 ml-1">Sold Date</label>
          <DatePicker date={formData.soldDate} onChange={(d) => setFormData(prev => ({ ...prev, soldDate: d ? d.toISOString().split('T')[0] : '' }))} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground/80 ml-1">Batch Name</label>
          <Input
            placeholder="Auto-filled from batch"
            value={formData.batchName}
            onChange={(e) => setFormData(prev => ({ ...prev, batchName: e.target.value }))}
            className="rounded-2xl bg-muted/20 border-border/40 h-11"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        {!order && (
          <Button type="button" variant="outline" onClick={handleAddMore} disabled={!isCurrentValid}
            className="w-full rounded-2xl h-11 border-dashed border-primary/40 text-primary hover:bg-primary/5 font-bold gap-2">
            <Plus className="h-4 w-4" />Add More
          </Button>
        )}
        <div className="flex gap-3">
          <Button type="submit" disabled={loading || (!isCurrentValid && entries.length === 0) || !!noStock} className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20">
            {submitLabel}
          </Button>
          <Button type="button" variant="outline" onClick={onSuccess} className="flex-1 rounded-2xl h-12 border-border/50 font-bold">Cancel</Button>
        </div>
      </div>
    </form>
  )
}
