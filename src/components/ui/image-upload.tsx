'use client'

import { useState, useRef, useCallback } from 'react'
import { uploadImage } from '@/lib/uploadUtils'
import { ImageIcon, X } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'

interface ImageUploadProps {
  onImageUploaded: (url: string) => void
  currentImage?: string
  className?: string
}

export default function ImageUpload({ onImageUploaded, currentImage, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const url = await uploadImage(file)
      onImageUploaded(url)
    } catch (error) {
      console.error('Upload failed:', error)
      showToast(error instanceof Error ? error.message : 'Upload failed', 'error')
      setPreview(currentImage || null)
    } finally {
      setUploading(false)
    }
  }, [onImageUploaded, currentImage, showToast])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) {
          processFile(file)
          break
        }
      }
    }
  }, [processFile])

  const handleRemove = () => {
    setPreview(null)
    onImageUploaded('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <label className="text-sm font-medium text-foreground">Product Image</label>

      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-md border border-border"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
              <div className="text-white text-xs font-medium">Uploading...</div>
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          onClick={() => !uploading && fileInputRef.current?.click()}
          tabIndex={0}
          role="button"
          aria-label="Upload image: click, drag and drop, or paste"
          onKeyDown={(e) => e.key === 'Enter' && !uploading && fileInputRef.current?.click()}
          className={[
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-accent/5',
            uploading ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        >
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            {uploading ? (
              <div className="text-sm text-muted-foreground">Uploading...</div>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Click to upload</span>,{' '}
                  drag &amp; drop, or paste an image
                </div>
                <div className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</div>
              </>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
      />
    </div>
  )
}