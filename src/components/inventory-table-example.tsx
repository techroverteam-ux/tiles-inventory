"use client"

import { ResponsiveTable } from "@/components/ui/responsive-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye } from "lucide-react"

// Example inventory data structure
interface InventoryItem {
  id: string
  name: string
  category: string
  stock: number
  price: number
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
  lastUpdated: string
}

// Example usage component
export function InventoryTable({ data }: { data: InventoryItem[] }) {
  const columns = [
    {
      key: 'name',
      label: 'Product Name',
    },
    {
      key: 'category',
      label: 'Category',
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (value: number) => (
        <span className={`font-medium ${value <= 10 ? 'text-red-600' : 'text-green-600'}`}>
          {value}
        </span>
      )
    },
    {
      key: 'price',
      label: 'Price',
      render: (value: number) => `₹${value.toLocaleString()}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge 
          variant={value === 'in-stock' ? 'default' : value === 'low-stock' ? 'secondary' : 'destructive'}
          className="text-xs"
        >
          {value.replace('-', ' ').toUpperCase()}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: InventoryItem) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const handleRowClick = (row: InventoryItem) => {
    console.log('Row clicked:', row)
    // Handle row click - navigate to detail page, open modal, etc.
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">Inventory Items</h2>
        <Button className="w-full sm:w-auto">Add New Item</Button>
      </div>
      
      <ResponsiveTable 
        columns={columns}
        data={data}
        onRowClick={handleRowClick}
        className="bg-card rounded-lg shadow-sm"
      />
    </div>
  )
}

// Example data for testing
export const sampleInventoryData: InventoryItem[] = [
  {
    id: '1',
    name: 'Ceramic Floor Tiles 60x60',
    category: 'Floor Tiles',
    stock: 150,
    price: 450,
    status: 'in-stock',
    lastUpdated: '2024-01-15'
  },
  {
    id: '2',
    name: 'Marble Wall Tiles 30x30',
    category: 'Wall Tiles',
    stock: 8,
    price: 850,
    status: 'low-stock',
    lastUpdated: '2024-01-14'
  },
  {
    id: '3',
    name: 'Granite Kitchen Tiles',
    category: 'Kitchen Tiles',
    stock: 0,
    price: 1200,
    status: 'out-of-stock',
    lastUpdated: '2024-01-13'
  }
]
