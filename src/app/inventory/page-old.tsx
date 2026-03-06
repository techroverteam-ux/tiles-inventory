'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Download, Package, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface InventoryItem {
  id: string
  product: {
    name: string
    code: string
    brand: { name: string }
    category: { name: string }
    sqftPerBox: number
  }
  location: { name: string }
  batchNumber: string
  shade?: string
  quantity: number
  purchasePrice: number
  sellingPrice: number
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('')

  useEffect(() => {
    // Mock data - replace with actual API call
    setInventory([
      {
        id: '1',
        product: {
          name: 'Ceramic Floor Tile 60x60',
          code: 'CFT6060',
          brand: { name: 'Kajaria' },
          category: { name: 'Floor Tiles' },
          sqftPerBox: 25.0
        },
        location: { name: 'Main Warehouse' },
        batchNumber: 'B001',
        shade: 'Light Grey',
        quantity: 45,
        purchasePrice: 450,
        sellingPrice: 550
      },
      {
        id: '2',
        product: {
          name: 'Porcelain Wall Tile 30x30',
          code: 'PWT3030',
          brand: { name: 'Somany' },
          category: { name: 'Wall Tiles' },
          sqftPerBox: 15.0
        },
        location: { name: 'Showroom' },
        batchNumber: 'B002',
        shade: 'White',
        quantity: 8,
        purchasePrice: 320,
        sellingPrice: 420
      }
    ])
    setLoading(false)
  }, [])

  const getTotalValue = () => {
    return inventory.reduce((total, item) => total + (item.quantity * item.sellingPrice), 0)
  }

  const getLowStockItems = () => {
    return inventory.filter(item => item.quantity < 20).length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{inventory.length}</div>
                <p className="text-sm text-gray-600">Total Batches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{getLowStockItems()}</div>
                <p className="text-sm text-gray-600">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{formatCurrency(getTotalValue())}</div>
            <p className="text-sm text-gray-600">Total Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {inventory.reduce((total, item) => total + item.quantity, 0)}
            </div>
            <p className="text-sm text-gray-600">Total Boxes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock by Batch</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Product</th>
                    <th className="text-left p-4 font-medium">Batch</th>
                    <th className="text-left p-4 font-medium">Location</th>
                    <th className="text-left p-4 font-medium">Shade</th>
                    <th className="text-left p-4 font-medium">Stock</th>
                    <th className="text-left p-4 font-medium">Purchase Price</th>
                    <th className="text-left p-4 font-medium">Selling Price</th>
                    <th className="text-left p-4 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.product.brand.name} • {item.product.code}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {item.batchNumber}
                        </code>
                      </td>
                      <td className="p-4">{item.location.name}</td>
                      <td className="p-4">
                        {item.shade ? (
                          <Badge variant="outline">{item.shade}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={item.quantity < 20 ? "destructive" : "default"}
                          >
                            {item.quantity} boxes
                          </Badge>
                          {item.quantity < 20 && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {(item.quantity * item.product.sqftPerBox).toFixed(0)} sq ft
                        </p>
                      </td>
                      <td className="p-4">{formatCurrency(item.purchasePrice)}</td>
                      <td className="p-4">{formatCurrency(item.sellingPrice)}</td>
                      <td className="p-4 font-medium">
                        {formatCurrency(item.quantity * item.sellingPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}