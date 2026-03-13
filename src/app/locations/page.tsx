'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/contexts/ToastContext'
import { DataView } from '@/components/ui/data-view'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Location {
  id: string
  name: string
  address?: string
  isActive: boolean
  createdAt: string
  _count?: {
    batches: number
  }
}

interface FormData {
  name: string
  address: string
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showForm, setShowForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: ''
  })
  const [submitting, setSubmitting] = useState(false)
  
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      if (response.ok) {
        const data = await response.json()
        setLocations(data.locations || [])
      } else {
        showToast('Failed to fetch locations', 'error')
      }
    } catch (error) {
      showToast('Error fetching locations', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      showToast('Please enter a location name', 'error')
      return
    }

    setSubmitting(true)
    try {
      const url = editingLocation ? `/api/locations/${editingLocation.id}` : '/api/locations'
      const method = editingLocation ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showToast(
          editingLocation ? 'Location updated successfully!' : 'Location created successfully!',
          'success'
        )
        setShowForm(false)
        setEditingLocation(null)
        setFormData({ name: '', address: '' })
        fetchLocations()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to save location', 'error')
      }
    } catch (error) {
      showToast('Error saving location', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      address: location.address || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (location: Location) => {
    if (!confirm(`Are you sure you want to delete "${location.name}"?`)) return

    try {
      const response = await fetch(`/api/locations/${location.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('Location deleted successfully!', 'success')
        fetchLocations()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to delete location', 'error')
      }
    } catch (error) {
      showToast('Error deleting location', 'error')
    }
  }

  const renderGridItem = (location: Location) => (
    <Card className="h-full hover:shadow-lg transition-shadow bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-card-foreground">
              {location.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {location.address || 'No address provided'}
            </p>
          </div>
          <Badge variant={location.isActive ? 'default' : 'secondary'}>
            {location.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>Inventory Batches: {location._count?.batches || 0}</span>
          <span>Created: {new Date(location.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(location)}
            className="flex-1 border-border text-foreground hover:bg-accent"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(location)}
            className="flex-1 text-destructive hover:text-destructive border-border hover:bg-destructive/10"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderListRow = (location: Location) => (
    <>
      <td className="px-4 py-3">
        <div className="font-medium text-foreground">{location.name}</div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-muted-foreground">
          {location.address || 'No address'}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={location.isActive ? 'default' : 'secondary'}>
          {location.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {location._count?.batches || 0}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {new Date(location.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(location)}
            className="text-foreground hover:bg-accent"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(location)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Delete
          </Button>
        </div>
      </td>
    </>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading locations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <DataView
        items={locations}
        view={view}
        onViewChange={setView}
        title="Locations"
        actions={
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingLocation(null)
                  setFormData({ name: '', address: '' })
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-card-foreground font-semibold">
                  {editingLocation ? 'Edit Location' : 'Add New Location'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter location name"
                    required
                    className="bg-background border-input text-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Address</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter address (optional)"
                    className="bg-background border-input text-foreground"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={submitting} 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                  >
                    {submitting ? 'Saving...' : editingLocation ? 'Update' : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="border-border text-foreground hover:bg-accent font-medium"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
        gridProps={{
          renderItem: renderGridItem,
          columns: 3
        }}
        listProps={{
          headers: ['Name', 'Address', 'Status', 'Batches', 'Created', 'Actions'],
          renderRow: renderListRow
        }}
      />
    </div>
  )
}