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
import { Filter, Plus, Edit, Trash2, MapPin, Warehouse } from 'lucide-react'
import { RowDetailsDialog } from '@/components/ui/row-details-dialog'
import { cn } from '@/lib/utils'

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
    <Card className="h-full hover:shadow-premium transition-all duration-300 border-border/50 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors">
              {location.name}
            </CardTitle>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2 italic">
              <MapPin className="h-3.5 w-3.5 text-primary/60" />
              <span className="truncate">{location.address || 'No address provided'}</span>
            </div>
          </div>
          <Badge 
            variant={location.isActive ? 'default' : 'secondary'}
            className={cn(location.isActive ? "bg-primary/20 text-primary border-none" : "")}
          >
            {location.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground bg-primary/5 p-2.5 rounded-xl border border-primary/10 mb-4">
          <Warehouse className="h-4 w-4 text-primary" />
          <span>Inventory Batches: {location._count?.batches || 0}</span>
        </div>
        
        <div className="text-xs text-muted-foreground mb-6 space-y-1 bg-muted/30 p-2.5 rounded-xl border border-border/30">
          <div className="flex justify-between"><span>Created:</span> <span className="font-medium text-foreground">{formatDate(location.createdAt)}</span></div>
          {location.updatedAt && location.updatedAt !== location.createdAt && (
            <div className="flex justify-between"><span>Updated:</span> <span className="font-medium text-foreground">{formatDate(location.updatedAt)}</span></div>
          )}
          {location.createdBy && (
            <div className="flex justify-between"><span>By:</span> <span className="font-medium text-foreground">{location.createdBy.name}</span></div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEdit(location); }}
            className="flex-1 rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 gap-2 font-bold h-9"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setDeleteLocation(location); }}
            className="flex-1 rounded-xl text-destructive hover:text-destructive border-border/50 hover:bg-destructive/10 hover:border-destructive/30 gap-2 font-bold h-9"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [formatDate])

  const renderListRow = useCallback((location: Location) => (
    <>
      <td className="px-4 py-2.5">
        <div className="font-bold text-foreground group-hover:text-primary transition-colors">{location.name}</div>
      </td>
      <td className="px-4 py-2.5">
        <div className="text-sm text-muted-foreground max-w-xs truncate italic flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          {location.address || 'No address'}
        </div>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2 font-bold text-foreground bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10 w-fit">
          <Warehouse className="h-4 w-4 text-primary" />
          {location._count?.batches || 0} batches
        </div>
      </td>
      <td className="px-4 py-2.5">
        <Badge 
          variant={location.isActive ? 'default' : 'secondary'}
          className={cn(location.isActive ? "bg-primary/20 text-primary border-none" : "")}
        >
          {location.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-2.5 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">{formatDate(location.createdAt)}</div>
        <div className="text-xs">{location.createdBy?.name || 'System'}</div>
      </td>
      <td className="px-4 py-2.5 text-sm text-muted-foreground">
        {location.updatedAt && location.updatedAt !== location.createdAt ? (
          <div>
            <div className="font-medium text-foreground">{formatDate(location.updatedAt)}</div>
            <div className="text-xs">{location.updatedBy?.name || 'System'}</div>
          </div>
        ) : (
          <span className="text-xs opacity-30 text-muted-foreground">No updates</span>
        )}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEdit(location); }}
            className="rounded-xl hover:bg-primary/10 hover:text-primary gap-2 font-bold px-3 transition-all"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setDeleteLocation(location); }}
            className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 font-bold px-3 transition-all"
          >
            <Trash2 className="h-4 w-4" />
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
        showSearch={true}
        showFilterToggle={true}
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
          headers: ['Location', 'Batches', 'Status', 'Created', 'Updated', 'Actions'],
          renderRow: renderListRow
        }}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="glass backdrop-blur-xl border-border/50 max-w-md rounded-3xl shadow-premium animate-in zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 ml-1">Location Name <span className="text-destructive">*</span></label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter location name"
                required
                className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 ml-1">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address (optional)"
                className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12"
              />
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-2xl border border-border/30 group hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}>
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-5 w-5 rounded-lg border-primary/30 text-primary transition-all cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">Active Status</span>
                <span className="text-xs text-muted-foreground">Visible in system operations</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20"
              >
                {submitting ? 'Saving...' : editingLocation ? 'Update Location' : 'Create Location'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="rounded-2xl h-12 px-6 border-border/50 font-bold hover:bg-muted/50"
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
        fields={[
          { label: 'Name', value: selectedDetailItem?.name },
          { label: 'Address', value: selectedDetailItem?.address },
          { label: 'Inventory Batches', value: selectedDetailItem?._count?.batches || 0, variant: 'number' as const },
          { label: 'Status', value: selectedDetailItem?.isActive, variant: 'badge' as const },
          { label: 'Created At', value: selectedDetailItem?.createdAt },
          { label: 'Created By', value: selectedDetailItem?.createdBy?.name },
          { label: 'Updated At', value: selectedDetailItem?.updatedAt !== selectedDetailItem?.createdAt ? selectedDetailItem?.updatedAt : undefined },
          { label: 'Updated By', value: selectedDetailItem?.updatedAt !== selectedDetailItem?.createdAt ? selectedDetailItem?.updatedBy?.name : undefined },
        ].filter(f => f.value !== undefined)}
      />
    </div>
  )
}