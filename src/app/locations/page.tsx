'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/contexts/ToastContext'
import { DataView } from '@/components/ui/data-view'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmationDialog, useDeleteConfirmation } from '@/components/ui/confirmation-dialog'
import { Pagination, usePagination } from '@/components/ui/pagination'
import { TableFilters, useTableFilters, FilterConfig } from '@/components/ui/table-filters'
import { ExportButton, commonColumns } from '@/lib/excel-export'
import { LoadingPage } from '@/components/ui/skeleton'
import { Filter, Plus, Edit, Trash2 } from 'lucide-react'
import { RowDetailsDialog } from '@/components/ui/row-details-dialog'

interface Location {
  id: string
  name: string
  address?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: {
    name: string
    email: string
  }
  updatedBy?: {
    name: string
    email: string
  }
  _count?: {
    batches: number
  }
}

interface FormData {
  name: string
  address: string
  isActive: boolean
}

interface ApiResponse {
  locations: Location[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'list'>('list') // Default to list for desktop
  const [showForm, setShowForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [deleteLocation, setDeleteLocation] = useState<Location | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedDetailItem, setSelectedDetailItem] = useState<Location | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    isActive: true
  })
  const [submitting, setSubmitting] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)
  
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const deleteConfirmation = useDeleteConfirmation()
  
  // Pagination
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange
  } = usePagination(1, 25)
  
  // Filters
  const {
    filters,
    search,
    updateFilters,
    updateSearch
  } = useTableFilters()

  // Filter configurations
  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      key: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ],
      placeholder: 'All Status'
    }
  ], [])

  // Fetch locations with pagination and filters
  const fetchLocations = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: search || '',
        ...filters
      })

      const response = await fetch(`/api/locations?${params}`)
      if (response.ok) {
        const data: ApiResponse = await response.json()
        setLocations(data.locations || [])
        setTotalCount(data.totalCount || 0)
        setTotalPages(data.totalPages || 0)
      } else {
        showToast('Failed to fetch locations', 'error')
      }
    } catch (error) {
      showToast('Error fetching locations', 'error')
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, search, filters, showToast])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setEditingLocation(null)
      resetForm()
      setShowForm(true)
    }
  }, [searchParams])

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
        resetForm()
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

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      isActive: true
    })
  }

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      address: location.address || '',
      isActive: location.isActive
    })
    setShowForm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteLocation) return

    try {
      const response = await fetch(`/api/locations/${deleteLocation.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('Location deleted successfully!', 'success')
        setDeleteLocation(null)
        fetchLocations()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to delete location', 'error')
      }
    } catch (error) {
      showToast('Error deleting location', 'error')
    }
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    const day = d.getDate().toString().padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`
  }

  const renderGridItem = useCallback((location: Location) => (
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
        </div>
        <div className="text-xs text-muted-foreground mb-4 space-y-1">
          <div>Created: {formatDate(location.createdAt)}</div>
          {location.updatedAt && location.updatedAt !== location.createdAt && (
            <div>Updated: {formatDate(location.updatedAt)}</div>
          )}
          {location.createdBy && (
            <div>By: {location.createdBy.name}</div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEdit(location); }}
            className="flex-1 border-border text-foreground hover:bg-accent gap-1"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setDeleteLocation(location); }}
            className="flex-1 text-destructive hover:text-destructive border-border hover:bg-destructive/10 gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [formatDate])

  const renderListRow = useCallback((location: Location) => (
    <>
      <td className="px-4 py-3">
        <div className="font-medium text-foreground">{location.name}</div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-muted-foreground max-w-xs truncate">
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
        <div>{formatDate(location.createdAt)}</div>
        <div className="text-xs">{location.createdBy?.name || 'System'}</div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {location.updatedAt && location.updatedAt !== location.createdAt ? (
          <div>
            <div>{formatDate(location.updatedAt)}</div>
            <div className="text-xs">{location.updatedBy?.name || 'System'}</div>
          </div>
        ) : (
          <span className="text-xs">-</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEdit(location); }}
            className="text-foreground hover:bg-accent gap-1"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setDeleteLocation(location); }}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      </td>
    </>
  ), [formatDate])

  if (loading && locations.length === 0) {
    return <LoadingPage view={view} title="Locations" />
  }

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 space-y-6">
      {/* Filters */}
      <TableFilters
        title="Locations"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setFiltersOpen((prev) => !prev)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <ExportButton
              data={locations}
              columns={commonColumns.location}
              filename="locations-export"
              reportTitle="Locations Report"
              onExportComplete={(result) => {
                if (result.success) {
                  showToast(`Exported ${locations.length} locations successfully!`, 'success')
                } else {
                  showToast(result.error || 'Export failed', 'error')
                }
              }}
              disabled={locations.length === 0}
            />
            <Button
              size="sm"
              onClick={() => {
                setEditingLocation(null)
                resetForm()
                setShowForm(true)
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Location
            </Button>
          </div>
        }
        filters={filterConfigs}
        values={filters}
        onFiltersChange={updateFilters}
        searchValue={search}
        onSearchChange={updateSearch}
        showSearch={false}
        showFilterToggle={false}
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
        loading={loading}
      />

      {/* Data View */}
      <DataView
        items={locations}
        view={view}
        onViewChange={setView}
        loading={loading}
        autoResponsive={true}
        onItemClick={(item) => {
          setSelectedDetailItem(item)
          setShowDetails(true)
        }}
        gridProps={{
          renderItem: renderGridItem,
          columns: 3
        }}
        listProps={{
          headers: ['Location', 'Address', 'Status', 'Batches', 'Created', 'Updated', 'Actions'],
          renderRow: renderListRow
        }}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border max-w-md">
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
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-input"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-foreground">
                Active
              </label>
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

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        loading={loading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteLocation}
        onOpenChange={(open) => !open && setDeleteLocation(null)}
        title={deleteConfirmation.title}
        description={`Are you sure you want to delete "${deleteLocation?.name}"? This action cannot be undone.`}
        confirmText={deleteConfirmation.confirmText}
        variant={deleteConfirmation.variant}
        onConfirm={handleDeleteConfirm}
        icon={deleteConfirmation.icon}
      />

      <RowDetailsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        title="Location Details"
        data={selectedDetailItem}
      />
    </div>
  )
}