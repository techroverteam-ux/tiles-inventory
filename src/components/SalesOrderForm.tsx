'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { DatePicker } from '@/components/ui/date-picker'
import { useToast } from '@/contexts/ToastContext'
import { Plus, X } from 'lucide-react'

interface SalesOrderFormProps {
  onSuccess: () => void
  order?: any
}

interface OrderEntry {
  brandId: string
  soldDate: string
  categoryId: string
  sizeId: string
  locationId: string
  quantity: string
  batchName: string
  amount: string
}

const emptyEntry = (): OrderEntry => ({
  brandId: '',
  soldDate: new Date().toISOString().split('T')[0],
  categoryId: '',
  sizeId: '',
  locationId: '',
  quantity: '',
  batchName: '',
  amount: '',
})

export default function SalesOrderForm({ onSuccess, order }: SalesOrderFormProps) {
  const { showToast } = useToast()
  const [formData, setFormData] = useState<OrderEntry>({
    brandId: order?.items?.[0]?.product?.brandId || '',
    soldDate: order?.orderDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    categoryId: order?.items?.[0]?.product?.categoryId || '',
    sizeId: order?.items?.[0]?.product?.sizeId || '',
    locationId: order?.items?.[0]?.batch?.locationId || '',
    quantity: order?.items?.[0]?.quantity?.toString() || '',
    batchName: order?.items?.[0]?.batch?.batchNumber || '',
    amount: order?.totalAmount?.toString() || '',
  })
  const [orderNumber, setOrderNumber] = useState(order?.orderNumber || `SO-${Date.now()}`)
  const [entries, setEntries] = useState<OrderEntry[]>([])

  const [brands, setBrands] = useState<any[]>([])
  const [filteredCategories, setFilteredCategories] = useState<any[]>([])
  const [filteredSizes, setFilteredSizes] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([fetch('/api/brands'), fetch('/api/locations')])
      .then(([br, lr]) => Promise.all([br.json(), lr.json()]))
      .then(([bd, ld]) => {
        setBrands((bd.brands || []).filter((b: any) => b.isActive))
        setLocations((ld.locations || []).filter((l: any) => l.isActive))
      })
  }, [])

  useEffect(() => {
    if (formData.brandId) {
      fetch(`/api/categories?brandId=${formData.brandId}`)
        .then(r => r.json())
        .then(d => setFilteredCategories((d.categories || []).filter((c: any) => c.isActive)))
    } else {
      setFilteredCategories([])
    }
  }, [formData.brandId])

  useEffect(() => {
    if (formData.brandId && formData.categoryId) {
      fetch(`/api/sizes?brandId=${formData.brandId}&categoryId=${formData.categoryId}`)
        .then(r => r.json())
        .then(d => setFilteredSizes(d.sizes || []))
    } else {
      setFilteredSizes([])
    }
  }, [formData.brandId, formData.categoryId])

  const isCurrentValid = !!(formData.brandId && formData.categoryId && formData.locationId && formData.quantity)

  const handleAddMore = () => {
    if (!isCurrentValid) return
    setEntries(prev => [...prev, { ...formData }])
    setFormData(emptyEntry())
    setFilteredCategories([])
    setFilteredSizes([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const all = isCurrentValid ? [...entries, { ...formData }] : entries
    if (all.length === 0) {
      showToast('Please fill in required fields', 'error')
      return
    }

    setLoading(true)
    let success = 0
    try {
      if (order) {
        const response = await fetch(`/api/sales-orders/${order.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, orderNumber }),
        })
        if (response.ok) { success = 1 } else {
          const err = await response.json()
          showToast(err.error || 'Failed to update order', 'error')
        }
      } else {
        for (const entry of all) {
          const response = await fetch('/api/sales-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...entry, orderNumber: `SO-${Date.now()}` }),
          })
          if (response.ok) success++
          else {
            const err = await response.json()
            showToast(err.error || 'Failed to create order', 'error')
          }
        }
      }
      if (success > 0) {
        showToast(order ? 'Order updated successfully' : `${success} order${success > 1 ? 's' : ''} created`, 'success')
        onSuccess()
      }
    } catch (error) {
      showToast('Error saving order', 'error')
    } finally {
      setLoading(false)
    }
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
            const brand = brands.find(b => b.id === entry.brandId)
            return (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-primary/5 border border-primary/15 text-sm">
                <span className="font-medium text-foreground">
                  {brand?.name || 'Order'} — Qty: {entry.quantity}{entry.amount ? ` — ₹${entry.amount}` : ''}
                </span>
                <button type="button" onClick={() => setEntries(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive transition-colors ml-3">
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
          <Input
            placeholder="Order number"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="rounded-2xl bg-muted/20 border-border/40 h-11"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground/80 ml-1">Brand *</label>
          <SearchableSelect
            value={formData.brandId}
            onValueChange={(v) => setFormData({ ...formData, brandId: v, categoryId: '', sizeId: '' })}
            options={brands.map(b => ({ value: b.id, label: b.name }))}
            placeholder="Select brand"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground/80 ml-1">Category *</label>
          <SearchableSelect
            value={formData.categoryId}
            onValueChange={(v) => setFormData({ ...formData, categoryId: v, sizeId: '' })}
            options={filteredCategories.map(c => ({ value: c.id, label: c.name }))}
            placeholder="Select category"
            disabled={!formData.brandId}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground/80 ml-1">Size</label>
          <SearchableSelect
            value={formData.sizeId}
            onValueChange={(v) => setFormData({ ...formData, sizeId: v })}
            options={filteredSizes.map(s => ({ value: s.id, label: s.name }))}
            placeholder="Select size"
            disabled={!formData.categoryId}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground/80 ml-1">Location *</label>
          <SearchableSelect
            value={formData.locationId}
            onValueChange={(v) => setFormData({ ...formData, locationId: v })}
            options={locations.map(l => ({ value: l.id, label: l.name }))}
            placeholder="Select location"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground/80 ml-1">Quantity *</label>
          <Input
            type="number"
            placeholder="Enter quantity"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="rounded-2xl bg-muted/20 border-border/40 h-11"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground/80 ml-1">Sold Date</label>
          <DatePicker
            date={formData.soldDate}
            onChange={(d) => setFormData({ ...formData, soldDate: d ? d.toISOString().split('T')[0] : '' })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground/80 ml-1">Batch Name</label>
          <Input
            placeholder="Enter batch name"
            value={formData.batchName}
            onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
            className="rounded-2xl bg-muted/20 border-border/40 h-11"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground/80 ml-1">Sale Price</label>
          <Input
            type="number"
            placeholder="Enter sale price"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="rounded-2xl bg-muted/20 border-border/40 h-11"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        {!order && (
          <Button
            type="button"
            variant="outline"
            onClick={handleAddMore}
            disabled={!isCurrentValid}
            className="w-full rounded-2xl h-11 border-dashed border-primary/40 text-primary hover:bg-primary/5 font-bold gap-2"
          >
            <Plus className="h-4 w-4" />
            Add More
          </Button>
        )}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading || (!isCurrentValid && entries.length === 0)}
            className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20"
          >
            {submitLabel}
          </Button>
          <Button type="button" variant="outline" onClick={onSuccess} className="flex-1 rounded-2xl h-12 border-border/50 font-bold">
            Cancel
          </Button>
        </div>
      </div>
    </form>
  )
}
