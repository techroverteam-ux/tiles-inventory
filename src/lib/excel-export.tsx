'use client'

import * as XLSX from 'xlsx-js-style'
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
  headerColor?: string
}

// ─── Theme ────────────────────────────────────────────────────────────────────
// Matches the website logo: dark navy headings, clean white title rows
const BRAND_COLORS = {
  navyBg:     '1E3A8A', // Dark navy blue  — column heading background
  navyText:   '1E3A8A', // Dark navy blue  — title row text
  white:      'FFFFFF', // White           — col-heading text / row fills
  bodyText:   '1F2937', // Dark gray       — data row text
}

const TEMPLATE_STYLE = {
  fontName:        'Calibri',
  titleFontSize:   14,
  subtitleFontSize:12,
  dateFontSize:    10,
  headerFontSize:  11,
  bodyFontSize:    11,
  borderColor:     '1E3A8A', // thin navy border used everywhere
}

// Single thin border on all four sides
function allBorder(color = TEMPLATE_STYLE.borderColor) {
  const side = { style: 'thin' as const, color: { rgb: color } }
  return { top: side, bottom: side, left: side, right: side }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDateDDMMMYYYY(value: any): string {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  const day = String(date.getDate()).padStart(2, '0')
  const month = MONTHS[date.getMonth()]
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

export function exportToExcel({
  filename = 'export',
  sheetName = 'Sheet1',
  columns,
  data,
  includeTimestamp = true,
  companyName = 'Tiles Inventory Management System',
  reportTitle = 'Data Export Report',
  headerColor,
}: ExportOptions) {
  try {
    // Create workbook
    const workbook = XLSX.utils.book_new()
    
    // Prepare data for export
    const exportData = data.map(item => {
      const row: any = {}
      columns.forEach(column => {
        const value = getNestedValue(item, column.key)
        const formattedValue = column.format ? column.format(value) : value
        row[column.label] = normalizeExportValue(formattedValue)
      })
      return row
    })

    // Create worksheet and place table data starting at row 4
    const worksheet = XLSX.utils.aoa_to_sheet([])
    XLSX.utils.sheet_add_json(worksheet, exportData, {
      origin: 'A4',
      skipHeader: false
    })

    // Add company header rows (rows 1-3)
    XLSX.utils.sheet_add_aoa(worksheet, [
      [companyName],
      [reportTitle],
      [includeTimestamp ? `Generated on: ${formatDateDDMMMYYYY(new Date())}` : ''],
    ], { origin: 'A1' })

    // ── Compute range after adding all data ──────────────────────────────────
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')

    // ── Row heights ──────────────────────────────────────────────────────────
    worksheet['!rows'] = [
      { hpt: 22 }, // Row 1 – company name
      { hpt: 18 }, // Row 2 – report title
      { hpt: 16 }, // Row 3 – generated date
      { hpt: 18 }, // Row 4 – column headings
    ]

    // ── Row 4: Column headings — navy bg, white bold text, navy border ────────
    const colBg = (headerColor || BRAND_COLORS.navyBg).replace(/^#/, '').replace(/^FF/i, '').toUpperCase()
    for (let col = 0; col <= range.e.c; col++) {
      const addr = XLSX.utils.encode_cell({ r: 3, c: col })
      if (worksheet[addr]) {
        worksheet[addr].s = {
          font: { name: TEMPLATE_STYLE.fontName, bold: true, sz: TEMPLATE_STYLE.headerFontSize, color: { rgb: BRAND_COLORS.white } },
          fill: { fgColor: { rgb: colBg } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: allBorder()
        }
      }
    }

    // ── Data rows — white bg, dark text, centered, navy border ───────────────
    for (let row = 4; row <= range.e.r; row++) {
      for (let col = 0; col <= range.e.c; col++) {
        const addr = XLSX.utils.encode_cell({ r: row, c: col })
        if (worksheet[addr]) {
          worksheet[addr].s = {
            font: { name: TEMPLATE_STYLE.fontName, sz: TEMPLATE_STYLE.bodyFontSize, color: { rgb: BRAND_COLORS.bodyText } },
            fill: { fgColor: { rgb: BRAND_COLORS.white } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: allBorder()
          }
        }
      }
    }

    // Merge cells for title rows and apply border to every cell in each merge
    const lastCol = columns.length - 1
    if (columns.length > 1) {
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: lastCol } },
      ]
    }

    // Style every cell across merged title rows so Excel renders full-width borders cleanly
    const titleRowStyles = [
      { font: { name: TEMPLATE_STYLE.fontName, bold: true, sz: TEMPLATE_STYLE.titleFontSize, color: { rgb: BRAND_COLORS.navyText } }, fill: { fgColor: { rgb: BRAND_COLORS.white } }, alignment: { horizontal: 'center', vertical: 'center' } },
      { font: { name: TEMPLATE_STYLE.fontName, bold: true, sz: TEMPLATE_STYLE.subtitleFontSize, color: { rgb: BRAND_COLORS.navyText } }, fill: { fgColor: { rgb: BRAND_COLORS.white } }, alignment: { horizontal: 'center', vertical: 'center' } },
      { font: { name: TEMPLATE_STYLE.fontName, italic: true, sz: TEMPLATE_STYLE.dateFontSize, color: { rgb: BRAND_COLORS.bodyText } }, fill: { fgColor: { rgb: BRAND_COLORS.white } }, alignment: { horizontal: 'center', vertical: 'center' } },
    ]
    for (let titleRow = 0; titleRow < 3; titleRow++) {
      for (let col = 0; col <= lastCol; col++) {
        const addr = XLSX.utils.encode_cell({ r: titleRow, c: col })
        if (!worksheet[addr]) {
          worksheet[addr] = { t: 's', v: '' }
        }

        const isFirst = col === 0
        const isLast = col === lastCol

        worksheet[addr].s = {
          ...titleRowStyles[titleRow],
          border: {
            top: { style: 'thin', color: { rgb: TEMPLATE_STYLE.borderColor } },
            bottom: { style: 'thin', color: { rgb: TEMPLATE_STYLE.borderColor } },
            left: isFirst ? { style: 'thin', color: { rgb: TEMPLATE_STYLE.borderColor } } : undefined,
            right: isLast ? { style: 'thin', color: { rgb: TEMPLATE_STYLE.borderColor } } : undefined,
          },
        }
      }
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
        const formattedValue = normalizeExportValue(column.format ? column.format(value) : value)
        maxLength = Math.max(maxLength, String(formattedValue).length)
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

function normalizeExportValue(value: any): string | number | boolean {
  if (value === null || value === undefined) return 'N/A'
  if (typeof value === 'string') {
    const trimmedValue = value.trim()
    return trimmedValue === '' ? 'N/A' : trimmedValue
  }
  return value
}

function inferAlignment(key: string, value: any): 'left' | 'center' | 'right' {
  const normalizedKey = key.toLowerCase()
  if (typeof value === 'number') return 'right'
  if (normalizedKey.includes('date')) return 'center'
  if (normalizedKey.includes('status')) return 'center'
  if (normalizedKey.includes('qty') || normalizedKey.includes('quantity')) return 'right'
  if (normalizedKey.includes('price') || normalizedKey.includes('amount') || normalizedKey.includes('value')) return 'right'
  return 'left'
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
  headerColor?: string
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
  className = '',
  headerColor,
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
      reportTitle: reportTitle || `${filename.charAt(0).toUpperCase() + filename.slice(1)} Report`,
      headerColor,
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
    { key: 'createdAt', label: 'Created Date', width: 15, format: (value: string) => formatDateDDMMMYYYY(value) },
    { key: 'updatedAt', label: 'Updated Date', width: 15, format: (value: string) => formatDateDDMMMYYYY(value) }
  ] as ExportColumn[],

  category: [
    { key: 'name', label: 'Category Name', width: 25 },
    { key: 'brand.name', label: 'Brand', width: 20 },
    { key: 'description', label: 'Description', width: 30 },
    { key: 'isActive', label: 'Status', width: 12, format: (value: boolean) => value ? 'Active' : 'Inactive' },
    { key: '_count.products', label: 'Products', width: 12, format: (value: number) => value?.toString() || '0' },
    { key: 'createdAt', label: 'Created Date', width: 15, format: (value: string) => formatDateDDMMMYYYY(value) },
    { key: 'updatedAt', label: 'Updated Date', width: 15, format: (value: string) => formatDateDDMMMYYYY(value) }
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
    { key: 'createdAt', label: 'Created Date', width: 15, format: (value: string) => formatDateDDMMMYYYY(value) }
  ] as ExportColumn[],

  location: [
    { key: 'name', label: 'Location Name', width: 25 },
    { key: 'address', label: 'Address', width: 35 },
    { key: 'isActive', label: 'Status', width: 12, format: (value: boolean) => value ? 'Active' : 'Inactive' },
    { key: '_count.batches', label: 'Inventory Batches', width: 18, format: (value: number) => value?.toString() || '0' },
    { key: 'createdAt', label: 'Created Date', width: 15, format: (value: string) => formatDateDDMMMYYYY(value) }
  ] as ExportColumn[],

  product: [
    { key: 'name', label: 'Product Name', width: 25 },
    { key: 'code', label: 'Product Code', width: 15 },
    { key: 'brand.name', label: 'Brand', width: 20 },
    { key: 'category.name', label: 'Category', width: 20 },
    { key: 'size.name', label: 'Size', width: 15 },
    { key: 'sqftPerBox', label: 'Sq Ft/Box', width: 12, format: (value: number) => value?.toString() || '0' },
    { key: 'pcsPerBox', label: 'Pcs/Box', width: 12, format: (value: number) => value?.toString() || '0' },
    { key: 'isActive', label: 'Status', width: 10, format: (value: boolean) => value ? 'Active' : 'Inactive' },
    { key: 'createdBy.name', label: 'Created By', width: 15 },
    { key: 'createdAt', label: 'Created Date', width: 15, format: (value: string) => formatDateDDMMMYYYY(value) }
  ] as ExportColumn[]
}