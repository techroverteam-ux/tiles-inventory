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

interface Brand {
  id: string
  name: string
  description?: string
  contactInfo?: string
  isActive: boolean
  createdAt: string
  _count?: {
    categories: number
    products: number
  }
}

interface FormData {
  name: string
  description: string
  contactInfo: string
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showForm, setShowForm] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    contactInfo: ''
  })
  const [submitting, setSubmitting] = useState(false)
  
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands')
      if (response.ok) {
        const data = await response.json()
        setBrands(data.brands || [])
      } else {
        showToast('Failed to fetch brands', 'error')
      }
    } catch (error) {
      showToast('Error fetching brands', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      showToast('Please enter a brand name', 'error')
      return
    }

    setSubmitting(true)
    try {
      const url = editingBrand ? `/api/brands/${editingBrand.id}` : '/api/brands'
      const method = editingBrand ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showToast(
          editingBrand ? 'Brand updated successfully!' : 'Brand created successfully!',
          'success'
        )
        setShowForm(false)
        setEditingBrand(null)
        setFormData({ name: '', description: '', contactInfo: '' })
        fetchBrands()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to save brand', 'error')
      }
    } catch (error) {
      showToast('Error saving brand', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    setFormData({
      name: brand.name,
      description: brand.description || '',
      contactInfo: brand.contactInfo || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (brand: Brand) => {
    if (!confirm(`Are you sure you want to delete "${brand.name}"?`)) return

    try {
      const response = await fetch(`/api/brands/${brand.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('Brand deleted successfully!', 'success')
        fetchBrands()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to delete brand', 'error')
      }
    } catch (error) {
      showToast('Error deleting brand', 'error')
    }
  }

  const renderGridItem = (brand: Brand) => (
    <Card className="h-full hover:shadow-lg transition-shadow bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-card-foreground">
              {brand.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {brand.contactInfo || 'No contact info'}
            </p>
          </div>
          <Badge variant={brand.isActive ? 'default' : 'secondary'}>
            {brand.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {brand.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {brand.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>Categories: {brand._count?.categories || 0}</span>
          <span>Products: {brand._count?.products || 0}</span>
        </div>
        <div className="text-xs text-muted-foreground mb-4">
          Created: {new Date(brand.createdAt).toLocaleDateString()}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(brand)}
            className="flex-1 border-border text-foreground hover:bg-accent"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(brand)}
            className="flex-1 text-destructive hover:text-destructive border-border hover:bg-destructive/10"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderListRow = (brand: Brand) => (
    <>
      <td className="px-4 py-3">
        <div className="font-medium text-foreground">{brand.name}</div>
        <div className="text-sm text-muted-foreground">{brand.contactInfo || 'No contact'}</div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-muted-foreground">
          {brand.description || 'No description'}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={brand.isActive ? 'default' : 'secondary'}>
          {brand.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {brand._count?.categories || 0}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {brand._count?.products || 0}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {new Date(brand.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(brand)}
            className="text-foreground hover:bg-accent"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(brand)}
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
          <p className="text-muted-foreground">Loading brands...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <DataView
        items={brands}
        view={view}
        onViewChange={setView}
        title="Brands"
        actions={
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingBrand(null)
                  setFormData({ name: '', description: '', contactInfo: '' })
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                Add Brand
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-card-foreground font-semibold">
                  {editingBrand ? 'Edit Brand' : 'Add New Brand'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter brand name"
                    required
                    className="bg-background border-input text-foreground"
                  />
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
                <div>
                  <label className="text-sm font-medium text-foreground">Contact Info</label>
                  <Input
                    value={formData.contactInfo}
                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                    placeholder="Enter contact information (optional)"
                    className="bg-background border-input text-foreground"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={submitting} 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                  >
                    {submitting ? 'Saving...' : editingBrand ? 'Update' : 'Create'}
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
          headers: ['Name & Contact', 'Description', 'Status', 'Categories', 'Products', 'Created', 'Actions'],
          renderRow: renderListRow
        }}
      />
    </div>
  )
}