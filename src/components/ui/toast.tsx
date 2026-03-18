'use client'

import * as React from 'react'
import { X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

const toastVariantClasses: Record<ToastType, string> = {
  success: 'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]',
  error: 'bg-destructive text-destructive-foreground',
  warning: 'bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]',
  info: 'bg-[hsl(var(--info))] text-[hsl(var(--info-foreground))]',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const showToast = React.useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 4000)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right duration-300 ${toastVariantClasses[toast.type]}`}
          >
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="inline-flex items-center justify-center rounded-md bg-destructive px-1.5 py-1 text-destructive-foreground transition-colors hover:bg-destructive/90"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
