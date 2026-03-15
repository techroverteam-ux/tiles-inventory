'use client'

import { useState, useCallback } from 'react'
import { Plus, X, ChevronRight, Users, Palette, Ruler, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type EntityType = 'brand' | 'category' | 'size' | 'location' | null

interface Brand { id: string; name: string }
interface Category { id: string; name: string; brandId: string }

interface QuickAddPanelProps {
  onSuccess?: (type: EntityType, data: any) => void
}

export function QuickAddPanel({ onSuccess }: QuickAddPanelProps) {
  const [open, setOpen] = useState(false)
  const [activeType, setActiveType] = useState<EntityType>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [brandId, setBrandId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [address, setAddress] = useState('')

  // Data for dropdowns
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const resetForm = () => {
    setName('')
    setDescription('')
    setBrandId('')
    setCategoryId('')
    setLength('')
    setWidth('')
    setAddress('')
    setError('')
    setSuccess('')
  }

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch('/api/brands?limit=100&isActive=true')
      if (res.ok) {
        const data = await res.json()
        setBrands(data.brands || [])
      }
    } catch {}
  }, [])

  const fetchCategories = useCallback(async (bId?: string) => {
    try {
      const params = new URLSearchParams({ limit: '200', isActive: 'true' })
      if (bId) params.set('brandId', bId)
      const res = await fetch(`/api/categories?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch {}
  }, [])

  const handleOpen = async (type: EntityType) => {
    resetForm()
    setActiveType(type)
    if (type === 'category' || type === 'size') {
      await fetchBrands()
    }
    if (type === 'size') {
      await fetchCategories()
    }
  }

  const handleBrandChange = async (val: string) => {
    setBrandId(val)
    setCategoryId('')
    if (activeType === 'size') {
      await fetchCategories(val)
    }
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    let endpoint = ''
    let body: any = { name: name.trim(), description: description.trim() || undefined, isActive: true }

    switch (activeType) {
      case 'brand':
        endpoint = '/api/brands'
        break
      case 'category':
        if (!brandId) { setError('Brand is required'); return }
        endpoint = '/api/categories'
        body = { ...body, brandId }
        break
      case 'size':
        if (!brandId) { setError('Brand is required'); return }
        if (!categoryId) { setError('Category is required'); return }
        endpoint = '/api/sizes'
        body = { ...body, brandId, categoryId, length: length || undefined, width: width || undefined }
        break
      case 'location':
        endpoint = '/api/locations'
        body = { ...body, address: address.trim() || undefined }
        break
      default:
        return
    }

    setLoading(true)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(`${activeType?.charAt(0).toUpperCase()}${activeType?.slice(1)} "${name}" created!`)
        resetForm()
        onSuccess?.(activeType, data)
      } else {
        setError(data.error || 'Failed to create')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const entities: { type: EntityType; label: string; icon: React.ReactNode; color: string }[] = [
    { type: 'brand', label: 'Brand', icon: <Users className="h-5 w-5" />, color: 'bg-blue-500' },
    { type: 'category', label: 'Category', icon: <Palette className="h-5 w-5" />, color: 'bg-purple-500' },
    { type: 'size', label: 'Size', icon: <Ruler className="h-5 w-5" />, color: 'bg-green-500' },
    { type: 'location', label: 'Location', icon: <MapPin className="h-5 w-5" />, color: 'bg-orange-500' },
  ]

  const filteredCategories = brandId
    ? categories.filter(c => c.brandId === brandId)
    : categories

  return (
    <>
      {/* Trigger Button (desktop header) */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => { setOpen(true); setActiveType(null) }}
        className="hidden sm:flex text-xs px-3 py-2 border-border text-foreground hover:bg-accent"
      >
        <Plus className="h-4 w-4 mr-1" />
        <span className="hidden md:inline">Quick Add</span>
      </Button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-foreground/40 z-50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            {activeType && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setActiveType(null); resetForm() }}>
                <ChevronRight className="h-4 w-4 rotate-180" />
              </Button>
            )}
            <h2 className="text-lg font-semibold text-foreground">
              {activeType ? `Add ${activeType.charAt(0).toUpperCase()}${activeType.slice(1)}` : 'Quick Add'}
            </h2>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!activeType ? (
            /* Entity type selection */
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-4">What would you like to add?</p>
              {entities.map(({ type, label, icon, color }) => (
                <button
                  key={type}
                  onClick={() => handleOpen(type)}
                  className="w-full flex items-center gap-3 p-4 rounded-lg bg-muted/40 hover:bg-accent transition-colors text-left"
                >
                  <div className={`${color} text-white p-2 rounded-lg`}>
                    {icon}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">Add a new {label.toLowerCase()}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </button>
              ))}
            </div>
          ) : (
            /* Form */
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-600 dark:text-green-400">
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Name *</label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={`Enter ${activeType} name`}
                  disabled={loading}
                />
              </div>

              {activeType !== 'location' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Optional description"
                    disabled={loading}
                  />
                </div>
              )}

              {(activeType === 'category' || activeType === 'size') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Brand *</label>
                  <Select value={brandId} onValueChange={handleBrandChange} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {activeType === 'size' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Category *</label>
                  <Select value={categoryId} onValueChange={setCategoryId} disabled={loading || !brandId}>
                    <SelectTrigger>
                      <SelectValue placeholder={brandId ? 'Select category' : 'Select brand first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {activeType === 'size' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Length (mm)</label>
                    <Input
                      type="number"
                      value={length}
                      onChange={e => setLength(e.target.value)}
                      placeholder="e.g. 600"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Width (mm)</label>
                    <Input
                      type="number"
                      value={width}
                      onChange={e => setWidth(e.target.value)}
                      placeholder="e.g. 300"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {activeType === 'location' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Address</label>
                  <Input
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Optional address"
                    disabled={loading}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel Footer */}
        {activeType && (
          <div className="p-4 border-t border-border flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setActiveType(null); resetForm() }}
              disabled={loading}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Saving…' : 'Save'}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
