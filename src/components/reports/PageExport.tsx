'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { FileDown, ImageDown, FileSpreadsheet, Loader2, Download, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { exportToExcel, ExportColumn } from '@/lib/excel-export'
import { cn } from '@/lib/utils'

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ jsPDF native renderer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  const PW = pdf.internal.pageSize.getWidth()
  const PH = pdf.internal.pageSize.getHeight()
  const MARGIN = 18        // mm left/right margin â€” gives white space on sides
  const FOOTER_H = 10
  const IMG_H = 62
  const BAR_H = 10
  const ROW_H = IMG_H + BAR_H
  const contentW = PW - MARGIN * 2
  const bodyBottom = PH - FOOTER_H - 6

  let page = 1

  const addFooter = (p: number, total: number) => {
    pdf.setPage(p)
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.3)
    pdf.line(MARGIN, PH - FOOTER_H, PW - MARGIN, PH - FOOTER_H)
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text(fmtFooterDate(), MARGIN, PH - FOOTER_H + 5)
    pdf.text(`Page ${p} of ${total}`, PW - MARGIN, PH - FOOTER_H + 5, { align: 'right' })
  }

  const newPage = () => {
    pdf.addPage()
    page++
    return MARGIN
  }

  let y = MARGIN

  // Title
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(15, 23, 42)
  pdf.text(cfg.title, MARGIN, y + 7)
  y += 12

  if (cfg.subtitle) {
    pdf.setFontSize(10)
    pdf.setTextColor(71, 85, 105)
    pdf.text(cfg.subtitle.toUpperCase(), MARGIN, y + 4)
    y += 8
  }

  y += 2

  for (const row of cfg.rows) {
    if (y + ROW_H > bodyBottom) {
      y = newPage()
    }

    const rx = MARGIN
    const ry = y

    // Outer border
    pdf.setDrawColor(30, 58, 138)
    pdf.setLineWidth(0.5)
    pdf.rect(rx, ry, contentW, ROW_H)

    // Image â€” full width, object-fit cover
    if (row.imageUrl) {
      const img = await loadImage(row.imageUrl)
      if (img) {
        // Calculate cover crop: fill contentW x IMG_H without stretching
        const imgAspect = img.naturalWidth / img.naturalHeight
        const boxAspect = contentW / IMG_H
        let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight
        if (imgAspect > boxAspect) {
          sw = img.naturalHeight * boxAspect
          sx = (img.naturalWidth - sw) / 2
        } else {
          sh = img.naturalWidth / boxAspect
          sy = (img.naturalHeight - sh) / 2
        }
        // Draw cropped image using canvas
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(sw)
        canvas.height = Math.round(sh)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', rx, ry, contentW, IMG_H)
      } else {
        pdf.setFillColor(241, 245, 249)
        pdf.rect(rx, ry, contentW, IMG_H, 'F')
        pdf.setFontSize(9)
        pdf.setTextColor(148, 163, 184)
        pdf.text('No Image', rx + contentW / 2, ry + IMG_H / 2, { align: 'center' })
      }
    } else {
      pdf.setFillColor(241, 245, 249)
      pdf.rect(rx, ry, contentW, IMG_H, 'F')
      pdf.setFontSize(9)
      pdf.setTextColor(148, 163, 184)
      pdf.text('No Image', rx + contentW / 2, ry + IMG_H / 2, { align: 'center' })
    }

    // Info bar
    const barY = ry + IMG_H
    pdf.setFillColor(255, 255, 255)
    pdf.rect(rx, barY, contentW, BAR_H, 'F')
    pdf.setDrawColor(30, 58, 138)
    pdf.setLineWidth(0.4)
    pdf.line(rx, barY, rx + contentW, barY)

    // Info bar text: CODE (bold left) | col2 (center-left) | col1 (center) | Total label | QTY (bold right)
    const barTextY = barY + BAR_H * 0.68
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(15, 23, 42)
    pdf.text(row.col3, rx + 2, barTextY)  // product name/code â€” left

    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(71, 85, 105)
    pdf.text(row.col2, rx + contentW * 0.38, barTextY, { align: 'center' })  // size
    pdf.text(row.col1, rx + contentW * 0.58, barTextY, { align: 'center' })  // category/brand

    if (row.qty !== undefined) {
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(71, 85, 105)
      pdf.text('Total', rx + contentW * 0.76, barTextY, { align: 'center' })
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(15, 23, 42)
      pdf.setFontSize(10)
      pdf.text(String(row.qty), rx + contentW - 2, barTextY, { align: 'right' })
    }

    y += ROW_H + 3  // 3mm gap between cards
  }
  if (cfg.grandTotalLabel) {
    if (y + 12 > bodyBottom) y = newPage()
    y += 4
    pdf.setDrawColor(30, 41, 59)
    pdf.setLineWidth(0.5)
    pdf.line(MARGIN, y, PW - MARGIN, y)
    y += 6
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(71, 85, 105)
    pdf.text(cfg.grandTotalLabel.toUpperCase(), PW - MARGIN - 25, y, { align: 'right' })
    pdf.setFontSize(13)
    pdf.setTextColor(15, 23, 42)
    pdf.text(String(cfg.grandTotal ?? ''), PW - MARGIN, y, { align: 'right' })
  }

  // Stamp footers with correct page total
  for (let p = 1; p <= page; p++) addFooter(p, page)

  return pdf
}

// --- Shared export engine ---
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

    // PNG â€” build DOM container matching the PDF layout
    const { default: html2canvas } = await import('html2canvas')
    const container = document.createElement('div')
    container.style.cssText = 'position:fixed;left:-9999px;top:0;background:#fff;font-family:Arial,sans-serif;padding:28px 32px 32px;width:700px;box-sizing:border-box;'
    document.body.appendChild(container)

    // Title
    const titleEl = document.createElement('div')
    titleEl.style.cssText = 'font-weight:bold;font-size:20px;margin-bottom:14px;color:#0f172a;'
    titleEl.textContent = activeCfg.title
    container.appendChild(titleEl)

    for (const row of activeCfg.rows) {
      const card = document.createElement('div')
      card.style.cssText = 'border:2px solid #1e3a8a;margin-bottom:10px;'

      // Image
      const imgWrap = document.createElement('div')
      imgWrap.style.cssText = 'width:100%;height:220px;overflow:hidden;background:#f1f5f9;'
      if (row.imageUrl) {
        const img = document.createElement('img')
        img.src = row.imageUrl
        img.crossOrigin = 'anonymous'
        img.style.cssText = 'width:100%;height:220px;object-fit:cover;display:block;'
        imgWrap.appendChild(img)
      } else {
        imgWrap.style.cssText += 'display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:13px;'
        imgWrap.textContent = 'No Image'
      }
      card.appendChild(imgWrap)

      // Info bar
      const bar = document.createElement('div')
      bar.style.cssText = 'display:flex;align-items:center;padding:6px 10px;border-top:1.5px solid #1e3a8a;background:#fff;gap:0;'
      bar.innerHTML = `
        <span style="font-weight:bold;font-size:13px;color:#0f172a;flex:2;">${row.col3}</span>
        <span style="font-size:11px;color:#475569;flex:1.2;text-align:center;">${row.col2}</span>
        <span style="font-size:11px;color:#475569;flex:1.2;text-align:center;">${row.col1}</span>
        <span style="font-size:11px;color:#475569;flex:0.8;text-align:center;">Total</span>
        <span style="font-weight:bold;font-size:14px;color:#0f172a;flex:0.6;text-align:right;">${row.qty ?? ''}</span>
      `
      card.appendChild(bar)
      container.appendChild(card)
    }

    // Grand total
    if (activeCfg.grandTotalLabel) {
      const gt = document.createElement('div')
      gt.style.cssText = 'display:flex;justify-content:flex-end;align-items:center;gap:16px;margin-top:16px;padding-top:12px;border-top:2px solid #1e293b;font-weight:bold;font-size:13px;'
      gt.innerHTML = `<span style="color:#475569;text-transform:uppercase;letter-spacing:0.05em">${activeCfg.grandTotalLabel}</span><span style="font-size:18px;color:#0f172a">${activeCfg.grandTotal}</span>`
      container.appendChild(gt)
    }

    // Footer
    const footer = document.createElement('div')
    footer.style.cssText = 'display:flex;justify-content:space-between;margin-top:24px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;'
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

// --- Format picker (3 cards) ---
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

// --- Custom Export filter options ---
export interface CustomExportFilters {
  brands?: { id: string; name: string }[]
  categories?: { id: string; name: string }[]
  sizes?: { id: string; name: string }[]
  statuses?: { value: string; label: string }[]
  /** Called with filtered rows + filtered excelData */
  filterData: (opts: { brandId: string; categoryId: string; sizeId: string; status: string; dateFrom: string; dateTo: string }) => { rows: ReportRow[]; excelData: any[] }
}

// --- Main Export Button (Default + Custom) ---
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
            <DialogTitle className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Export All {config.title}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-1 mb-1">Exports all {config.excelData.length} records</p>
          <FormatCards onPick={(f) => { setShowDefault(false); doExport(f, config) }} exporting={!!exporting} />
          {exporting && <div className="flex items-center justify-center gap-2 pt-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Exporting {exporting.toUpperCase()}...</div>}
        </DialogContent>
      </Dialog>

      {/* Custom Export dialog */}
      {customFilters && (
        <Dialog open={showCustom} onOpenChange={setShowCustom}>
          <DialogContent className="glass backdrop-blur-xl border-border/50 w-[96vw] max-w-2xl lg:max-w-3xl rounded-3xl shadow-premium animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Custom Export {config.title}</DialogTitle>
            </DialogHeader>
              <div className="space-y-4 sm:space-y-5 pt-1">
              {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[11px] font-bold text-foreground/70 ml-0.5">Date From</label>
                  <DatePicker 
                    date={dateFrom} 
                    onChange={(d) => setDateFrom(d ? d.toISOString().split('T')[0] : '')} 
                    placeholder="From Date"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[11px] font-bold text-foreground/70 ml-0.5">Date To</label>
                  <DatePicker 
                    date={dateTo} 
                    onChange={(d) => setDateTo(d ? d.toISOString().split('T')[0] : '')} 
                    placeholder="To Date"
                    className="rounded-xl"
                  />
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


