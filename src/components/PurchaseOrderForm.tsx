'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { DatePicker } from '@/components/ui/date-picker'
import { useToast } from '@/contexts/ToastContext'
import { Plus, X, Package } from 'lucide-react'

interface PurchaseOrderFormProps {
  onSuccess: () => void
  order?: any
}

interface OrderEntry {
  productId: string
  orderDate: string
  expectedDate: string
  quantity: string
  batchName: string
  amount: string
}

const emptyEntry = (): OrderEntry => ({
  productId: '',
  orderDate: new Date().toISOString().split('T')[0],
  expectedDate: '',
  quantity: '',
  batchName: '',
  amount: '',
})

const formatSizeInches = (sizeName?: string) => {
  if (!sizeName) return null
  const match = sizeName.match(/([\d.]+)\s*[xX×]\s*([\d.]+)/)
  if (match) return `${match[1]}" × ${match[2]}"`
  return sizeName
}

export default function PurchaseOrderForm({ onSuccess, order }: PurchaseOrderFormProps) {
  const { showToast } = useToast()
  const [formData, setFormData] = useState<OrderEntry>({
    productId: order?.items?.[0]?.productId || '',
    orderDate: order?.orderDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    expectedDate: order?.expectedDate?.split('T')[0] || '',
    quantity: order?.items?.[0]?.quantity?.toString() || '',
    batchName: order?.items?.[0]?.batchNumber || '',
    amount: order?.totalAmount?.toString() || '',
  })
  const [orderNumber, setOrderNumber] = useState(order?.orderNumber || `PO-${Date.now()}`)
  const [entries, setEntries] = useState<OrderEntry[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/products?limit=1000')
      .then(r => r.json())
      .then(d => setProducts((d.products || []).filter((p: any) => p.isActive)))
  }, [])

  const selectedProduct = products.find(p => p.id === formData.productId)
  const isCurrentValid = !!(formData.productId && formData.quantity)

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
        const response = await fetch(`/api/purchase-orders/${order.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, orderNumber }),
        })
        if (response.ok) { success = 1 }
        else { const err = await response.json(); showToast(err.error || 'Failed to update order', 'error') }
      } else {
        for (const entry of all) {
          const response = await fetch('/api/purchase-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...entry, orderNumber: `PO-${Date.now()}` }),
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
                <span className="font-medium text-foreground flex-1 truncate">{prod?.name || 'Order'} — Qty: {entry.quantity}{entry.amount ? ` — ₹${entry.amount}` : ''}</span>
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
          onValueChange={(v) => setFormData({ ...formData, productId: v })}
          options={products
            .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
            .map(p => ({
              value: p.id,
              label: [p.name, p.brand?.name, p.size?.name ? formatSizeInches(p.size.name) || p.size.name : null].filter(Boolean).join(' · ')
            }))}
          placeholder="Search product by name, brand..."
        />
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

              <div className="text-muted-foreground">Brand: <span className="font-medium text-foreground">{selectedProduct.brand?.name}</span></div>
              {selectedProduct.size?.name && (
                <div className="text-muted-foreground">Size: <span className="font-bold text-primary">{formatSizeInches(selectedProduct.size.name) || selectedProduct.size.name}</span></div>
              )}
              <div className="text-muted-foreground">Category: <span className="font-medium text-foreground">{selectedProduct.category?.name}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Quantity & Amount */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground/80 ml-1">Quantity <span className="text-destructive">*</span></label>
          <Input type="number" placeholder="Enter quantity" value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="rounded-2xl bg-muted/20 border-border/40 h-11" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground/80 ml-1">Amount</label>
          <Input type="number" placeholder="Enter amount" value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="rounded-2xl bg-muted/20 border-border/40 h-11" />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-visible">
        <div className="space-y-2 overflow-visible">
          <label className="text-sm font-bold text-foreground/80 ml-1">Order Date</label>
          <DatePicker date={formData.orderDate} onChange={(d) => setFormData({ ...formData, orderDate: d ? d.toISOString().split('T')[0] : '' })} />
        </div>
        <div className="space-y-2 overflow-visible">
          <label className="text-sm font-bold text-foreground/80 ml-1">Expected Date</label>
          <DatePicker date={formData.expectedDate} onChange={(d) => setFormData({ ...formData, expectedDate: d ? d.toISOString().split('T')[0] : '' })} />
        </div>
      </div>

      {/* Batch Name */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-foreground/80 ml-1">Batch Name</label>
        <Input placeholder="Enter batch name" value={formData.batchName}
          onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
          className="rounded-2xl bg-muted/20 border-border/40 h-11" />
      </div>

      <div className="flex flex-col gap-3 pt-2">
        {!order && (
          <Button type="button" variant="outline" onClick={handleAddMore} disabled={!isCurrentValid}
            className="w-full rounded-2xl h-11 border-dashed border-primary/40 text-primary hover:bg-primary/5 font-bold gap-2">
            <Plus className="h-4 w-4" />Add More
          </Button>
        )}
        <div className="flex gap-3">
          <Button type="submit" disabled={loading || (!isCurrentValid && entries.length === 0)} className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20">
            {submitLabel}
          </Button>
          <Button type="button" variant="outline" onClick={onSuccess} className="flex-1 rounded-2xl h-12 border-border/50 font-bold">Cancel</Button>
        </div>
      </div>
    </form>
  )
}
