'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/contexts/ToastContext'
import { DataView } from '@/components/ui/data-view'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmationDialog, useDeleteConfirmation } from '@/components/ui/confirmation-dialog'
import { Pagination, usePagination } from '@/components/ui/pagination'
import { TableFilters, useTableFilters, FilterConfig } from '@/components/ui/table-filters'
import { commonColumns } from '@/lib/excel-export'
import { PageExportButton } from '@/components/reports/PageExport'
import { LoadingPage } from '@/components/ui/skeleton'
import { RowDetailsDialog } from '@/components/ui/row-details-dialog'
import { ImagePreview } from '@/components/ui/image-preview'
import ImageUpload from '@/components/ui/image-upload'
import { Plus, Edit, Trash2, MapPin, Warehouse, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useResponsiveDefaultView } from '@/hooks/use-responsive-default-view'

interface Location {
  id: string
  name: string
  address?: string
  imageUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: { name: string; email: string }
  updatedBy?: { name: string; email: string }
  _count?: { batches: number }
}

interface FormData {
  name: string
  address: string
  imageUrl: string
  isActive: boolean
}

const formatDate = (dateString: string) => {
  const d = new Date(dateString)
  const day = d.getDate().toString().padStart(2, '0')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const { view, setView } = useResponsiveDefaultView()
  const [showForm, setShowForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [deleteLocation, setDeleteLocation] = useState<Location | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedDetailItem, setSelectedDetailItem] = useState<Location | null>(null)
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null)
  const [imageResetKey, setImageResetKey] = useState(0)
  const [formData, setFormData] = useState<FormData>({ name: '', address: '', imageUrl: '', isActive: true })
  const [submitting, setSubmitting] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const deleteConfirmation = useDeleteConfirmation()
  const { currentPage, itemsPerPage, handlePageChange, handleItemsPerPageChange } = usePagination(1, 5)
  const { filters, search, updateFilters, updateSearch } = useTableFilters()

  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      key: 'isActive',
      label: 'Status',
      type: 'select',
      options: [{ value: 'all', label: 'All Status' }, { value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }],
      placeholder: 'All Status',
      defaultValue: 'all'
    }
  ], [])

  const fetchLocations = useCallback(async () => {
    setLoading(true)
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v && v !== '' && v !== 'all')
      )
      const params = new URLSearchParams({ page: currentPage.toString(), limit: itemsPerPage.toString(), search: search || '', ...cleanFilters })
      const response = await fetch(`/api/locations?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLocations(data.locations || [])
        setTotalCount(data.totalCount || 0)
        setTotalPages(data.totalPages || 0)
      }
    } catch { showToast('Error fetching locations', 'error') }
    finally { setLoading(false) }
  }, [currentPage, itemsPerPage, search, filters, showToast])

  useEffect(() => { fetchLocations() }, [fetchLocations])
  useEffect(() => {
    if (searchParams.get('action') === 'create') { resetForm(); setShowForm(true) }
  }, [searchParams])

  const resetForm = () => {
    setFormData({ name: '', address: '', imageUrl: '', isActive: true })
    setEditingLocation(null)
    setImageResetKey(k => k + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) { showToast('Location name is required', 'error'); return }
    if (!formData.imageUrl) { showToast('Location photo is required', 'error'); return }
    setSubmitting(true)
    try {
      const url = editingLocation ? `/api/locations/${editingLocation.id}` : '/api/locations'
      const method = editingLocation ? 'PUT' : 'POST'
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      if (response.ok) {
        showToast(editingLocation ? 'Location updated!' : 'Location created!', 'success')
        setShowForm(false)
        resetForm()
        fetchLocations()
      } else {
        const err = await response.json()
        showToast(err.error || 'Failed to save location', 'error')
      }
    } catch { showToast('Error saving location', 'error') }
    finally { setSubmitting(false) }
  }

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setFormData({ name: location.name, address: location.address || '', imageUrl: location.imageUrl || '', isActive: location.isActive })
    setImageResetKey(k => k + 1)
    setShowForm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteLocation) return
    try {
      const response = await fetch(`/api/locations/${deleteLocation.id}`, { method: 'DELETE' })
      if (response.ok) { showToast('Location deleted!', 'success'); setDeleteLocation(null); fetchLocations() }
      else { const err = await response.json(); showToast(err.error || 'Failed to delete', 'error') }
    } catch { showToast('Error deleting location', 'error') }
  }

  const renderGridItem = useCallback((location: Location) => (
    <div
      className="h-full border border-border/50 rounded-2xl overflow-hidden hover:shadow-premium transition-all duration-300 bg-card flex flex-col group cursor-pointer"
      onClick={() => { setSelectedDetailItem(location); setShowDetails(true) }}
    >
      {/* Photo - Priority, big */}
      <div className="relative w-full h-48 bg-muted/20 flex-shrink-0 overflow-hidden">
        {location.imageUrl ? (
          <>
            <img src={location.imageUrl} alt={location.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div
              className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center cursor-zoom-in"
              onClick={(e) => { e.stopPropagation(); setPreviewImage({ src: location.imageUrl!, alt: location.name }) }}
            >
              <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 drop-shadow-lg" />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
            <MapPin className="h-12 w-12" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={location.isActive ? 'default' : 'secondary'} className={cn(location.isActive ? 'bg-primary text-primary-foreground shadow' : '')}>
            {location.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">{location.name}</div>
            {location.address && <div className="text-xs text-muted-foreground italic truncate flex items-center gap-1"><MapPin className="h-3 w-3 flex-shrink-0" />{location.address}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-foreground bg-primary/5 p-2 rounded-xl border border-primary/10">
          <Warehouse className="h-3.5 w-3.5 text-primary" />
          <span>{location._count?.batches || 0} batches</span>
        </div>
        <div className="pt-2 mt-auto border-t border-border/30 flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" onClick={() => handleEdit(location)} className="flex-1 rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary gap-1.5 font-bold h-8 text-xs">
            <Edit className="h-3 w-3" />Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDeleteLocation(location)} className="h-8 w-8 rounded-xl p-0 text-destructive hover:text-destructive border-border/50 hover:bg-destructive/10">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  ), [])

  const renderListRow = useCallback((location: Location) => (
    <>
      {/* Photo - First column */}
      <td className="px-3 py-2">
        <div
          className="h-16 w-16 rounded-xl overflow-hidden bg-muted/20 border border-border/40 flex-shrink-0 cursor-zoom-in group/thumb relative"
          onClick={(e) => { e.stopPropagation(); if (location.imageUrl) setPreviewImage({ src: location.imageUrl, alt: location.name }) }}
        >
          {location.imageUrl ? (
            <>
              <img src={location.imageUrl} alt={location.name} className="h-full w-full object-cover group-hover/thumb:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity h-4 w-4" />
              </div>
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
              <MapPin className="h-6 w-6" />
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="font-bold text-foreground group-hover:text-primary transition-colors">{location.name}</div>
        {location.address && <div className="text-xs text-muted-foreground italic">{location.address}</div>}
      </td>
      <td className="px-4 py-3 font-bold text-foreground">{location._count?.batches || 0}</td>
      <td className="px-4 py-3">
        <Badge variant={location.isActive ? 'default' : 'secondary'} className={cn(location.isActive ? 'bg-primary/20 text-primary border-none' : '')}>
          {location.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">{formatDate(location.createdAt)}</div>
        <div className="text-xs">{location.createdBy?.name || 'N/A'}</div>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => handleEdit(location)} className="rounded-xl hover:bg-primary/10 hover:text-primary gap-2 font-bold px-3 transition-all">
            <Edit className="h-4 w-4" />Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteLocation(location)} className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 font-bold px-3 transition-all">
            <Trash2 className="h-4 w-4" />Delete
          </Button>
        </div>
      </td>
    </>
  ), [])

  const makeExportRows = (data: Location[]) => data.map(l => ({
    imageUrl: l.imageUrl,
    col1: l.isActive ? 'Active' : 'Inactive',
    col2: l.address || '',
    col3: l.name,
    qty: l._count?.batches || 0,
    badge: l.isActive ? 'Active' : 'Inactive',
  }))

  const exportConfig = useMemo(() => ({
    title: 'Locations Report',
    rows: makeExportRows(locations),
    grandTotal: totalCount,
    grandTotalLabel: 'Total Locations',
    excelColumns: commonColumns.location,
    excelData: locations,
    filename: 'locations-export',
    sheetName: 'Locations',
    fetchAllData: async () => {
      const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v && v !== '' && v !== 'all'))
      const params = new URLSearchParams({ page: '1', limit: '10000', search: search || '', ...cleanFilters })
      const res = await fetch(`/api/locations?${params}`)
      const data = await res.json()
      const all: Location[] = data.locations || []
      return { rows: makeExportRows(all), excelData: all }
    },
  }), [locations, totalCount, filters, search])

  const customExportFilters = useMemo(() => ({
    statuses: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
    filterData: ({ status, dateFrom, dateTo }: any) => {
      let filtered = locations
      if (status === 'active') filtered = filtered.filter(l => l.isActive)
      if (status === 'inactive') filtered = filtered.filter(l => !l.isActive)
      if (dateFrom) filtered = filtered.filter(l => new Date(l.createdAt) >= new Date(dateFrom))
      if (dateTo) filtered = filtered.filter(l => new Date(l.createdAt) <= new Date(dateTo))
      return { rows: makeExportRows(filtered), excelData: filtered }
    },
  }), [locations])

  if (loading && locations.length === 0) return <LoadingPage view={view} title="Locations" />

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 space-y-6">
      <TableFilters
        title="Locations"
        actions={
          <div className="flex items-center gap-2">
            <PageExportButton config={exportConfig} customFilters={customExportFilters} disabled={locations.length === 0} />
            <Button size="sm" onClick={() => { resetForm(); setShowForm(true) }} className="gap-2 font-bold shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />Add Location
            </Button>
          </div>
        }
        filters={filterConfigs}
        values={filters}
        onFiltersChange={updateFilters}
        searchValue={search}
        onSearchChange={updateSearch}
        loading={loading}
      />

      <DataView
        items={locations}
        view={view}
        onViewChange={setView}
        loading={loading}
        autoResponsive={true}
        onItemClick={(item) => { setSelectedDetailItem(item); setShowDetails(true) }}
        gridProps={{ renderItem: renderGridItem, columns: 3 }}
        listProps={{ headers: ['Photo', 'Location', 'Batches', 'Status', 'Created', 'Actions'], renderRow: renderListRow }}
      />

      <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalCount} itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange} onItemsPerPageChange={handleItemsPerPageChange} loading={loading} />

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm() } else setShowForm(true) }}>
        <DialogContent className="glass backdrop-blur-xl border-border/50 max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl shadow-premium animate-in zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 ml-1">Location Name <span className="text-destructive">*</span></label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Warehouse A, Showroom Floor 1" className="rounded-2xl bg-muted/20 border-border/40 h-12" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 ml-1">Address</label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address (optional)" className="rounded-2xl bg-muted/20 border-border/40 h-12" />
            </div>

            {/* Photo - Mandatory */}
            <div className="p-4 bg-muted/20 rounded-2xl border border-border/30">
              <label className="text-sm font-bold text-foreground/80 mb-3 block">
                Location Photo <span className="text-destructive">*</span>
                <span className="text-xs font-normal text-muted-foreground ml-2">— helps identify the physical location</span>
              </label>
              <ImageUpload
                key={imageResetKey}
                onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
                currentImage={formData.imageUrl}
                label={null}
              />
              {!formData.imageUrl && <p className="text-xs text-destructive mt-2 ml-1">Photo is required to identify the location</p>}
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-2xl border border-border/30 cursor-pointer"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}>
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-5 w-5 rounded-lg border-primary/30 text-primary cursor-pointer" />
              <div>
                <span className="text-sm font-bold text-foreground">Active Status</span>
                <p className="text-xs text-muted-foreground">Visible in system operations</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting || !formData.name.trim() || !formData.imageUrl}
                className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20">
                {submitting ? 'Saving...' : editingLocation ? 'Update Location' : 'Create Location'}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm() }}
                className="rounded-2xl h-12 px-6 border-border/50 font-bold">Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!deleteLocation}
        onOpenChange={(open) => !open && setDeleteLocation(null)}
        title={deleteConfirmation.title}
        description={`Are you sure you want to delete "${deleteLocation?.name}"? This cannot be undone.`}
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
        ].filter(f => f.value !== undefined)}
        imageUrl={selectedDetailItem?.imageUrl}
        onImageClick={(src) => setPreviewImage({ src, alt: selectedDetailItem?.name || '' })}
      />

      <ImagePreview isOpen={!!previewImage} onClose={() => setPreviewImage(null)} src={previewImage?.src || null} alt={previewImage?.alt || ''} />
    </div>
  )
}
