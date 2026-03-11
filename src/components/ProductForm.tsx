'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/contexts/ToastContext'

interface ProductFormProps {
  onSuccess: () => void
  product?: any
}

interface FormData {
  name: string
  code: string
  sizeId: string
  categoryId: string
  brandId: string
  locationId: string
  batchName: string
  stock: string
  image: File | null
}

export default function ProductForm({ onSuccess, product }: ProductFormProps) {
  const { showToast } = useToast()
  const [formData, setFormData] = useState<FormData>({
    name: product?.name || '',
    code: product?.code || '',
    sizeId: product?.sizeId || product?.finishTypeId || '',
    categoryId: product?.categoryId || '',
    brandId: product?.brandId || '',
    locationId: '',
    batchName: '',
    stock: product?.pcsPerBox?.toString() || '',
    image: null
  })
  
  const [sizes, setSizes] = useState<any[]>([])
  const [filteredSizes, setFilteredSizes] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [filteredCategories, setFilteredCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchDropdownData()
  }, [])

  useEffect(() => {
    if (formData.brandId) {
      fetchCategoriesByBrand(formData.brandId)
    }
  }, [formData.brandId])

  useEffect(() => {
    if (formData.brandId && formData.categoryId) {
      fetchSizesByBrandAndCategory(formData.brandId, formData.categoryId)
    } else {
      setFilteredSizes([])
    }
  }, [formData.brandId, formData.categoryId])

  const fetchCategoriesByBrand = async (brandId: string) => {
    try {
      const response = await fetch(`/api/categories?brandId=${brandId}`)
      const data = await response.json()
      setFilteredCategories((data.categories || []).filter((c: any) => c.isActive))
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchSizesByBrandAndCategory = async (brandId: string, categoryId: string) => {
    try {
      const response = await fetch(`/api/sizes?brandId=${brandId}&categoryId=${categoryId}`)
      const data = await response.json()
      setFilteredSizes(data.sizes || [])
    } catch (error) {
      console.error('Error fetching sizes:', error)
    }
  }

  const fetchDropdownData = async () => {
    try {
      const [brandsRes, locationsRes] = await Promise.all([
        fetch('/api/brands'),
        fetch('/api/locations')
      ])

      const [brandsData, locationsData] = await Promise.all([
        brandsRes.json(),
        locationsRes.json()
      ])

      setBrands((brandsData.brands || []).filter((b: any) => b.isActive))
      setLocations((locationsData.locations || []).filter((l: any) => l.isActive))
    } catch (error) {
      console.error('Error fetching dropdown data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Client-side validation
      if (!formData.name.trim()) {
        showToast('Please enter a product name', 'error')
        setLoading(false)
        return
      }

      if (!formData.code.trim()) {
        showToast('Please enter a product code', 'error')
        setLoading(false)
        return
      }

      if (!formData.brandId) {
        showToast('Please select a brand', 'error')
        setLoading(false)
        return
      }

      if (!formData.categoryId) {
        showToast('Please select a category', 'error')
        setLoading(false)
        return
      }

      if (!formData.sizeId) {
        showToast('Please select a size', 'error')
        setLoading(false)
        return
      }

      if (!product) {
        if (!formData.locationId) {
          showToast('Please select a location', 'error')
          setLoading(false)
          return
        }

        if (!formData.batchName.trim()) {
          showToast('Please enter a batch name', 'error')
          setLoading(false)
          return
        }
      }

      if (!formData.stock || parseInt(formData.stock) <= 0) {
        showToast('Please enter a valid stock quantity', 'error')
        setLoading(false)
        return
      }

      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'
      
      const submitData = new FormData()
      submitData.append('name', formData.name.trim())
      submitData.append('code', formData.code.trim())
      submitData.append('sizeId', formData.sizeId)
      submitData.append('categoryId', formData.categoryId)
      submitData.append('brandId', formData.brandId)
      submitData.append('finishTypeId', formData.sizeId)
      submitData.append('locationId', formData.locationId)
      submitData.append('batchName', formData.batchName.trim())
      submitData.append('stock', formData.stock)
      submitData.append('sqftPerBox', '1')
      submitData.append('pcsPerBox', formData.stock)
      
      if (formData.image) {
        console.log('Appending image to FormData:', formData.image.name, formData.image.size)
        submitData.append('image', formData.image)
      } else {
        console.log('No image selected')
      }
      
      console.log('Submitting product data:', {
        name: formData.name,
        code: formData.code,
        brandId: formData.brandId,
        categoryId: formData.categoryId,
        sizeId: formData.sizeId,
        stock: formData.stock,
        hasImage: !!formData.image
      })
      
      const response = await fetch(url, {
        method,
        body: submitData
      })

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      let responseData
      
      try {
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json()
          console.log('Parsed JSON response:', responseData)
        } else {
          // Response is not JSON, get text instead
          const textResponse = await response.text()
          console.error('Non-JSON response:', textResponse)
          console.error('Content-Type was:', contentType)
          responseData = { error: 'Server returned invalid response', details: textResponse }
        }
      } catch (parseError: any) {
        console.error('Failed to parse response:', parseError)
        const rawText = await response.text()
        console.error('Raw response text:', rawText)
        responseData = { error: 'Failed to parse server response', details: parseError.message }
      }

      if (response.ok) {
        console.log('Product saved successfully:', responseData)
        showToast(
          product ? 'Product updated successfully!' : 'Product created successfully!',
          'success'
        )
        onSuccess()
        
        // Reset form only for new products
        if (!product) {
          setFormData({
            name: '',
            code: '',
            sizeId: '',
            categoryId: '',
            brandId: '',
            locationId: '',
            batchName: '',
            stock: '',
            image: null
          })
        }
      } else {
        // Handle error response
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          contentType: contentType,
          error: responseData
        })
        
        const errorMessage = responseData.details || responseData.error || responseData.message || 'Failed to save product'
        showToast(errorMessage, 'error')
      }
    } catch (error: any) {
      console.error('Error submitting product:', error)
      showToast(error.message || 'Failed to connect to server', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 py-2 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium">Tile Name *</label>
          <Input
            placeholder="Enter tile name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Item Code *</label>
          <Input
            placeholder="Enter item code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Brand *</label>
          <Select value={formData.brandId} onValueChange={(value) => {
            setFormData({ ...formData, brandId: value, categoryId: '', sizeId: '' })
          }} required>
            <SelectTrigger className="bg-white h-8 text-sm">
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Category *</label>
          <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value, sizeId: '' })} disabled={!formData.brandId} required>
            <SelectTrigger className="bg-white h-8 text-sm">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {filteredCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Size *</label>
          <Select value={formData.sizeId} onValueChange={(value) => setFormData({ ...formData, sizeId: value })} disabled={!formData.categoryId} required>
            <SelectTrigger className="bg-white h-8 text-sm">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {filteredSizes.map((size) => (
                <SelectItem key={size.id} value={size.id}>
                  {size.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Stock Quantity *</label>
          <Input
            type="number"
            placeholder="Enter stock"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            required
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Location {!product && '*'}</label>
          <Select value={formData.locationId} onValueChange={(value) => setFormData({ ...formData, locationId: value })} required={!product}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Batch Name {!product && '*'}</label>
          <Input
            placeholder="Enter batch name"
            value={formData.batchName}
            onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
            required={!product}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Tile Image</label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
          className="h-8 text-xs"
        />
        {formData.image && (
          <p className="text-xs text-gray-500">Selected: {formData.image.name}</p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 h-8 text-sm" disabled={loading}>
          {loading ? (product ? 'Updating...' : 'Creating...') : (product ? 'Update' : 'Create')}
        </Button>
        <Button type="button" variant="outline" onClick={() => onSuccess()} className="h-8 text-sm">
          Cancel
        </Button>
      </div>
    </form>
  )
}