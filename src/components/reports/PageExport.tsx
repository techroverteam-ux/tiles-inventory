'use client'

import { useRef, useState } from 'react'
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
  qty?: number   // large number shown in PRE column
  badge?: string // status badge
}

export interface PageExportConfig {
  title: string          // "Products Report"
  subtitle?: string      // brand name or section header
  partyName?: string
  rows: ReportRow[]
  grandTotal?: number
  grandTotalLabel?: string
  excelColumns: ExportColumn[]
  excelData: any[]
  filename: string
  sheetName?: string
}

// ─── Printable Report (same layout as Design Stock Report) ───────────────────
const NAVY = '#1E3A8A'
const NB = `2px solid ${NAVY}`
const CB = `1px solid ${NAVY}`

function fmtDate(v: any) {
  if (!v) return ''
  const d = v instanceof Date ? v : new Date(v)
  if (isNaN(d.getTime())) return String(v)
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

interface PrintableProps { cfg: PageExportConfig; divRef: React.RefObject<HTMLDivElement | null> }

function PrintableReport({ cfg, divRef }: PrintableProps) {
  return (
    <div ref={divRef} style={{
      backgroundColor: '#fff', color: '#000',
      fontFamily: 'Arial, Helvetica, sans-serif',
      padding: '40px 50px 50px', minWidth: '680px', maxWidth: '880px',
      margin: '0 auto', boxSizing: 'border-box',
    }}>
      {/* Title */}
      <div style={{ fontWeight: 'bold', fontSize: '22px', marginBottom: '8px' }}>{cfg.title}</div>
      {cfg.subtitle && <div style={{ fontWeight: 'bold', fontSize: '15px', textTransform: 'uppercase', marginBottom: '12px' }}>{cfg.subtitle}</div>}

      {/* Party Name */}
      {cfg.partyName && (
        <div style={{ display: 'flex', border: NB, marginBottom: '18px', fontSize: '13px' }}>
          <div style={{ padding: '6px 14px', color: NAVY, fontWeight: 'bold', borderRight: NB, whiteSpace: 'nowrap' }}>Party Name:</div>
          <div style={{ padding: '6px 14px' }}>{cfg.partyName}</div>
        </div>
      )}

      {/* ITEM DESCRIPTION header */}
      <div style={{ border: NB, padding: '6px 14px', color: NAVY, fontWeight: 'bold', textAlign: 'center', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        ITEM DESCRIPTION
      </div>

      {/* Rows */}
      {cfg.rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', border: CB, borderTop: 'none' }}>
          {/* Col 1 — meta */}
          <div style={{ width: '20%', minWidth: '120px', padding: '12px 14px', borderRight: CB, fontSize: '12px', lineHeight: '1.7', flexShrink: 0 }}>
            <div>{row.col1}</div>
            <div>{row.col2}</div>
            <div style={{ fontWeight: 'bold', marginTop: '4px' }}>{row.col3}</div>
            {row.badge && <div style={{ marginTop: '4px', display: 'inline-block', padding: '1px 6px', background: NAVY, color: '#fff', borderRadius: '3px', fontSize: '10px', fontWeight: 'bold' }}>{row.badge}</div>}
          </div>
          {/* Col 2 — qty */}
          {row.qty !== undefined && (
            <div style={{ width: '10%', minWidth: '60px', padding: '12px 8px', borderRight: CB, textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontWeight: 'bold', fontSize: '10px', letterSpacing: '0.05em', marginBottom: '4px' }}>PRE</div>
              <div style={{ fontWeight: 'bold', fontSize: '28px', lineHeight: '1' }}>{row.qty}</div>
            </div>
          )}
          {/* Col 3 — image */}
          <div style={{ flex: '1', backgroundColor: NAVY, overflow: 'hidden', borderRight: CB, position: 'relative' }}>
            {row.imageUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={row.imageUrl} alt={row.col3} crossOrigin="anonymous" style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />
              : <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#93C5FD', fontSize: '11px' }}>{row.col3}</div>
            }
          </div>
          {/* Col 4 — navy panel */}
          <div style={{ width: '20%', minWidth: '90px', backgroundColor: NAVY, flexShrink: 0 }} />
        </div>
      ))}

      {/* Summary row */}
      {cfg.rows.length > 0 && (() => {
        const last = cfg.rows[cfg.rows.length - 1]
        return (
          <div style={{ display: 'flex', border: CB, borderTop: 'none', fontSize: '13px' }}>
            <div style={{ flex: '2', padding: '7px 12px', fontWeight: 'bold', borderRight: CB }}>{last.col3}</div>
            <div style={{ flex: '1', padding: '7px 12px', textAlign: 'center', borderRight: CB }}>{last.col2}</div>
            <div style={{ flex: '1', padding: '7px 12px', textAlign: 'center', borderRight: CB }}>{last.col1}</div>
            {cfg.grandTotalLabel && <>
              <div style={{ flex: '1', padding: '7px 12px', textAlign: 'center', fontWeight: 'bold', borderRight: CB }}>{cfg.grandTotalLabel}</div>
              <div style={{ flex: '1', padding: '7px 12px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>{cfg.grandTotal}</div>
            </>}
          </div>
        )
      })()}

      {/* Grand Total */}
      {cfg.grandTotalLabel && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '80px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #ccc', fontWeight: 'bold', fontSize: '15px' }}>
          <span>GRAND TOTAL :</span>
          <span style={{ fontSize: '18px' }}>{cfg.grandTotal}</span>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', fontSize: '11px', color: '#555' }}>
        <span>{fmtDate(new Date())}</span>
        <span>Page 1 of 1</span>
      </div>
    </div>
  )
}

// ─── Shared export engine ────────────────────────────────────────────────────
async function runExport(fmt: 'excel' | 'pdf' | 'png', cfg: PageExportConfig, divRef: React.RefObject<HTMLDivElement | null>, setExporting: (v: 'excel' | 'pdf' | 'png' | null) => void, setShowHidden: (v: boolean) => void) {
  setExporting(fmt)
  if (fmt === 'excel') {
    exportToExcel({ filename: cfg.filename, sheetName: cfg.sheetName || 'Report', columns: cfg.excelColumns, data: cfg.excelData, reportTitle: cfg.title })
    setExporting(null)
    return
  }
  setShowHidden(true)
  await new Promise(r => setTimeout(r, 400))
  try {
    const { default: html2canvas } = await import('html2canvas')
    const el = divRef.current
    if (!el) return
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#fff', logging: false })
    if (fmt === 'png') {
      const a = document.createElement('a')
      a.download = `${cfg.filename}-${Date.now()}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    } else {
      const { default: jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = (canvas.height * pdfW) / canvas.width
      const pageH = pdf.internal.pageSize.getHeight()
      let y = 0
      while (y < pdfH) {
        if (y > 0) pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -y, pdfW, pdfH)
        y += pageH
      }
      pdf.save(`${cfg.filename}-${Date.now()}.pdf`)
    }
  } finally {
    setShowHidden(false)
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
  const divRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState<'excel' | 'pdf' | 'png' | null>(null)
  const [showHidden, setShowHidden] = useState(false)
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
    runExport(fmt, cfg, divRef as React.RefObject<HTMLDivElement | null>, setExporting, setShowHidden)

  const applyCustomAndOpen = () => {
    if (!customFilters) return
    const { rows, excelData } = customFilters.filterData({ brandId, categoryId, sizeId, status, dateFrom, dateTo })
    setCustomCfg({ ...config, rows, excelData })
    setShowCustom(true)
    setShowMenu(false)
  }

  return (
    <>
      {showHidden && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, pointerEvents: 'none' }}>
          <PrintableReport cfg={customCfg || config} divRef={divRef as React.RefObject<HTMLDivElement>} />
        </div>
      )}

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
