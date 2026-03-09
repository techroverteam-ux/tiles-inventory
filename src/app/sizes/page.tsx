'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Edit, Trash2, Ruler } from 'lucide-react'

interface Size {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  _count?: {
    products: number
  }
}

export default function SizesPage() {
  const [sizes, setSizes] = useState<Size[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSize, setEditingSize] = useState<Size | null>(null)
  const [formData, setFormData] = useState({ name: '' })

  useEffect(() => {
    fetchSizes()
  }, [])

  const fetchSizes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sizes')
      const data = await response.json()
      setSizes(data.sizes || [])
    } catch (error) {
      console.error('Error fetching sizes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingSize ? `/api/sizes/${editingSize.id}` : '/api/sizes'
      const method = editingSize ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name }),
      })

      if (response.ok) {
        fetchSizes()
        setIsDialogOpen(false)
        setEditingSize(null)
        setFormData({ name: '' })
        alert(editingSize ? 'Size updated successfully!' : 'Size created successfully!')
      } else {
        alert('Error saving size. Please try again.')
      }
    } catch (error) {
      console.error('Error saving size:', error)
      alert('Error saving size. Please try again.')
    }
  }

  const handleEdit = (size: Size) => {
    setEditingSize(size)
    setFormData({ name: size.name })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this size?')) {
      try {
        const response = await fetch(`/api/sizes/${id}`, { method: 'DELETE' })
        if (response.ok) {
          fetchSizes()
          alert('Size deleted successfully!')
        } else {
          alert('Error deleting size. Please try again.')
        }
      } catch (error) {
        console.error('Error deleting size:', error)
        alert('Error deleting size. Please try again.')
      }
    }
  }

  const filteredSizes = sizes.filter(size =>
    size.isActive && size.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Sizes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => {
              setEditingSize(null)
              setFormData({ name: '' })
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Size
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">{editingSize ? 'Edit Size' : 'Add Size'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Size (e.g., 12x12, 24x24, 600x600)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingSize ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{sizes.length}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sizes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {sizes.filter(s => s.isActive).length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Sizes</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {sizes.reduce((total, size) => total + (size._count?.products || 0), 0)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
            <Input
              placeholder="Search sizes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSizes.map((size) => (
            <Card key={size.id} className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-gray-900 dark:text-gray-100">{size.name}</CardTitle>
                  <Badge variant={size.isActive ? "default" : "secondary"}>
                    {size.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {size._count?.products || 0} products
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(size)}>
                      <Edit className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(size.id)}>
                      <Trash2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredSizes.length === 0 && !loading && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-8 text-center">
            <Ruler className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No sizes found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {search ? 'Try adjusting your search terms.' : 'Get started by adding your first size.'}
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Size
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}