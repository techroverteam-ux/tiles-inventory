'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Edit, Trash2, Building } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'

interface Brand {
  id: string
  name: string
  description?: string
  contactInfo?: string
  isActive: boolean
  createdAt: string
  _count?: {
    products: number
  }
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [formData, setFormData] = useState({ name: '' })
  const { showToast } = useToast()

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/brands')
      const data = await response.json()
      setBrands(data.brands || [])
    } catch (error) {
      console.error('Error fetching brands:', error)
      showToast('Failed to load brands', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingBrand ? `/api/brands/${editingBrand.id}` : '/api/brands'
      const method = editingBrand ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name }),
      })

      if (response.ok) {
        fetchBrands()
        setIsDialogOpen(false)
        setEditingBrand(null)
        setFormData({ name: '' })
        showToast(editingBrand ? 'Brand updated successfully!' : 'Brand created successfully!', 'success')
      } else {
        showToast('Error saving brand. Please try again.', 'error')
      }
    } catch (error) {
      console.error('Error saving brand:', error)
      showToast('Error saving brand. Please try again.', 'error')
    }
  }

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    setFormData({ name: brand.name })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      try {
        const response = await fetch(`/api/brands/${id}`, { method: 'DELETE' })
        if (response.ok) {
          fetchBrands()
          showToast('Brand deleted successfully!', 'success')
        } else {
          showToast('Error deleting brand. Please try again.', 'error')
        }
      } catch (error) {
        console.error('Error deleting brand:', error)
        showToast('Error deleting brand. Please try again.', 'error')
      }
    }
  }

  const filteredBrands = brands.filter(brand =>
    brand.isActive && (
      brand.name.toLowerCase().includes(search.toLowerCase()) ||
      brand.description?.toLowerCase().includes(search.toLowerCase())
    )
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Brands</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => {
              setEditingBrand(null)
              setFormData({ name: '' })
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Brand
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">{editingBrand ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Brand name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingBrand ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{filteredBrands.length}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Brands</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {filteredBrands.length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Brands</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {brands.reduce((total, brand) => total + (brand._count?.products || 0), 0)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
            <Input
              placeholder="Search brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Brands Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBrands.map((brand) => (
            <Card key={brand.id} className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-gray-900 dark:text-gray-100">{brand.name}</CardTitle>
                  <Badge variant={brand.isActive ? "default" : "secondary"}>
                    {brand.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {brand.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{brand.description}</p>
                  )}
                  
                  {brand.contactInfo && (
                    <p className="text-sm text-blue-600 dark:text-blue-400">{brand.contactInfo}</p>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {brand._count?.products || 0} products
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(brand)}>
                        <Edit className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(brand.id)}>
                        <Trash2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredBrands.length === 0 && !loading && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-8 text-center">
            <Building className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No brands found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {search ? 'Try adjusting your search terms.' : 'Get started by adding your first brand.'}
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Brand
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}