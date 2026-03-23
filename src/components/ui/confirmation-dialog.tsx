'use client'

import { ReactNode } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void
  onCancel?: () => void
  icon?: ReactNode
  loading?: boolean
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  icon,
  loading = false
}: ConfirmationDialogProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onOpenChange(false)
    }
  }

  const handleConfirm = () => {
    onConfirm()
  }

  const getIcon = () => {
    if (icon) return icon
    if (variant === 'destructive') {
      return (
        <div className="p-3 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-lg shadow-destructive/10 animate-pulse-slow">
          <Trash2 className="h-6 w-6" />
        </div>
      )
    }
    return (
      <div className="p-3 rounded-2xl bg-warning/10 text-warning border border-warning/20 shadow-lg shadow-warning/10">
        <AlertTriangle className="h-6 w-6" />
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] glass-card border-border/50 rounded-[2rem] p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-8 w-8 p-0 rounded-full hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4 opacity-50" />
          </Button>
        </div>

        <div className="p-8">
          <div className="flex flex-col items-center text-center gap-6">
            {getIcon()}
            
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                {title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                {description}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-10">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 rounded-2xl h-12 font-bold border-border/50 hover:bg-muted/50 transition-all active:scale-95"
            >
              {cancelText}
            </Button>
            <Button
              variant={variant === 'destructive' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={loading}
              className={cn(
                "flex-1 rounded-2xl h-12 font-bold shadow-lg transition-all active:scale-95",
                variant === 'destructive' 
                  ? "shadow-destructive/20 hover:shadow-destructive/30" 
                  : "shadow-primary/20 hover:shadow-primary/30"
              )}
            >
              {loading ? 'Processing...' : confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Convenience hook for delete confirmations
export function useDeleteConfirmation() {
  return {
    title: 'Delete Item',
    description: 'Are you sure you want to delete this item? This action cannot be undone.',
    confirmText: 'Delete',
    variant: 'destructive' as const,
    icon: <Trash2 className="h-6 w-6 text-destructive" />
  }
}