'use client'

import * as XLSX from 'xlsx'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ExportColumn {
  key: string
  label: string
  width?: number
  format?: (value: any) => string
}

export interface ExportOptions {
  filename?: string
  sheetName?: string
  columns: ExportColumn[]
  data: any[]
  includeTimestamp?: boolean
  companyName?: string
  reportTitle?: string
}

// Company brand colors (adjust these to match your logo)
const BRAND_COLORS = {
  primary: 'FF2563EB', // Blue
  secondary: 'FF1E40AF', // Darker blue
  accent: 'FF3B82F6', // Light blue
  text: 'FF1F2937', // Dark gray
  background: 'FFF8FAFC' // Light gray
}

export function exportToExcel({
  filename = 'export',
  sheetName = 'Sheet1',
  columns,
  data,
  includeTimestamp = true,
  companyName = 'Tiles Inventory Management System',
  reportTitle = 'Data Export Report'
}: ExportOptions) {
  try {
    // Create workbook
    const workbook = XLSX.utils.book_new()
    
    // Prepare data for export
    const exportData = data.map(item => {
      const row: any = {}
      columns.forEach(column => {
        const value = getNestedValue(item, column.key)
        row[column.label] = column.format ? column.format(value) : value
      })
      return row
    })

    // Create worksheet with data
    const worksheet = XLSX.utils.json_to_sheet(exportData, { origin: 'A4' })

    // Add company header
    XLSX.utils.sheet_add_aoa(worksheet, [
      [companyName],
      [reportTitle],
      [includeTimestamp ? `Generated on: ${new Date().toLocaleString()}` : ''],
      [] // Empty row before data
    ], { origin: 'A1' })

    // Set column widths
    const columnWidths = columns.map(column => ({
      wch: column.width || Math.max(column.label.length + 2, 15)
    }))
    worksheet['!cols'] = columnWidths

    // Style the header rows
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    
    // Company name styling (A1)
    if (worksheet['A1']) {
      worksheet['A1'].s = {
        font: { bold: true, sz: 16, color: { rgb: BRAND_COLORS.primary.substring(2) } },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: BRAND_COLORS.background.substring(2) } }
      }
    }

    // Report title styling (A2)
    if (worksheet['A2']) {
      worksheet['A2'].s = {
        font: { bold: true, sz: 14, color: { rgb: BRAND_COLORS.secondary.substring(2) } },
        alignment: { horizontal: 'center', vertical: 'center' }
      }
    }

    // Date styling (A3)
    if (worksheet['A3']) {
      worksheet['A3'].s = {
        font: { sz: 10, color: { rgb: BRAND_COLORS.text.substring(2) } },
        alignment: { horizontal: 'center', vertical: 'center' }
      }
    }

    // Style header row (row 4)
    for (let col = 0; col < columns.length; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 3, c: col })
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: BRAND_COLORS.primary.substring(2) } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: BRAND_COLORS.secondary.substring(2) } },
            bottom: { style: 'thin', color: { rgb: BRAND_COLORS.secondary.substring(2) } },
            left: { style: 'thin', color: { rgb: BRAND_COLORS.secondary.substring(2) } },
            right: { style: 'thin', color: { rgb: BRAND_COLORS.secondary.substring(2) } }
          }
        }
      }
    }

    // Style data rows with alternating colors and borders
    for (let row = 4; row < range.e.r + 1; row++) {
      const isEvenRow = (row - 4) % 2 === 0
      for (let col = 0; col < columns.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            font: { color: { rgb: BRAND_COLORS.text.substring(2) } },
            fill: { fgColor: { rgb: isEvenRow ? 'FFFFFF' : 'FFF8FAFC' } },
            alignment: { horizontal: 'left', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
              bottom: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
              left: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
              right: { style: 'thin', color: { rgb: 'FFE5E7EB' } }
            }
          }
        }
      }
    }

    // Merge cells for company name and title
    if (columns.length > 1) {
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } }, // Company name
        { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } }, // Report title
        { s: { r: 2, c: 0 }, e: { r: 2, c: columns.length - 1 } }  // Date
      ]
    }

    // Set print settings
    worksheet['!printHeader'] = [1, 3] // Repeat first 3 rows on each page
    worksheet['!margins'] = { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
    
    // Auto-fit columns
    const autoFitCols = columns.map((column, index) => {
      let maxLength = column.label.length
      
      // Check data lengths
      data.forEach(item => {
        const value = getNestedValue(item, column.key)
        const formattedValue = column.format ? column.format(value) : String(value || '')
        maxLength = Math.max(maxLength, formattedValue.length)
      })
      
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) }
    })
    worksheet['!cols'] = autoFitCols

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // Generate filename with timestamp if requested
    const timestamp = includeTimestamp 
      ? new Date().toISOString().split('T')[0] 
      : ''
    const finalFilename = `${filename}${timestamp ? `-${timestamp}` : ''}.xlsx`

    // Save file
    XLSX.writeFile(workbook, finalFilename)
    
    return { success: true, filename: finalFilename }
  } catch (error) {
    console.error('Export failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Export failed' }
  }
}

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : ''
  }, obj)
}

// Export button component
interface ExportButtonProps {
  data: any[]
  columns: ExportColumn[]
  filename?: string
  sheetName?: string
  reportTitle?: string
  onExportStart?: () => void
  onExportComplete?: (result: { success: boolean; filename?: string; error?: string }) => void
  disabled?: boolean
  loading?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function ExportButton({
  data,
  columns,
  filename = 'export',
  sheetName = 'Sheet1',
  reportTitle,
  onExportStart,
  onExportComplete,
  disabled = false,
  loading = false,
  variant = 'outline',
  size = 'sm',
  className = ''
}: ExportButtonProps) {
  const handleExport = async () => {
    if (onExportStart) {
      onExportStart()
    }

    const result = exportToExcel({
      filename,
      sheetName,
      columns,
      data,
      includeTimestamp: true,
      reportTitle: reportTitle || `${filename.charAt(0).toUpperCase() + filename.slice(1)} Report`
    })

    if (onExportComplete) {
      onExportComplete(result)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={disabled || loading || data.length === 0}
      className={`gap-2 ${className}`}
    >
      <Download className="h-4 w-4" />
      {loading ? 'Exporting...' : 'Export Excel'}
    </Button>
  )
}

// Enhanced column configurations with proper formatting
export const commonColumns = {
  brand: [
    { key: 'name', label: 'Brand Name', width: 25 },
    { key: 'description', label: 'Description', width: 30 },
    { key: 'contactInfo', label: 'Contact Info', width: 25 },
    { key: 'isActive', label: 'Status', width: 12, format: (value: boolean) => value ? 'Active' : 'Inactive' },
    { key: '_count.categories', label: 'Categories', width: 12, format: (value: number) => value?.toString() || '0' },
    { key: '_count.products', label: 'Products', width: 12, format: (value: number) => value?.toString() || '0' },
    { key: 'createdAt', label: 'Created Date', width: 15, format: (value: string) => new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
    { key: 'updatedAt', label: 'Updated Date', width: 15, format: (value: string) => value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '' }
  ] as ExportColumn[],

  category: [
    { key: 'name', label: 'Category Name', width: 25 },
    { key: 'brand.name', label: 'Brand', width: 20 },
    { key: 'description', label: 'Description', width: 30 },
    { key: 'isActive', label: 'Status', width: 12, format: (value: boolean) => value ? 'Active' : 'Inactive' },
    { key: '_count.products', label: 'Products', width: 12, format: (value: number) => value?.toString() || '0' },
    { key: 'createdAt', label: 'Created Date', width: 15, format: (value: string) => new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
    { key: 'updatedAt', label: 'Updated Date', width: 15, format: (value: string) => value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '' }
  ] as ExportColumn[],

  size: [
    { key: 'name', label: 'Size Name', width: 20 },
    { key: 'brand.name', label: 'Brand', width: 20 },
    { key: 'category.name', label: 'Category', width: 20 },
    { key: 'length', label: 'Length (mm)', width: 15, format: (value: number) => value?.toString() || '' },
    { key: 'width', label: 'Width (mm)', width: 15, format: (value: number) => value?.toString() || '' },
    { key: 'description', label: 'Description', width: 25 },
    { key: 'isActive', label: 'Status', width: 12, format: (value: boolean) => value ? 'Active' : 'Inactive' },
    { key: '_count.products', label: 'Products', width: 12, format: (value: number) => value?.toString() || '0' },
    { key: 'createdAt', label: 'Created Date', width: 15, format: (value: string) => new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  ] as ExportColumn[],

  location: [
    { key: 'name', label: 'Location Name', width: 25 },
    { key: 'address', label: 'Address', width: 35 },
    { key: 'isActive', label: 'Status', width: 12, format: (value: boolean) => value ? 'Active' : 'Inactive' },
    { key: '_count.batches', label: 'Inventory Batches', width: 18, format: (value: number) => value?.toString() || '0' },
    { key: 'createdAt', label: 'Created Date', width: 15, format: (value: string) => new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  ] as ExportColumn[],

  product: [
    { key: 'name', label: 'Product Name', width: 25 },
    { key: 'code', label: 'Product Code', width: 15 },
    { key: 'brand.name', label: 'Brand', width: 20 },
    { key: 'category.name', label: 'Category', width: 20 },
    { key: 'size.name', label: 'Size', width: 15 },
    { key: 'finishType.name', label: 'Finish Type', width: 20 },
    { key: 'sqftPerBox', label: 'Sq Ft/Box', width: 12, format: (value: number) => value?.toString() || '0' },
    { key: 'pcsPerBox', label: 'Pcs/Box', width: 12, format: (value: number) => value?.toString() || '0' },
    { key: 'isActive', label: 'Status', width: 10, format: (value: boolean) => value ? 'Active' : 'Inactive' },
    { key: 'createdAt', label: 'Created Date', width: 15, format: (value: string) => new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  ] as ExportColumn[]
}