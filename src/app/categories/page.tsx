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
import { LoadingPage } from '@/components/ui/skeleton'

interface Category {
  id: string
  name: string
  description?: string
  brandId: string
  brand: {
    name: string
  }
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brandId: ''
  })
  const [submitting, setSubmitting] = useState(false)
  
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchCategories()
    fetchBrands()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      } else {
        showToast('Failed to fetch categories', 'error')
      }
    } catch (error) {
      showToast('Error fetching categories', 'error')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.brandId) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    setSubmitting(true)
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
      const method = editingCategory ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showToast(
          editingCategory ? 'Category updated successfully!' : 'Category created successfully!',
          'success'
        )
        setShowForm(false)
        setEditingCategory(null)
        setFormData({ name: '', description: '', brandId: '' })
        fetchCategories()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to save category', 'error')
      }
    } catch (error) {
      showToast('Error saving category', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      brandId: category.brandId
    })
    setShowForm(true)
  }

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('Category deleted successfully!', 'success')
        fetchCategories()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to delete category', 'error')
      }
    } catch (error) {
      showToast('Error deleting category', 'error')
    }
  }

  const renderGridItem = (category: Category) => (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-card-foreground">
              {category.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {category.brand.name}
            </p>
          </div>
          <Badge variant={category.isActive ? 'default' : 'secondary'}>
            {category.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {category.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {category.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>Products: {category._count?.products || 0}</span>
          <span>Created: {new Date(category.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(category)}
            className="flex-1"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(category)}
            className="flex-1 text-destructive hover:text-destructive"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderListRow = (category: Category) => (
    <>
      <td className="px-4 py-3">
        <div className="font-medium text-foreground">{category.name}</div>
        <div className="text-sm text-muted-foreground">{category.brand.name}</div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-muted-foreground">
          {category.description || 'No description'}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={category.isActive ? 'default' : 'secondary'}>
          {category.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {category._count?.products || 0}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {new Date(category.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(category)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(category)}
            className="text-destructive hover:text-destructive"
          >
            Delete
          </Button>
        </div>
      </td>
    </>
  )

  if (loading) {
    return <LoadingPage view={view} title="Categories" items={6} columns={3} />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <DataView
        items={categories}
        view={view}
        onViewChange={setView}
        title="Categories"
        actions={
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingCategory(null)
                setFormData({ name: '', description: '', brandId: '' })
              }}>
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter category name"
                    required
                    className="bg-background border-input text-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Brand *</label>
                  <select
                    value={formData.brandId}
                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
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
                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter description (optional)"
                    className="bg-background border-input text-foreground"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground">
                    {submitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="border-border text-foreground"
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
          headers: ['Name & Brand', 'Description', 'Status', 'Products', 'Created', 'Actions'],
          renderRow: renderListRow
        }}
      />
    </div>
  )
}