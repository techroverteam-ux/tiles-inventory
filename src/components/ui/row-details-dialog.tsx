import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ZoomIn } from 'lucide-react'

interface RowDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  data: any
  imageUrl?: string
  onImageClick?: (src: string) => void
}

function formatKeyName(key: string) {
  // Convert camelCase or snake_case to Title Case
  const words = key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .split(' ')

  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function formatDateIfApplicable(value: any) {
  if (typeof value === 'string') {
    // Check if it's an ISO date string
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    if (dateRegex.test(value)) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date.toLocaleString()
      }
    }
  }
  return value
}

function renderValue(value: any): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>
  }

  if (typeof value === 'boolean') {
    return (
      <Badge variant={value ? 'default' : 'secondary'}>
        {value ? 'Yes' : 'No'}
      </Badge>
    )
  }

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-muted-foreground">Empty List</span>
      return (
        <div className="flex flex-col gap-2 mt-1">
          {value.map((item, index) => (
            <div key={index} className="p-2 border rounded-md bg-muted/20">
              {renderValue(item)}
            </div>
          ))}
        </div>
      )
    }

    // It's a regular object
    const entries = Object.entries(value)
    if (entries.length === 0) return <span className="text-muted-foreground">Empty</span>

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 w-full bg-muted/10 p-2 rounded-md border">
        {entries.map(([k, v]) => (
          <div key={k} className="flex flex-col text-sm break-words">
            <span className="font-semibold text-muted-foreground text-xs">{formatKeyName(k)}</span>
            <span>{renderValue(v)}</span>
          </div>
        ))}
      </div>
    )
  }

  const formattedValue = formatDateIfApplicable(value)
  return <span className="break-words">{String(formattedValue)}</span>
}

export function RowDetailsDialog({ open, onOpenChange, title, data, imageUrl, onImageClick }: RowDetailsDialogProps) {
  if (!data) return null

  // Ensure data is an object before getting entries
  const entries = typeof data === 'object' && data !== null && !Array.isArray(data)
    ? Object.entries(data).filter(([key]) => !key.startsWith('_') && key !== 'imageUrl' && key !== 'product') // hide meta fields and handled fields
    : [['Value', data]]

  // Fallback for imageUrl if not passed explicitly but exists in data
  const displayImageUrl = imageUrl || data?.imageUrl || data?.product?.imageUrl

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 bg-card overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {displayImageUrl && (
            <div 
              className="w-full h-64 md:h-80 relative bg-muted flex items-center justify-center border-b cursor-zoom-in group"
              onClick={() => onImageClick && onImageClick(displayImageUrl)}
            >
              <img 
                src={displayImageUrl} 
                alt={title}
                className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10 drop-shadow-lg" />
              </div>
            </div>
          )}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {entries.map(([key, value]) => (
                <div key={key} className={`flex flex-col space-y-1 ${typeof value === 'object' && value !== null ? 'col-span-1 md:col-span-2' : ''}`}>
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {formatKeyName(key)}
                  </span>
                  <div className="text-base text-card-foreground p-1.5 rounded-md bg-muted/5 border shadow-sm">
                    {renderValue(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
