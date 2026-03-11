'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Ruler } from 'lucide-react'

export default function SizesPage() {
  const [sizes, setSizes] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [filteredCategories, setFilteredCategories] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', length: '', width: '', brandId: '', categoryId: '' })

  useEffect(() => {
    fetchSizes()
    fetchBrands()
    fetchCategories()
  }, [])

  const fetchSizes = async () => {
    try {
      const response = await fetch('/api/sizes')
      const data = await response.json()
      setSizes(data.sizes || [])
    } catch (error) {
      console.error('Error fetching sizes:', error)
    }
  }

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands')
      const data = await response.json()
      setBrands((data.brands || []).filter((b: any) => b.isActive))
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleBrandChange = (brandId: string) => {
    setFormData({ ...formData, brandId, categoryId: '' })
    setFilteredCategories(categories.filter(c => c.brandId === brandId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch('/api/sizes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (response.ok) {
      const newSize = await response.json()
      setSizes([newSize, ...sizes])
      setIsDialogOpen(false)
      setFormData({ name: '', length: '', width: '', brandId: '', categoryId: '' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sizes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Size
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Size</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select value={formData.brandId} onValueChange={handleBrandChange} required>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })} required disabled={!formData.brandId}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Length (mm)" type="number" value={formData.length} onChange={(e) => setFormData({ ...formData, length: e.target.value, name: `${e.target.value}x${formData.width}` })} required />
                <Input placeholder="Width (mm)" type="number" value={formData.width} onChange={(e) => setFormData({ ...formData, width: e.target.value, name: `${formData.length}x${e.target.value}` })} required />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sizes.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Ruler className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No sizes found. Add your first size to get started.</p>
          </div>
        ) : (
          sizes.map((size) => (
            <Card key={size.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  {size.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Brand: {size.brand?.name}</p>
                <p className="text-sm text-gray-600">Category: {size.category?.name}</p>
                <p className="text-sm text-gray-600">Dimensions: {size.length}mm x {size.width}mm</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
