import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye, Package } from "lucide-react"

interface InventoryMobileCardProps {
  item: {
    id: string
    name: string
    category: string
    stock: number
    price: number
    status: 'in-stock' | 'low-stock' | 'out-of-stock'
    lastUpdated: string
  }
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  className?: string
}

export function InventoryMobileCard({ 
  item, 
  onView, 
  onEdit, 
  onDelete, 
  className 
}: InventoryMobileCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
      case 'low-stock': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
      case 'out-of-stock': return 'bg-red-500/15 text-red-600 dark:text-red-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-600 dark:text-red-400'
    if (stock <= 10) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  return (
    <div className={cn(
      "bg-card text-card-foreground rounded-lg border border-border p-4 shadow-sm hover:shadow-md transition-shadow",
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-medium text-foreground text-sm leading-tight">
              {item.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {item.category}
            </p>
          </div>
        </div>
        <Badge className={cn("text-xs px-2 py-1", getStatusColor(item.status))}>
          {item.status.replace('-', ' ').toUpperCase()}
        </Badge>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Stock</p>
          <p className={cn("text-lg font-semibold", getStockColor(item.stock))}>
            {item.stock}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Price</p>
          <p className="text-lg font-semibold text-foreground">
            ₹{item.price.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Updated: {new Date(item.lastUpdated).toLocaleDateString()}
        </p>
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0"
            onClick={() => onView?.(item.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0"
            onClick={() => onEdit?.(item.id)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            onClick={() => onDelete?.(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}