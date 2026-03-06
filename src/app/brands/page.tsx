'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, Building } from 'lucide-react'

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

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/brands')
      const data = await response.json()
      setBrands(data)
    } catch (error) {
      console.error('Error fetching brands:', error)
      // Mock data fallback
      setBrands([
        {
          id: '1',
          name: 'Kajaria',
          description: 'Leading ceramic and vitrified tiles manufacturer',
          contactInfo: 'contact@kajaria.com',
          isActive: true,
          createdAt: '2024-01-01',
          _count: { products: 45 }
        },
        {
          id: '2',
          name: 'Somany',
          description: 'Premium tiles and sanitaryware brand',
          contactInfo: 'info@somany.com',
          isActive: true,
          createdAt: '2024-01-02',
          _count: { products: 32 }
        },
        {
          id: '3',
          name: 'Johnson',
          description: 'Innovative tile solutions',
          contactInfo: 'support@johnson.com',
          isActive: true,
          createdAt: '2024-01-03',
          _count: { products: 28 }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(search.toLowerCase()) ||
    brand.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Brands</h1>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Brand
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{brands.length}</div>
                <p className="text-sm text-gray-600">Total Brands</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {brands.filter(b => b.isActive).length}
            </div>
            <p className="text-sm text-gray-600">Active Brands</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {brands.reduce((total, brand) => total + (brand._count?.products || 0), 0)}
            </div>
            <p className="text-sm text-gray-600">Total Products</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
            <Card key={brand.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{brand.name}</CardTitle>
                  <Badge variant={brand.isActive ? "default" : "secondary"}>
                    {brand.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {brand.description && (
                    <p className="text-sm text-gray-600">{brand.description}</p>
                  )}
                  
                  {brand.contactInfo && (
                    <p className="text-sm text-blue-600">{brand.contactInfo}</p>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-sm text-gray-500">
                      {brand._count?.products || 0} products
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
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
        <Card>
          <CardContent className="p-8 text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No brands found</h3>
            <p className="text-gray-500 mb-4">
              {search ? 'Try adjusting your search terms.' : 'Get started by adding your first brand.'}
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Brand
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}