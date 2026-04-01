'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown, ImageDown, FileSpreadsheet, Loader2 } from 'lucide-react'

interface DesignStockItem {
  productCode: string
  productName: string
  imageUrl: string | null
  size: string
  category: string
  finish: string
  quantity: number
  batchNumber: string
  location: string
}

interface BrandGroup {
  brandName: string
  items: DesignStockItem[]
}

interface Props {
  brands: BrandGroup[]
  grandTotal: number
  partyName?: string
}

const NAVY = '#1E3A8A'
const NAVY_BORDER = `2px solid ${NAVY}`
const CELL_BORDER = `1px solid ${NAVY}`

export function DesignStockReportView({ brands, grandTotal, partyName }: Props) {
  const reportRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState<'pdf' | 'png' | 'excel' | null>(null)

  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  async function exportPDF() {
    setExporting('pdf')
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')
      const el = reportRef.current
      if (!el) return
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#fff', logging: false })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = (canvas.height * pdfW) / canvas.width
      const pageH = pdf.internal.pageSize.getHeight()
      let y = 0
      while (y < pdfH) {
        if (y > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -y, pdfW, pdfH)
        y += pageH
      }
      pdf.save(`design-stock-report-${Date.now()}.pdf`)
    } finally { setExporting(null) }
  }

  async function exportPNG() {
    setExporting('png')
    try {
      const { default: html2canvas } = await import('html2canvas')
      const el = reportRef.current
      if (!el) return
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#fff', logging: false })
      const a = document.createElement('a')
      a.download = `design-stock-report-${Date.now()}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    } finally { setExporting(null) }
  }

  async function exportExcel() {
    setExporting('excel')
    try {
      const XLSX = await import('xlsx-js-style')
      const N = '1E3A8A', W = 'FFFFFF'
      const side = (c: string) => ({ style: 'thin' as const, color: { rgb: c } })
      const allBorder = (c = N) => ({ top: side(c), bottom: side(c), left: side(c), right: side(c) })

      const aoa: any[][] = [
        ['Design Stock Report'],
        partyName ? [`Party Name:  ${partyName}`] : [''],
        [],
        ['Product Code', 'Product Name', 'Size', 'Finish', 'Qty', 'Batch #', 'Location'],
      ]

      for (const brand of brands) {
        const bt = brand.items.reduce((s, i) => s + i.quantity, 0)
        aoa.push([`— ${brand.brandName.toUpperCase()} —`, '', '', '', '', '', ''])
        for (const item of brand.items) {
          aoa.push([item.productCode, item.productName, item.size, item.finish || item.category, item.quantity, item.batchNumber, item.location])
        }
        aoa.push(['', '', '', 'Brand Total', bt, '', ''])
        aoa.push([])
      }
      aoa.push(['', '', '', 'GRAND TOTAL', grandTotal, '', ''])

      const ws = XLSX.utils.aoa_to_sheet(aoa)
      ws['!cols'] = [16, 28, 14, 14, 8, 14, 18].map(w => ({ wch: w }))

      const t = ws['A1']
      if (t) t.s = { font: { bold: true, sz: 16, name: 'Arial', color: { rgb: N } } }

      ;['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
        const cell = ws[`${col}4`]
        if (cell) cell.s = {
          font: { bold: true, sz: 11, name: 'Arial', color: { rgb: W } },
          fill: { fgColor: { rgb: N } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: allBorder(),
        }
      })

      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Design Stock Report')
      XLSX.writeFile(wb, `design-stock-report-${Date.now()}.xlsx`)
    } finally { setExporting(null) }
  }

  return (
    <div>
      {/* Export buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        <Button variant="outline" size="sm" onClick={exportPDF} disabled={!!exporting}
          className="gap-2 rounded-xl border-red-200 text-red-700 hover:bg-red-50">
          {exporting === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          Export PDF
        </Button>
        <Button variant="outline" size="sm" onClick={exportPNG} disabled={!!exporting}
          className="gap-2 rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50">
          {exporting === 'png' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageDown className="h-4 w-4" />}
          Export PNG
        </Button>
        <Button variant="outline" size="sm" onClick={exportExcel} disabled={!!exporting}
          className="gap-2 rounded-xl border-green-200 text-green-700 hover:bg-green-50">
          {exporting === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
          Export Excel
        </Button>
      </div>

      {/* Mobile scroll wrapper */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>

        {/* ── White A4-like printable area ── */}
        <div
          ref={reportRef}
          style={{
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: 'Arial, Helvetica, sans-serif',
            padding: '40px 50px 50px 50px',
            minWidth: '680px',
            maxWidth: '880px',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >

          {/* ══ TITLE — "Design Stock Report" bold, large ══ */}
          <div style={{
            fontWeight: 'bold',
            fontSize: '22px',
            marginBottom: '16px',
          }}>
            Design Stock Report
          </div>

          {/* ══ PARTY NAME ROW — navy bordered, blue label text ══
              ┌──────────────┬──────────────────────────────────────┐
              │ Party Name:  │  MAHESHWARI MARBLE INDUSTRIES        │
              └──────────────┴──────────────────────────────────────┘  */}
          {partyName && (
            <div style={{
              display: 'flex',
              border: NAVY_BORDER,
              marginBottom: '18px',
              fontSize: '13px',
            }}>
              <div style={{
                padding: '6px 14px',
                color: NAVY,
                fontWeight: 'bold',
                borderRight: NAVY_BORDER,
                whiteSpace: 'nowrap',
              }}>
                Party Name:
              </div>
              <div style={{ padding: '6px 14px', fontWeight: 'normal', letterSpacing: '0.02em' }}>
                {partyName}
              </div>
            </div>
          )}

          {/* ══ BRAND SECTIONS ══ */}
          {brands.map((brand, bIdx) => {
            const brandTotal = brand.items.reduce((s, i) => s + i.quantity, 0)
            return (
              <div key={bIdx} style={{ marginBottom: '30px' }}>

                {/* Brand name — bold uppercase, e.g. "DEMO CERAMIC" */}
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '15px',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}>
                  {brand.brandName}
                </div>

                {/* ── ITEM DESCRIPTION header row ──
                    Light blue bg, navy text, centered, full width  */}
                <div style={{
                  border: NAVY_BORDER,
                  padding: '6px 14px',
                  backgroundColor: '#ffffff',
                  color: NAVY,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  fontSize: '12px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '0',
                }}>
                  ITEM DESCRIPTION
                </div>

                {/* ── Item rows ── */}
                {brand.items.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    style={{
                      display: 'flex',
                      border: NAVY_BORDER,
                      borderTop: 'none',
                      marginBottom: '0',
                    }}
                  >
                    {/* Col 1 — Finish / Size / Code bold */}
                    <div style={{
                      width: '20%',
                      minWidth: '120px',
                      padding: '12px 14px',
                      borderRight: CELL_BORDER,
                      fontSize: '12px',
                      lineHeight: '1.7',
                      flexShrink: 0,
                    }}>
                      <div>{item.finish || item.category}</div>
                      <div>{item.size}</div>
                      <div style={{ fontWeight: 'bold', marginTop: '4px' }}>
                        {item.productCode}{item.finish ? ` ${item.finish}` : ''}
                      </div>
                    </div>

                    {/* Col 2 — PRE + large qty */}
                    <div style={{
                      width: '10%',
                      minWidth: '60px',
                      padding: '12px 8px',
                      borderRight: CELL_BORDER,
                      textAlign: 'center',
                      flexShrink: 0,
                    }}>
                      <div style={{ fontWeight: 'bold', fontSize: '10px', letterSpacing: '0.05em', marginBottom: '4px' }}>PRE</div>
                      <div style={{ fontWeight: 'bold', fontSize: '28px', lineHeight: '1' }}>{item.quantity}</div>
                    </div>

                    {/* Col 3 — Tile image, navy bg fallback */}
                    <div style={{
                      flex: '1',
                      backgroundColor: NAVY,
                      overflow: 'hidden',
                      borderRight: CELL_BORDER,
                      position: 'relative',
                    }}>
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          crossOrigin="anonymous"
                          style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <div style={{
                          height: '150px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#93C5FD',
                          fontSize: '11px',
                        }}>
                          {item.productCode}
                        </div>
                      )}
                    </div>

                    {/* Col 4 — Solid navy right panel */}
                    <div style={{
                      width: '22%',
                      minWidth: '100px',
                      backgroundColor: NAVY,
                      flexShrink: 0,
                    }} />
                  </div>
                ))}

                {/* ── Per-item summary row (last item info + Total + count) ──
                    "ANW 790 MATT  |  600X1200  |  MATT  |  Total  |  53"  */}
                {brand.items.length > 0 && (() => {
                  const last = brand.items[brand.items.length - 1]
                  return (
                    <div style={{
                      display: 'flex',
                      border: NAVY_BORDER,
                      borderTop: 'none',
                      fontSize: '13px',
                    }}>
                      <div style={{ flex: '2', padding: '7px 12px', fontWeight: 'bold', borderRight: CELL_BORDER }}>
                        {last.productCode}{last.finish ? ` ${last.finish}` : ''}
                      </div>
                      <div style={{ flex: '1', padding: '7px 12px', textAlign: 'center', borderRight: CELL_BORDER }}>
                        {last.size}
                      </div>
                      <div style={{ flex: '1', padding: '7px 12px', textAlign: 'center', borderRight: CELL_BORDER }}>
                        {last.finish || last.category}
                      </div>
                      <div style={{ flex: '1', padding: '7px 12px', textAlign: 'center', fontWeight: 'bold', borderRight: CELL_BORDER }}>
                        Total
                      </div>
                      <div style={{ flex: '1', padding: '7px 12px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                        {brandTotal}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )
          })}

          {/* ══ GRAND TOTAL ══
              "GRAND TOTAL :          2774"  centered, bold  */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'baseline',
            gap: '80px',
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid #ccc',
            fontWeight: 'bold',
            fontSize: '15px',
          }}>
            <span>GRAND TOTAL :</span>
            <span style={{ fontSize: '18px' }}>{grandTotal}</span>
          </div>

          {/* ══ FOOTER ══
              "Friday, December 12, 2025"          "Page 10 of 10"  */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '40px',
            fontSize: '11px',
            color: '#555',
          }}>
            <span>{todayStr}</span>
            <span>Page 1 of 1</span>
          </div>

        </div>
      </div>
    </div>
  )
}
