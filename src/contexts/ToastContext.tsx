'use client'

import { createContext, useContext, ReactNode } from 'react'
import toast, { Toaster } from 'react-hot-toast'

interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const options = {
      duration: 4000,
      position: 'top-right' as const,
      style: {
        borderRadius: '12px',
        background: 'hsl(var(--card))',
        color: 'hsl(var(--card-foreground))',
        border: '1px solid hsl(var(--border))',
        fontSize: '14px',
        fontWeight: '500',
        padding: '12px 16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    }

    switch (type) {
      case 'success':
        toast.success(message, {
          ...options,
          iconTheme: {
            primary: 'hsl(142 76% 36%)',
            secondary: 'white',
          },
        })
        break
      case 'error':
        toast.error(message, {
          ...options,
          iconTheme: {
            primary: 'hsl(0 84% 60%)',
            secondary: 'white',
          },
        })
        break
      case 'warning':
        toast(message, {
          ...options,
          icon: '⚠️',
        })
        break
      case 'info':
        toast(message, {
          ...options,
          icon: 'ℹ️',
        })
        break
    }
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        }}
      />
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}