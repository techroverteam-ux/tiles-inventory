'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/contexts/ToastContext'
import { DataView } from '@/components/ui/data-view'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Size {
  id: string
  name: string
  description?: string
  length?: number
  width?: number
  brandId: string
  categoryId: string
  brand: { name: string }
  category: { name: string }
  isActive: boolean
  createdAt: string
  _count?: {
    products: number
  }
}

interface Brand {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
}

interface FormData {
  name: string
  description: string
  length: string
  width: string
  brandId: string
  categoryId: string
}

export default function SizesPage() {
  const [sizes, setSizes] = useState<Size[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showForm, setShowForm] = useState(false)
  const [editingSize, setEditingSize] = useState<Size | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    length: '',
    width: '',
    brandId: '',
    categoryId: ''
  })
  const [submitting, setSubmitting] = useState(false)
  
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchSizes()
    fetchBrands()
  }, [])

  useEffect(() => {
    if (formData.brandId) {
      fetchCategoriesByBrand(formData.brandId)
    } else {
      setFilteredCategories([])
    }
  }, [formData.brandId])

  const fetchSizes = async () => {
    try {
      const response = await fetch('/api/sizes')
      if (response.ok) {
        const data = await response.json()
        setSizes(data.sizes || [])
      } else {
        showToast('Failed to fetch sizes', 'error')
      }
    } catch (error) {
      showToast('Error fetching sizes', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands')
      if (response.ok) {
        const data = await response.json()
        setBrands(data.brands?.filter((b: Brand & { isActive: boolean }) => b.isActive) || [])
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

  const fetchCategoriesByBrand = async (brandId: string) => {
    try {
      const response = await fetch(`/api/categories?brandId=${brandId}`)
      const data = await response.json()
      setFilteredCategories(data.categories?.filter((c: any) => c.isActive) || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.brandId || !formData.categoryId) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    setSubmitting(true)
    try {
      const url = editingSize ? `/api/sizes/${editingSize.id}` : '/api/sizes'
      const method = editingSize ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          length: formData.length ? parseFloat(formData.length) : undefined,
          width: formData.width ? parseFloat(formData.width) : undefined
        })
      })

      if (response.ok) {
        showToast(
          editingSize ? 'Size updated successfully!' : 'Size created successfully!',
          'success'
        )
        setShowForm(false)
        setEditingSize(null)
        resetForm()
        fetchSizes()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to save size', 'error')
      }
    } catch (error) {
      showToast('Error saving size', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      length: '',
      width: '',
      brandId: '',
      categoryId: ''
    })
    setFilteredCategories([])
  }

  const handleEdit = (size: Size) => {
    setEditingSize(size)
    setFormData({
      name: size.name,
      description: size.description || '',
      length: size.length?.toString() || '',
      width: size.width?.toString() || '',
      brandId: size.brandId,
      categoryId: size.categoryId
    })
    setShowForm(true)
  }

  const handleDelete = async (size: Size) => {
    if (!confirm(`Are you sure you want to delete "${size.name}"?`)) return

    try {
      const response = await fetch(`/api/sizes/${size.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('Size deleted successfully!', 'success')
        fetchSizes()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to delete size', 'error')
      }
    } catch (error) {
      showToast('Error deleting size', 'error')
    }
  }

  const renderGridItem = (size: Size) => (
    <Card className="h-full hover:shadow-lg transition-shadow bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-card-foreground">
              {size.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {size.brand.name} - {size.category.name}
            </p>
          </div>
          <Badge variant={size.isActive ? 'default' : 'secondary'}>
            {size.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {size.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {size.description}
          </p>
        )}
        {(size.length || size.width) && (
          <div className="text-sm text-muted-foreground mb-3">
            Dimensions: {size.length || '?'} x {size.width || '?'} mm
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>Products: {size._count?.products || 0}</span>
          <span>Created: {new Date(size.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(size)}
            className="flex-1 border-border text-foreground hover:bg-accent"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(size)}
            className="flex-1 text-destructive hover:text-destructive border-border hover:bg-destructive/10"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderListRow = (size: Size) => (
    <>
      <td className="px-4 py-3">
        <div className="font-medium text-foreground">{size.name}</div>
        <div className="text-sm text-muted-foreground">
          {size.length && size.width ? `${size.length} x ${size.width} mm` : 'No dimensions'}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm">
          <div className="text-foreground">{size.brand.name}</div>
          <div className="text-muted-foreground">{size.category.name}</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-muted-foreground">
          {size.description || 'No description'}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={size.isActive ? 'default' : 'secondary'}>
          {size.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {size._count?.products || 0}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {new Date(size.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(size)}
            className="text-foreground hover:bg-accent"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(size)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Delete
          </Button>
        </div>
      </td>
    </>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sizes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <DataView
        items={sizes}
        view={view}
        onViewChange={setView}
        title="Sizes"
        actions={
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingSize(null)
                  resetForm()
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                Add Size
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-card-foreground font-semibold">
                  {editingSize ? 'Edit Size' : 'Add New Size'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., 600x600mm"
                      required
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Brand *</label>
                    <select
                      value={formData.brandId}
                      onChange={(e) => setFormData({ ...formData, brandId: e.target.value, categoryId: '' })}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="">Select a brand</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Category *</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      disabled={!formData.brandId}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground disabled:opacity-50"
                    >
                      <option value="">Select a category</option>
                      {filteredCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter description (optional)"
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Length (mm)</label>
                    <Input
                      type="number"
                      value={formData.length}
                      onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                      placeholder="Enter length in mm"
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Width (mm)</label>
                    <Input
                      type="number"
                      value={formData.width}
                      onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                      placeholder="Enter width in mm"
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={submitting} 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                  >
                    {submitting ? 'Saving...' : editingSize ? 'Update' : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="border-border text-foreground hover:bg-accent font-medium"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
        gridProps={{
          renderItem: renderGridItem,
          columns: 3
        }}
        listProps={{
          headers: ['Name & Dimensions', 'Brand & Category', 'Description', 'Status', 'Products', 'Created', 'Actions'],
          renderRow: renderListRow
        }}
      />
    </div>
  )
}