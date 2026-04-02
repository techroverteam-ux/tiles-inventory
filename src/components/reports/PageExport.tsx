'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { FileDown, ImageDown, FileSpreadsheet, Loader2, Download, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { exportToExcel, ExportColumn } from '@/lib/excel-export'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ReportRow {
  imageUrl?: string
  col1: string   // e.g. finish/category
  col2: string   // e.g. size
  col3: string   // e.g. code / order number (bold)
  qty?: number   // large number shown in QTY column
  badge?: string // status badge
}

export interface PageExportConfig {
  title: string
  subtitle?: string
  partyName?: string
  rows: ReportRow[]
  grandTotal?: number
  grandTotalLabel?: string
  excelColumns: ExportColumn[]
  excelData: any[]
  filename: string
  sheetName?: string
  /** If provided, called before PDF/PNG export to fetch ALL records (ignores pagination) */
  fetchAllData?: () => Promise<{ rows: ReportRow[]; excelData: any[] }>
}

// ─── jsPDF native renderer ───────────────────────────────────────────────────
const MARGIN = 14        // mm left/right margin
const FOOTER_H = 10     // mm reserved at bottom for footer
const ROW_IMG_H = 38    // mm — image cell height per row

function fmtFooterDate() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

async function buildPDF(cfg: PageExportConfig): Promise<import('jspdf').jsPDF> {
  const { default: jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW = pdf.internal.pageSize.getWidth()   // 210
  const PH = pdf.internal.pageSize.getHeight()  // 297
  const contentW = PW - MARGIN * 2
  const bodyBottom = PH - FOOTER_H - 6

  let page = 1
  const pages: number[] = []  // track page starts to fill total later

  const addFooter = (p: number) => {
    pdf.setPage(p)
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.3)
    pdf.line(MARGIN, PH - FOOTER_H, PW - MARGIN, PH - FOOTER_H)
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text(fmtFooterDate(), MARGIN, PH - FOOTER_H + 5)
    pdf.text(`Page ${p}`, PW - MARGIN, PH - FOOTER_H + 5, { align: 'right' })
  }

  const newPage = () => {
    addFooter(page)
    pdf.addPage()
    page++
    return MARGIN + 6  // top margin on new page
  }

  let y = MARGIN

  // ── Title ──
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(15, 23, 42)
  pdf.text(cfg.title, MARGIN, y + 8)
  y += 14

  if (cfg.subtitle) {
    pdf.setFontSize(11)
    pdf.setTextColor(71, 85, 105)
    pdf.text(cfg.subtitle.toUpperCase(), MARGIN, y + 5)
    y += 9
  }

  if (cfg.partyName) {
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(30, 58, 138)
    pdf.text(`Party: ${cfg.partyName}`, MARGIN, y + 5)
    y += 9
  }

  y += 2

  // ── ITEM DESCRIPTION header ──
  pdf.setFillColor(241, 245, 249)
  pdf.setDrawColor(30, 58, 138)
  pdf.setLineWidth(0.5)
  pdf.rect(MARGIN, y, contentW, 8, 'FD')
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(30, 41, 59)
  pdf.text('ITEM DESCRIPTION', PW / 2, y + 5.5, { align: 'center' })
  y += 8

  // Column widths (mm)
  const metaW = contentW * 0.28
  const qtyW  = contentW * 0.12
  const imgW  = contentW - metaW - qtyW

  // ── Rows ──
  for (const row of cfg.rows) {
    const rowH = ROW_IMG_H

    // Check if row fits — if not, start new page and re-draw header
    if (y + rowH > bodyBottom) {
      y = newPage()
      // Re-draw header on new page
      pdf.setFillColor(241, 245, 249)
      pdf.setDrawColor(30, 58, 138)
      pdf.setLineWidth(0.5)
      pdf.rect(MARGIN, y, contentW, 8, 'FD')
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(30, 41, 59)
      pdf.text('ITEM DESCRIPTION', PW / 2, y + 5.5, { align: 'center' })
      y += 8
    }

    const rx = MARGIN
    const ry = y

    // Row outer border
    pdf.setDrawColor(209, 213, 219)
    pdf.setLineWidth(0.3)
    pdf.rect(rx, ry, contentW, rowH)

    // Meta cell (col1, col2, col3, badge)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 116, 139)
    pdf.text(row.col1, rx + 3, ry + 6)
    pdf.text(row.col2, rx + 3, ry + 11)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(15, 23, 42)
    pdf.setFontSize(9)
    const nameLines = pdf.splitTextToSize(row.col3, metaW - 6)
    pdf.text(nameLines, rx + 3, ry + 17)
    if (row.badge) {
      const badgeY = ry + 17 + nameLines.length * 4 + 2
      pdf.setFillColor(241, 245, 249)
      pdf.setDrawColor(203, 213, 225)
      pdf.setLineWidth(0.2)
      pdf.roundedRect(rx + 3, badgeY - 3, 20, 5, 1, 1, 'FD')
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(51, 65, 85)
      pdf.text(row.badge, rx + 13, badgeY + 0.5, { align: 'center' })
    }

    // Divider between meta and qty
    pdf.setDrawColor(209, 213, 219)
    pdf.setLineWidth(0.3)
    pdf.line(rx + metaW, ry, rx + metaW, ry + rowH)

    // QTY cell
    if (row.qty !== undefined) {
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 116, 139)
      pdf.text('QTY', rx + metaW + qtyW / 2, ry + 8, { align: 'center' })
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(15, 23, 42)
      pdf.text(String(row.qty), rx + metaW + qtyW / 2, ry + 22, { align: 'center' })
    }

    // Divider between qty and image
    pdf.setDrawColor(209, 213, 219)
    pdf.line(rx + metaW + qtyW, ry, rx + metaW + qtyW, ry + rowH)

    // Image cell
    const imgX = rx + metaW + qtyW
    if (row.imageUrl) {
      const img = await loadImage(row.imageUrl)
      if (img) {
        pdf.addImage(img, 'JPEG', imgX + 0.5, ry + 0.5, imgW - 1, rowH - 1)
      } else {
        pdf.setFillColor(248, 250, 252)
        pdf.rect(imgX, ry, imgW, rowH, 'F')
        pdf.setFontSize(8)
        pdf.setTextColor(148, 163, 184)
        pdf.text('No Image', imgX + imgW / 2, ry + rowH / 2, { align: 'center' })
      }
    } else {
      pdf.setFillColor(248, 250, 252)
      pdf.rect(imgX, ry, imgW, rowH, 'F')
      pdf.setFontSize(8)
      pdf.setTextColor(148, 163, 184)
      pdf.text('No Image', imgX + imgW / 2, ry + rowH / 2, { align: 'center' })
    }

    y += rowH
  }

  // ── Grand Total ──
  if (cfg.grandTotalLabel) {
    if (y + 14 > bodyBottom) y = newPage()
    y += 4
    pdf.setDrawColor(30, 41, 59)
    pdf.setLineWidth(0.5)
    pdf.line(MARGIN, y, PW - MARGIN, y)
    y += 6
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(71, 85, 105)
    pdf.text(cfg.grandTotalLabel.toUpperCase(), PW - MARGIN - 30, y, { align: 'right' })
    pdf.setFontSize(14)
    pdf.setTextColor(15, 23, 42)
    pdf.text(String(cfg.grandTotal ?? ''), PW - MARGIN, y, { align: 'right' })
  }

  // Footer on last page
  addFooter(page)

  // Update all footers with correct total page count
  for (let p = 1; p <= page; p++) {
    pdf.setPage(p)
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    // Overwrite page number with "Page X of Y"
    pdf.setFillColor(255, 255, 255)
    pdf.rect(PW - MARGIN - 30, PH - FOOTER_H + 1, 32, 6, 'F')
    pdf.text(`Page ${p} of ${page}`, PW - MARGIN, PH - FOOTER_H + 5, { align: 'right' })
  }

  return pdf
}

// ─── Shared export engine ────────────────────────────────────────────────────
async function runExport(
  fmt: 'excel' | 'pdf' | 'png',
  cfg: PageExportConfig,
  _divRef: React.RefObject<HTMLDivElement | null>,
  setExporting: (v: 'excel' | 'pdf' | 'png' | null) => void,
  _setShowHidden: (v: boolean) => void
) {
  setExporting(fmt)
  try {
    // Fetch all data if callback provided (bypass pagination)
    let activeCfg = cfg
    if (fmt !== 'excel' && cfg.fetchAllData) {
      const { rows, excelData } = await cfg.fetchAllData()
      activeCfg = { ...cfg, rows, excelData }
    } else if (fmt === 'excel' && cfg.fetchAllData) {
      const { excelData } = await cfg.fetchAllData()
      activeCfg = { ...cfg, excelData }
    }

    if (fmt === 'excel') {
      exportToExcel({ filename: activeCfg.filename, sheetName: activeCfg.sheetName || 'Report', columns: activeCfg.excelColumns, data: activeCfg.excelData, reportTitle: activeCfg.title })
      return
    }

    if (fmt === 'pdf') {
      const pdf = await buildPDF(activeCfg)
      pdf.save(`${activeCfg.filename}-${Date.now()}.pdf`)
      return
    }

    // PNG — render all rows into one tall canvas via html2canvas on a hidden div
    const { default: html2canvas } = await import('html2canvas')
    // Build a temporary DOM node
    const container = document.createElement('div')
    container.style.cssText = 'position:fixed;left:-9999px;top:0;background:#fff;font-family:Arial,sans-serif;padding:40px 50px;width:880px;box-sizing:border-box;'
    document.body.appendChild(container)

    // Title
    const titleEl = document.createElement('div')
    titleEl.style.cssText = 'font-weight:bold;font-size:22px;margin-bottom:12px;color:#0f172a;'
    titleEl.textContent = activeCfg.title
    container.appendChild(titleEl)

    if (activeCfg.partyName) {
      const pEl = document.createElement('div')
      pEl.style.cssText = 'font-size:12px;color:#1e3a8a;margin-bottom:12px;'
      pEl.textContent = `Party: ${activeCfg.partyName}`
      container.appendChild(pEl)
    }

    // Header row
    const hdr = document.createElement('div')
    hdr.style.cssText = 'background:#f1f5f9;border:2px solid #1e3a8a;padding:7px 14px;text-align:center;font-size:11px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;color:#1e293b;'
    hdr.textContent = 'ITEM DESCRIPTION'
    container.appendChild(hdr)

    for (const row of activeCfg.rows) {
      const rowEl = document.createElement('div')
      rowEl.style.cssText = 'display:flex;border-left:2px solid #1e3a8a;border-right:2px solid #1e3a8a;border-bottom:1px solid #d1d5db;'

      // Meta
      const meta = document.createElement('div')
      meta.style.cssText = 'width:22%;padding:14px 16px;border-right:1px solid #d1d5db;font-size:12px;line-height:1.8;flex-shrink:0;'
      meta.innerHTML = `<div style="color:#64748b;font-size:11px">${row.col1}</div><div style="color:#64748b;font-size:11px">${row.col2}</div><div style="font-weight:bold;font-size:13px;color:#0f172a;margin-top:4px">${row.col3}</div>${row.badge ? `<div style="margin-top:6px;display:inline-block;padding:2px 8px;background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;border-radius:4px;font-size:10px;font-weight:bold">${row.badge}</div>` : ''}`
      rowEl.appendChild(meta)

      // QTY
      if (row.qty !== undefined) {
        const qty = document.createElement('div')
        qty.style.cssText = 'width:12%;padding:14px 8px;border-right:1px solid #d1d5db;text-align:center;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;'
        qty.innerHTML = `<div style="font-size:9px;color:#64748b;letter-spacing:0.08em;margin-bottom:6px">QTY</div><div style="font-weight:bold;font-size:26px;color:#0f172a">${row.qty}</div>`
        rowEl.appendChild(qty)
      }

      // Image
      const imgCell = document.createElement('div')
      imgCell.style.cssText = 'flex:1;overflow:hidden;background:#f8fafc;'
      if (row.imageUrl) {
        const img = document.createElement('img')
        img.src = row.imageUrl
        img.crossOrigin = 'anonymous'
        img.style.cssText = 'width:100%;height:140px;object-fit:cover;display:block;'
        imgCell.appendChild(img)
      } else {
        imgCell.style.cssText += 'height:140px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:11px;'
        imgCell.textContent = 'No Image'
      }
      rowEl.appendChild(imgCell)
      container.appendChild(rowEl)
    }

    // Grand total
    if (activeCfg.grandTotalLabel) {
      const gt = document.createElement('div')
      gt.style.cssText = 'display:flex;justify-content:flex-end;align-items:center;gap:16px;margin-top:20px;padding-top:14px;border-top:2px solid #1e293b;font-weight:bold;font-size:14px;'
      gt.innerHTML = `<span style="color:#475569;text-transform:uppercase;letter-spacing:0.05em">${activeCfg.grandTotalLabel}</span><span style="font-size:20px;color:#0f172a">${activeCfg.grandTotal}</span>`
      container.appendChild(gt)
    }

    // Footer
    const footer = document.createElement('div')
    footer.style.cssText = 'display:flex;justify-content:space-between;margin-top:32px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;'
    footer.innerHTML = `<span>${fmtFooterDate()}</span><span>Page 1 of 1</span>`
    container.appendChild(footer)

    await new Promise(r => setTimeout(r, 300))
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#fff', logging: false })
    document.body.removeChild(container)

    const a = document.createElement('a')
    a.download = `${activeCfg.filename}-${Date.now()}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  } finally {
    setExporting(null)
  }
}

// ─── Format picker (3 cards) ─────────────────────────────────────────────────
function FormatCards({ onPick, exporting }: { onPick: (f: 'excel' | 'pdf' | 'png') => void; exporting: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <button onClick={() => onPick('excel')} disabled={exporting} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950 transition-all">
        <FileSpreadsheet className="h-6 w-6 text-green-600" />
        <span className="text-[11px] font-bold text-green-700 dark:text-green-400">Excel</span>
      </button>
      <button onClick={() => onPick('pdf')} disabled={exporting} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950 transition-all">
        <FileDown className="h-6 w-6 text-red-600" />
        <span className="text-[11px] font-bold text-red-700 dark:text-red-400">PDF</span>
      </button>
      <button onClick={() => onPick('png')} disabled={exporting} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950 transition-all">
        <ImageDown className="h-6 w-6 text-purple-600" />
        <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400">PNG</span>
      </button>
    </div>
  )
}

// ─── Custom Export filter options ────────────────────────────────────────────
export interface CustomExportFilters {
  brands?: { id: string; name: string }[]
  categories?: { id: string; name: string }[]
  sizes?: { id: string; name: string }[]
  statuses?: { value: string; label: string }[]
  /** Called with filtered rows + filtered excelData */
  filterData: (opts: { brandId: string; categoryId: string; sizeId: string; status: string; dateFrom: string; dateTo: string }) => { rows: ReportRow[]; excelData: any[] }
}

// ─── Main Export Button (Default + Custom) ───────────────────────────────────
interface PageExportButtonProps {
  config: PageExportConfig
  customFilters?: CustomExportFilters
  disabled?: boolean
  className?: string
}

export function PageExportButton({ config, customFilters, disabled, className }: PageExportButtonProps) {
  const [exporting, setExporting] = useState<'excel' | 'pdf' | 'png' | null>(null)
  const [showDefault, setShowDefault] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // Custom filter state
  const [brandId, setBrandId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [sizeId, setSizeId] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [customCfg, setCustomCfg] = useState<PageExportConfig | null>(null)

  const isDisabled = disabled || config.excelData.length === 0

  const doExport = (fmt: 'excel' | 'pdf' | 'png', cfg: PageExportConfig) =>
    runExport(fmt, cfg, null as any, setExporting, null as any)

  const applyCustomAndOpen = () => {
    if (!customFilters) return
    const { rows, excelData } = customFilters.filterData({ brandId, categoryId, sizeId, status, dateFrom, dateTo })
    setCustomCfg({ ...config, rows, excelData })
    setShowCustom(true)
    setShowMenu(false)
  }

  return (
    <>
      {/* Default Export dialog */}
      <Dialog open={showDefault} onOpenChange={setShowDefault}>
        <DialogContent className="glass backdrop-blur-xl border-border/50 max-w-xs w-[92vw] rounded-3xl shadow-premium animate-in zoom-in-95 duration-200 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Export All — {config.title}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-1 mb-1">Exports all {config.excelData.length} records</p>
          <FormatCards onPick={(f) => { setShowDefault(false); doExport(f, config) }} exporting={!!exporting} />
          {exporting && <div className="flex items-center justify-center gap-2 pt-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Exporting {exporting.toUpperCase()}...</div>}
        </DialogContent>
      </Dialog>

      {/* Custom Export dialog */}
      {customFilters && (
        <Dialog open={showCustom} onOpenChange={setShowCustom}>
          <DialogContent className="glass backdrop-blur-xl border-border/50 max-w-sm w-[95vw] rounded-3xl shadow-premium animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Custom Export — {config.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-1">
              {/* Filters */}
              <div className="grid grid-cols-2 gap-2">
                {customFilters.brands && customFilters.brands.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground/70 ml-0.5">Brand</label>
                    <Select value={brandId || '__all__'} onValueChange={v => setBrandId(v === '__all__' ? '' : v)}>
                      <SelectTrigger className="rounded-xl bg-muted/20 border-border/40 h-9 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="__all__">All Brands</SelectItem>
                        {customFilters.brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {customFilters.categories && customFilters.categories.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground/70 ml-0.5">Category</label>
                    <Select value={categoryId || '__all__'} onValueChange={v => setCategoryId(v === '__all__' ? '' : v)}>
                      <SelectTrigger className="rounded-xl bg-muted/20 border-border/40 h-9 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="__all__">All Categories</SelectItem>
                        {customFilters.categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {customFilters.sizes && customFilters.sizes.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground/70 ml-0.5">Size</label>
                    <Select value={sizeId || '__all__'} onValueChange={v => setSizeId(v === '__all__' ? '' : v)}>
                      <SelectTrigger className="rounded-xl bg-muted/20 border-border/40 h-9 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="__all__">All Sizes</SelectItem>
                        {customFilters.sizes.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {customFilters.statuses && customFilters.statuses.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground/70 ml-0.5">Status</label>
                    <Select value={status || '__all__'} onValueChange={v => setStatus(v === '__all__' ? '' : v)}>
                      <SelectTrigger className="rounded-xl bg-muted/20 border-border/40 h-9 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="__all__">All</SelectItem>
                        {customFilters.statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground/70 ml-0.5">Date From</label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="rounded-xl bg-muted/20 border-border/40 h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground/70 ml-0.5">Date To</label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="rounded-xl bg-muted/20 border-border/40 h-9 text-xs" />
                </div>
              </div>
              {customCfg && (
                <p className="text-xs text-muted-foreground">{customCfg.excelData.length} record(s) match filters</p>
              )}
              <div className="pt-1">
                <p className="text-[11px] font-bold text-foreground/60 mb-2">Choose format</p>
                <FormatCards onPick={(f) => { setShowCustom(false); doExport(f, customCfg || config) }} exporting={!!exporting} />
              </div>
              {exporting && <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Exporting {exporting.toUpperCase()}...</div>}
              <Button variant="outline" size="sm" onClick={applyCustomAndOpen} className="w-full rounded-xl h-9 text-xs font-bold border-primary/30 text-primary hover:bg-primary/5">
                Apply Filters & Refresh Count
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dropdown menu */}
      <div className="relative">
        {customFilters ? (
          <div className="flex items-center">
            <Button variant="outline" size="sm" onClick={() => { setShowMenu(false); setShowDefault(true) }} disabled={isDisabled}
              className={cn('gap-1.5 rounded-l-xl rounded-r-none border-r-0 border-border/50 font-bold h-9', className)}>
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline text-xs">Export</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowMenu(m => !m)} disabled={isDisabled}
              className="rounded-l-none rounded-r-xl border-border/50 font-bold h-9 px-2">
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border/50 rounded-2xl shadow-premium overflow-hidden min-w-[160px]">
                <button onClick={() => { setShowMenu(false); setShowDefault(true) }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-muted/50 transition-colors">
                  <Download className="h-4 w-4" />Default Export
                </button>
                <button onClick={() => { applyCustomAndOpen() }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-muted/50 transition-colors border-t border-border/30">
                  <SlidersHorizontal className="h-4 w-4" />Custom Export
                </button>
              </div>
            )}
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowDefault(true)} disabled={isDisabled}
            className={cn('gap-2 rounded-xl border-border/50 font-bold h-9', className)}>
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline text-xs">Export</span>
          </Button>
        )}
      </div>
    </>
  )
}

// --- SmartExportModal - kept for backward compatibility (categories page) ---
export interface SmartExportOption { label: string; value: string }

interface SmartExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  brands?: { id: string; name: string }[]
  categories?: { id: string; name: string }[]
  sizes?: { id: string; name: string }[]
  reportTypes: SmartExportOption[]
  onExport: (opts: { format: 'excel' | 'pdf' | 'png'; reportType: string; brandId?: string; categoryId?: string; sizeId?: string; status: string }) => void
  exporting?: boolean
}

export function SmartExportModal({ open, onOpenChange, title, brands = [], reportTypes, onExport, exporting }: SmartExportModalProps) {
  const [format, setFormat] = useState<'excel' | 'pdf' | 'png'>('excel')
  const [reportType, setReportType] = useState(reportTypes[0]?.value || '')
  const [brandId, setBrandId] = useState('')
  const [status, setStatus] = useState('all')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass backdrop-blur-xl border-border/50 max-w-sm w-[95vw] rounded-3xl shadow-premium animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Export {title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-3 gap-2">
            {(['excel','pdf','png'] as const).map(f=>(
              <button key={f} type="button" onClick={()=>setFormat(f)} className={cn('flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all',format===f?'border-primary bg-primary/10':'border-border/40 hover:border-primary/30')}>
                {f==='excel'&&<FileSpreadsheet className="h-5 w-5 text-green-600"/>}
                {f==='pdf'&&<FileDown className="h-5 w-5 text-red-600"/>}
                {f==='png'&&<ImageDown className="h-5 w-5 text-purple-600"/>}
                <span className={cn('text-[11px] font-bold',format===f?'text-primary':'text-muted-foreground')}>{f.toUpperCase()}</span>
              </button>
            ))}
          </div>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="rounded-2xl bg-muted/20 border-border/40 h-10 text-sm"><SelectValue/></SelectTrigger>
            <SelectContent className="rounded-2xl">{reportTypes.map(rt=><SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>)}</SelectContent>
          </Select>
          {brands.length>0&&(
            <Select value={brandId||'__all__'} onValueChange={v=>setBrandId(v==='__all__'?'':v)}>
              <SelectTrigger className="rounded-xl bg-muted/20 border-border/40 h-9 text-xs"><SelectValue placeholder="All Brands"/></SelectTrigger>
              <SelectContent className="rounded-xl"><SelectItem value="__all__">All Brands</SelectItem>{brands.map(b=><SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="rounded-xl bg-muted/20 border-border/40 h-9 text-xs"><SelectValue/></SelectTrigger>
            <SelectContent className="rounded-xl"><SelectItem value="all">All</SelectItem><SelectItem value="active">Active Only</SelectItem><SelectItem value="inactive">Inactive Only</SelectItem></SelectContent>
          </Select>
          <Button onClick={()=>onExport({format,reportType,brandId:brandId||undefined,status})} disabled={exporting} className="w-full rounded-2xl h-11 font-bold shadow-lg shadow-primary/20 gap-2">
            {exporting?<Loader2 className="h-4 w-4 animate-spin"/>:<Download className="h-4 w-4"/>}
            {exporting?'Exporting...':`Export as ${format.toUpperCase()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
