import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DetailField {
  label: string
  value: any
  variant?: 'text' | 'badge' | 'date' | 'number' | 'currency' | 'user'
}

interface RowDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  data: any
  fields?: DetailField[]
  imageUrl?: string
  locationImageUrl?: string
  locationName?: string
  onImageClick?: (src: string) => void
}

function formatKeyName(key: string) {
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
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    if (dateRegex.test(value)) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0')
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`
      }
    }
  }
  return value
}

function renderValue(value: any, variant?: string): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground italic text-xs">Not specified</span>
  }

  if (variant === 'badge' || typeof value === 'boolean') {
    const isBool = typeof value === 'boolean'
    const label = isBool ? (value ? 'Yes' : 'No') : String(value)
    return (
      <Badge 
        variant={isBool ? (value ? 'default' : 'secondary') : 'outline'}
        className={cn(
          "rounded-lg px-2.5 py-0.5 font-bold uppercase tracking-wider text-[10px]",
          isBool && value && "bg-primary/20 text-primary border-none shadow-none",
          isBool && !value && "bg-muted text-muted-foreground border-none shadow-none"
        )}
      >
        {label}
      </Badge>
    )
  }

  if (typeof value === 'object' && !variant) {
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-muted-foreground italic text-xs">Empty list</span>
      return (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {value.map((item, index) => (
            <Badge key={index} variant="secondary" className="rounded-md bg-muted/40 text-[10px] font-medium border-none px-2">
              {String(item)}
            </Badge>
          ))}
        </div>
      )
    }

    const entries = Object.entries(value).filter(([k]) => !k.startsWith('_'))
    if (entries.length === 0) return <span className="text-muted-foreground italic text-xs">No details</span>

    return (
      <div className="space-y-1.5 mt-1 w-full bg-muted/10 p-2.5 rounded-xl border border-border/40">
        {entries.map(([k, v]) => (
          <div key={k} className="flex justify-between items-center text-xs gap-3">
            <span className="font-bold text-muted-foreground/60 uppercase tracking-tight text-[9px]">{formatKeyName(k)}</span>
            <span className="font-medium text-foreground text-right break-words max-w-[150px]">{String(v)}</span>
          </div>
        ))}
      </div>
    )
  }

  const formattedValue = formatDateIfApplicable(value)
  return <span className="font-semibold text-foreground break-words">{String(formattedValue)}</span>
}

export function RowDetailsDialog({ open, onOpenChange, title, data, fields, imageUrl, locationImageUrl, locationName, onImageClick }: RowDetailsDialogProps) {
  if (!data && !fields) return null

  const displayFields = fields || (data ? Object.entries(data)
    .filter(([key]) => !key.startsWith('_') && !['imageUrl', 'id', 'createdById', 'updatedById'].includes(key))
    .map(([key, value]) => ({
      label: formatKeyName(key),
      value: value,
      variant: typeof value === 'boolean' ? ('badge' as const) : undefined
    })) : [])

  const displayImageUrl = imageUrl || data?.imageUrl || data?.product?.imageUrl

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 bg-popover/95 backdrop-blur-xl border-border/50 rounded-3xl overflow-hidden shadow-premium animate-in zoom-in-95 duration-200">
        <DialogHeader className="px-6 py-5 border-b border-border/40 bg-muted/10">
          <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
          {(displayImageUrl || locationImageUrl) && (
            <div className={cn(
              "border-b border-border/30",
              displayImageUrl && locationImageUrl ? "grid grid-cols-2" : ""
            )}>
              {displayImageUrl && (
                <div 
                  className={cn(
                    "relative bg-muted/20 cursor-zoom-in group overflow-hidden",
                    locationImageUrl ? "h-48 sm:h-64" : "w-full h-64 sm:h-80 md:h-96"
                  )}
                  onClick={() => onImageClick && onImageClick(displayImageUrl)}
                >
                  <img 
                    src={displayImageUrl} 
                    alt={title}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center duration-300">
                    <ZoomIn className="text-white opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all h-8 w-8 drop-shadow-2xl" />
                  </div>
                  {locationImageUrl && (
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">Product Photo</div>
                  )}
                </div>
              )}
              {locationImageUrl && (
                <div 
                  className={cn(
                    "relative bg-muted/20 cursor-zoom-in group overflow-hidden",
                    displayImageUrl ? "h-48 sm:h-64" : "w-full h-64 sm:h-80 md:h-96"
                  )}
                  onClick={() => onImageClick && onImageClick(locationImageUrl)}
                >
                  <img 
                    src={locationImageUrl} 
                    alt={locationName || 'Location'}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center duration-300">
                    <ZoomIn className="text-white opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all h-8 w-8 drop-shadow-2xl" />
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {locationName || 'Product Photo'}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayFields.map((field, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex flex-col space-y-2 p-4 rounded-2xl border border-border/30 bg-muted/10 hover:bg-muted/20 transition-colors group",
                    (typeof field.value === 'object' && field.value !== null) || String(field.value).length > 50 ? "sm:col-span-2" : ""
                  )}
                >
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-0.5 group-hover:text-primary transition-colors">
                    {field.label}
                  </span>
                  <div className="text-sm">
                    {renderValue(field.value, field.variant)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-border/40 bg-muted/5 flex justify-end px-6">
          <Badge variant="outline" className="border-border/30 text-[9px] font-medium text-muted-foreground px-3 py-1 rounded-full bg-muted/20">
            Internal Record View
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  )
}
