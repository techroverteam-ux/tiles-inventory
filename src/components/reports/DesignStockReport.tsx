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
const GRAY_BORDER = '1px solid #d1d5db'
const HEADER_BG = '#f1f5f9'
const NAVY_BORDER = `2px solid ${NAVY}`
const CELL_BORDER = GRAY_BORDER

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
      const MARGIN = 14, FOOTER_H = 10, ROW_IMG_H = 38
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const PW = pdf.internal.pageSize.getWidth()
      const PH = pdf.internal.pageSize.getHeight()
      const contentW = PW - MARGIN * 2
      const bodyBottom = PH - FOOTER_H - 6
      let page = 1

      const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

      const addFooter = (p: number) => {
        pdf.setPage(p)
        pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.3)
        pdf.line(MARGIN, PH - FOOTER_H, PW - MARGIN, PH - FOOTER_H)
        pdf.setFontSize(8); pdf.setTextColor(150, 150, 150)
        pdf.text(dateStr, MARGIN, PH - FOOTER_H + 5)
        pdf.text(`Page ${p}`, PW - MARGIN, PH - FOOTER_H + 5, { align: 'right' })
      }

      const newPage = () => { addFooter(page); pdf.addPage(); page++; return MARGIN + 6 }

      let y = MARGIN

      // Title
      pdf.setFontSize(18); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(15, 23, 42)
      pdf.text('Design Stock Report', MARGIN, y + 8); y += 14

      if (partyName) {
        pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(30, 58, 138)
        pdf.text(`Party: ${partyName}`, MARGIN, y + 5); y += 9
      }

      const metaW = contentW * 0.28, qtyW = contentW * 0.12, imgW = contentW - metaW - qtyW

      for (const brand of brands) {
        const brandTotal = brand.items.reduce((s, i) => s + i.quantity, 0)

        // Brand name
        if (y + 12 > bodyBottom) y = newPage()
        pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(15, 23, 42)
        pdf.text(brand.brandName.toUpperCase(), MARGIN, y + 6); y += 10

        // ITEM DESCRIPTION header
        if (y + 8 > bodyBottom) y = newPage()
        pdf.setFillColor(241, 245, 249); pdf.setDrawColor(30, 58, 138); pdf.setLineWidth(0.5)
        pdf.rect(MARGIN, y, contentW, 8, 'FD')
        pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(30, 41, 59)
        pdf.text('ITEM DESCRIPTION', PW / 2, y + 5.5, { align: 'center' }); y += 8

        for (const item of brand.items) {
          if (y + ROW_IMG_H > bodyBottom) {
            y = newPage()
            pdf.setFillColor(241, 245, 249); pdf.setDrawColor(30, 58, 138); pdf.setLineWidth(0.5)
            pdf.rect(MARGIN, y, contentW, 8, 'FD')
            pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(30, 41, 59)
            pdf.text('ITEM DESCRIPTION', PW / 2, y + 5.5, { align: 'center' }); y += 8
          }

          const rx = MARGIN, ry = y
          pdf.setDrawColor(209, 213, 219); pdf.setLineWidth(0.3)
          pdf.rect(rx, ry, contentW, ROW_IMG_H)

          // Meta
          pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 116, 139)
          pdf.text(item.finish || item.category, rx + 3, ry + 6)
          pdf.text(item.size, rx + 3, ry + 11)
          pdf.setFont('helvetica', 'bold'); pdf.setTextColor(15, 23, 42); pdf.setFontSize(9)
          const nameLines = pdf.splitTextToSize(item.productName, metaW - 6)
          pdf.text(nameLines, rx + 3, ry + 17)
          pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(71, 85, 105)
          pdf.text(item.productCode, rx + 3, ry + 17 + nameLines.length * 4 + 2)
          // Location badge
          const badgeY = ry + 17 + nameLines.length * 4 + 7
          pdf.setFillColor(241, 245, 249); pdf.setDrawColor(203, 213, 225); pdf.setLineWidth(0.2)
          pdf.roundedRect(rx + 3, badgeY - 3, 24, 5, 1, 1, 'FD')
          pdf.setFontSize(7); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(51, 65, 85)
          pdf.text(item.location, rx + 15, badgeY + 0.5, { align: 'center' })

          // Dividers
          pdf.setDrawColor(209, 213, 219); pdf.setLineWidth(0.3)
          pdf.line(rx + metaW, ry, rx + metaW, ry + ROW_IMG_H)

          // QTY
          pdf.setFontSize(7); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 116, 139)
          pdf.text('QTY', rx + metaW + qtyW / 2, ry + 8, { align: 'center' })
          pdf.setFontSize(20); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(15, 23, 42)
          pdf.text(String(item.quantity), rx + metaW + qtyW / 2, ry + 22, { align: 'center' })

          pdf.setDrawColor(209, 213, 219)
          pdf.line(rx + metaW + qtyW, ry, rx + metaW + qtyW, ry + ROW_IMG_H)

          // Image
          const imgX = rx + metaW + qtyW
          if (item.imageUrl) {
            await new Promise<void>(resolve => {
              const img = new Image(); img.crossOrigin = 'anonymous'
              img.onload = () => { pdf.addImage(img, 'JPEG', imgX + 0.5, ry + 0.5, imgW - 1, ROW_IMG_H - 1); resolve() }
              img.onerror = () => resolve()
              img.src = item.imageUrl!
            })
          } else {
            pdf.setFillColor(248, 250, 252); pdf.rect(imgX, ry, imgW, ROW_IMG_H, 'F')
            pdf.setFontSize(8); pdf.setTextColor(148, 163, 184)
            pdf.text('No Image', imgX + imgW / 2, ry + ROW_IMG_H / 2, { align: 'center' })
          }
          y += ROW_IMG_H
        }

        // Brand total
        if (y + 10 > bodyBottom) y = newPage()
        pdf.setFillColor(248, 250, 252); pdf.setDrawColor(209, 213, 219); pdf.setLineWidth(0.3)
        pdf.rect(MARGIN, y, contentW, 9, 'FD')
        pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(71, 85, 105)
        pdf.text('Brand Total:', PW - MARGIN - 20, y + 6, { align: 'right' })
        pdf.setFontSize(11); pdf.setTextColor(15, 23, 42)
        pdf.text(String(brandTotal), PW - MARGIN - 2, y + 6, { align: 'right' })
        y += 9 + 6
      }

      // Grand Total
      if (y + 14 > bodyBottom) y = newPage()
      y += 4
      pdf.setDrawColor(30, 41, 59); pdf.setLineWidth(0.5)
      pdf.line(MARGIN, y, PW - MARGIN, y); y += 6
      pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(71, 85, 105)
      pdf.text('GRAND TOTAL', PW - MARGIN - 30, y, { align: 'right' })
      pdf.setFontSize(14); pdf.setTextColor(15, 23, 42)
      pdf.text(String(grandTotal), PW - MARGIN, y, { align: 'right' })

      addFooter(page)
      // Overwrite page numbers with "X of Y"
      for (let p = 1; p <= page; p++) {
        pdf.setPage(p); pdf.setFontSize(8); pdf.setTextColor(150, 150, 150)
        pdf.setFillColor(255, 255, 255)
        pdf.rect(PW - MARGIN - 30, PH - FOOTER_H + 1, 32, 6, 'F')
        pdf.text(`Page ${p} of ${page}`, PW - MARGIN, PH - FOOTER_H + 5, { align: 'right' })
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

                {/* ── ITEM DESCRIPTION header row ── */}
                <div style={{
                  border: NAVY_BORDER,
                  padding: '7px 14px',
                  backgroundColor: HEADER_BG,
                  color: '#1e293b',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>
                  ITEM DESCRIPTION
                </div>

                {/* ── Item rows ── */}
                {brand.items.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    style={{
                      display: 'flex',
                      borderLeft: NAVY_BORDER,
                      borderRight: NAVY_BORDER,
                      borderBottom: CELL_BORDER,
                    }}
                  >
                    {/* Col 1 — meta info */}
                    <div style={{
                      width: '22%',
                      minWidth: '130px',
                      padding: '14px 16px',
                      borderRight: CELL_BORDER,
                      fontSize: '12px',
                      lineHeight: '1.8',
                      flexShrink: 0,
                      verticalAlign: 'top',
                    }}>
                      <div style={{ color: '#64748b', fontSize: '11px' }}>{item.finish || item.category}</div>
                      <div style={{ color: '#64748b', fontSize: '11px' }}>{item.size}</div>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', marginTop: '4px', color: '#0f172a' }}>
                        {item.productName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{item.productCode}</div>
                      <div style={{
                        marginTop: '6px',
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                      }}>{item.location}</div>
                    </div>

                    {/* Col 2 — qty */}
                    <div style={{
                      width: '10%',
                      minWidth: '64px',
                      padding: '14px 8px',
                      borderRight: CELL_BORDER,
                      textAlign: 'center',
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <div style={{ fontWeight: '600', fontSize: '9px', letterSpacing: '0.08em', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>QTY</div>
                      <div style={{ fontWeight: 'bold', fontSize: '26px', lineHeight: '1', color: '#0f172a' }}>{item.quantity}</div>
                    </div>

                    {/* Col 3 — Tile image */}
                    <div style={{
                      flex: '1',
                      overflow: 'hidden',
                      backgroundColor: '#f8fafc',
                    }}>
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          crossOrigin="anonymous"
                          style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <div style={{
                          height: '140px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94a3b8',
                          fontSize: '11px',
                          background: '#f1f5f9',
                        }}>
                          No Image
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* ── Brand total row ── */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  borderLeft: NAVY_BORDER,
                  borderRight: NAVY_BORDER,
                  borderBottom: NAVY_BORDER,
                  padding: '8px 16px',
                  background: '#f8fafc',
                  fontSize: '12px',
                }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Brand Total:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#0f172a' }}>{brandTotal}</span>
                </div>
              </div>
            )
          })}

          {/* ══ GRAND TOTAL ══ */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '16px',
            marginTop: '20px',
            paddingTop: '14px',
            borderTop: '2px solid #1e293b',
            fontWeight: 'bold',
            fontSize: '14px',
          }}>
            <span style={{ color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Grand Total</span>
            <span style={{ fontSize: '20px', color: '#0f172a' }}>{grandTotal}</span>
          </div>

          {/* ══ FOOTER ══ */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '32px',
            paddingTop: '10px',
            borderTop: '1px solid #e2e8f0',
            fontSize: '10px',
            color: '#94a3b8',
          }}>
            <span>{todayStr}</span>
            <span>Page 1 of 1</span>
          </div>

        </div>
      </div>
    </div>
  )
}
