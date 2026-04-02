import jsPDF from 'jspdf'
import { dataService } from '@/services/data'
import { FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function PDFBuilder() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      // Fetch real data from the API
      const [metrics, trend, topProducts, posReviews, negReviews] = await Promise.all([
        dataService.getMetrics(),
        dataService.getSentimentTrend(),
        dataService.getTopProducts(),
        dataService.getRepresentativeReviews('pos', 5),
        dataService.getRepresentativeReviews('neg', 5)
      ])

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 15
      const contentWidth = pageWidth - margin * 2
      let y = margin

      // ── Helper functions ────────────────────────────────────────────
      function addPageIfNeeded(requiredSpace: number) {
        if (y + requiredSpace > 270) {
          pdf.addPage()
          y = margin
        }
      }

      function drawLine() {
        pdf.setDrawColor(200, 200, 200)
        pdf.line(margin, y, pageWidth - margin, y)
        y += 4
      }

      // ── Header / Title ──────────────────────────────────────────────
      pdf.setFillColor(59, 130, 246) // accent blue
      pdf.rect(0, 0, pageWidth, 35, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(22)
      pdf.setFont('helvetica', 'bold')
      pdf.text('BrandTide Sentiment Report', margin, 18)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 28)
      y = 45

      // ── Overview Metrics ────────────────────────────────────────────
      pdf.setTextColor(30, 30, 30)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Overview', margin, y)
      y += 10

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')

      const dist = metrics.distribution || []
      const posPercent = dist.find((d: any) => d.name === 'Positive')?.value || 0
      const neuPercent = dist.find((d: any) => d.name === 'Neutral')?.value || 0
      const negPercent = dist.find((d: any) => d.name === 'Negative')?.value || 0

      const metricItems = [
        ['Total Reviews', String(metrics.totalReviews || 0)],
        ['Brands Tracked', String(metrics.brandsCount || 0)],
        ['Products Tracked', String(metrics.productsCount || 0)],
        ['Positive', `${posPercent}%`],
        ['Neutral', `${neuPercent}%`],
        ['Negative', `${negPercent}%`],
      ]

      // Draw metrics in 3-column grid
      const colWidth = contentWidth / 3
      metricItems.forEach(([label, value], i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const cellX = margin + col * colWidth
        const cellY = y + row * 18

        // Value
        pdf.setFontSize(18)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(59, 130, 246)
        pdf.text(value, cellX + 5, cellY + 6)

        // Label
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(100, 100, 100)
        pdf.text(label, cellX + 5, cellY + 12)
      })
      y += Math.ceil(metricItems.length / 3) * 18 + 5
      drawLine()

      // ── Sentiment Trend ─────────────────────────────────────────────
      addPageIfNeeded(50)
      pdf.setTextColor(30, 30, 30)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Sentiment Trend', margin, y)
      y += 8

      if (trend && trend.length > 0) {
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')

        // Table header
        pdf.setFillColor(240, 240, 240)
        pdf.rect(margin, y, contentWidth, 7, 'F')
        pdf.setTextColor(80, 80, 80)
        pdf.text('Date', margin + 3, y + 5)
        pdf.text('Positive', margin + 55, y + 5)
        pdf.text('Neutral', margin + 85, y + 5)
        pdf.text('Negative', margin + 115, y + 5)
        y += 8

        const maxTrendRows = Math.min(trend.length, 15)
        for (let i = 0; i < maxTrendRows; i++) {
          const row = trend[i]
          addPageIfNeeded(7)
          pdf.setTextColor(50, 50, 50)
          pdf.text(row.date || '', margin + 3, y + 4)
          pdf.setTextColor(34, 197, 94)
          pdf.text(String(row.pos || 0), margin + 55, y + 4)
          pdf.setTextColor(100, 100, 100)
          pdf.text(String(row.neu || 0), margin + 85, y + 4)
          pdf.setTextColor(239, 68, 68)
          pdf.text(String(row.neg || 0), margin + 115, y + 4)
          y += 6
        }
      } else {
        pdf.setFontSize(9)
        pdf.setTextColor(150, 150, 150)
        pdf.text('No trend data available.', margin + 3, y + 5)
        y += 10
      }
      y += 5
      drawLine()

      // ── Top Products ────────────────────────────────────────────────
      addPageIfNeeded(60)
      pdf.setTextColor(30, 30, 30)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Top Products', margin, y)
      y += 8

      function drawProductTable(title: string, products: any[], color: number[]) {
        addPageIfNeeded(30)
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(color[0], color[1], color[2])
        pdf.text(title, margin, y)
        y += 6

        if (!products || products.length === 0) {
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(150, 150, 150)
          pdf.text('No data available.', margin + 3, y + 4)
          y += 10
          return
        }

        // Table header
        pdf.setFillColor(240, 240, 240)
        pdf.rect(margin, y, contentWidth, 7, 'F')
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(80, 80, 80)
        pdf.text('Product', margin + 3, y + 5)
        pdf.text('Brand', margin + 65, y + 5)
        pdf.text('Mentions', margin + 110, y + 5)
        pdf.text('Confidence', margin + 140, y + 5)
        y += 8

        const maxRows = Math.min(products.length, 10)
        for (let i = 0; i < maxRows; i++) {
          const p = products[i]
          addPageIfNeeded(7)
          pdf.setFontSize(8)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(50, 50, 50)
          pdf.text(String(p.name || '').substring(0, 30), margin + 3, y + 4)
          pdf.text(String(p.brand || ''), margin + 65, y + 4)
          pdf.text(String(p.count || 0), margin + 110, y + 4)
          pdf.text(String(p.conf || ''), margin + 140, y + 4)
          y += 6
        }
        y += 5
      }

      drawProductTable('Top Performing Products', topProducts?.pos || [], [34, 197, 94])
      drawProductTable('Bottom Performing Products', topProducts?.neg || [], [239, 68, 68])
      drawLine()

      // ── Representative Reviews ──────────────────────────────────────
      addPageIfNeeded(50)
      pdf.setTextColor(30, 30, 30)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Representative Reviews', margin, y)
      y += 10

      function drawReviewSection(title: string, reviews: any[], accentColor: number[]) {
        addPageIfNeeded(20)
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2])
        pdf.text(title, margin, y)
        y += 7

        if (!reviews || reviews.length === 0) {
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(150, 150, 150)
          pdf.text('No reviews available.', margin + 3, y + 3)
          y += 10
          return
        }

        for (const rev of reviews) {
          addPageIfNeeded(18)
          const snippet = String(rev.snippet || '').substring(0, 120)
          const meta = `${rev.product?.name || 'Unknown'} • conf ${rev.conf || 'N/A'}`

          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(50, 50, 50)

          // Wrap text
          const lines = pdf.splitTextToSize(`"${snippet}"`, contentWidth - 10)
          pdf.text(lines, margin + 5, y)
          y += lines.length * 4

          pdf.setFontSize(7)
          pdf.setTextColor(130, 130, 130)
          pdf.text(meta, margin + 5, y + 2)
          y += 8
        }
      }

      drawReviewSection('Positive Reviews', posReviews || [], [34, 197, 94])
      drawReviewSection('Negative Reviews', negReviews || [], [239, 68, 68])

      // ── Footer ──────────────────────────────────────────────────────
      const pageCount = pdf.getNumberOfPages()
      for (let p = 1; p <= pageCount; p++) {
        pdf.setPage(p)
        pdf.setFontSize(7)
        pdf.setTextColor(170, 170, 170)
        pdf.text(
          `BrandTide Report • Page ${p} of ${pageCount} • ${new Date().toLocaleDateString()}`,
          pageWidth / 2,
          290,
          { align: 'center' }
        )
      }

      pdf.save('brandtide-sentiment-report.pdf')
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('Failed to generate PDF. Please make sure you have data uploaded.')
    }
    setLoading(false)
  }

  return (
    <button
      className="btn-primary flex items-center gap-2"
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
      {loading ? 'Generating...' : 'Export PDF'}
    </button>
  )
}
