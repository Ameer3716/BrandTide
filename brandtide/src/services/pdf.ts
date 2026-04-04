export function saveReportMeta(meta:any){
  const key = 'bt:reports'
  const arr = JSON.parse(localStorage.getItem(key)||'[]')
  arr.push({ id: 'r_'+Math.random().toString(36).slice(2), ...meta, createdAt: Date.now() })
  localStorage.setItem(key, JSON.stringify(arr))
}

export function listReports(){
  return JSON.parse(localStorage.getItem('bt:reports')||'[]')
}

export function deleteReport(reportId: string){
  const key = 'bt:reports'
  const arr = JSON.parse(localStorage.getItem(key)||'[]')
  const filtered = arr.filter((r: any) => r.id !== reportId)
  localStorage.setItem(key, JSON.stringify(filtered))
}

export async function downloadReport(reportTitle: string) {
  try {
    const jsPDF = (await import('jspdf')).jsPDF
    const { dataService } = await import('./data')

    // Fetch real data from the API
    const [metrics, trend, topProducts, posResponse, negResponse] = await Promise.all([
      dataService.getMetrics(),
      dataService.getSentimentTrend(),
      dataService.getTopProducts(),
      dataService.getRepresentativeReviews('pos', 5),
      dataService.getRepresentativeReviews('neg', 5)
    ])

    const posReviews = posResponse.data || []
    const negReviews = negResponse.data || []

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
    pdf.setFillColor(59, 130, 246)
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
    for (let i = 0; i < metricItems.length; i++) {
      const row = Math.floor(i / 3)
      const col = i % 3
      const boxX = margin + col * 57
      const boxY = y + row * 20

      pdf.setDrawColor(220, 220, 220)
      pdf.rect(boxX, boxY, 55, 18)

      pdf.setFontSize(8)
      pdf.setTextColor(130, 130, 130)
      pdf.text(metricItems[i][0], boxX + 3, boxY + 5)

      pdf.setFontSize(11)
      pdf.setTextColor(50, 50, 50)
      pdf.setFont('helvetica', 'bold')
      pdf.text(metricItems[i][1], boxX + 3, boxY + 13)

      pdf.setFont('helvetica', 'normal')
    }

    y += 45
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
    y += 10

    function drawProductTable(title: string, products: any[], accentColor: number[]) {
      addPageIfNeeded(25)
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2])
      pdf.text(title, margin, y)
      y += 7

      if (!products || products.length === 0) {
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(150, 150, 150)
        pdf.text('No products available.', margin + 3, y + 3)
        y += 10
        return
      }

      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      for (const prod of products.slice(0, 5)) {
        addPageIfNeeded(6)
        pdf.setTextColor(50, 50, 50)
        const text = `• ${prod.name || 'Unknown'}`
        pdf.text(text, margin + 5, y)
        pdf.setTextColor(100, 100, 100)
        pdf.setFontSize(7)
        pdf.text(`(${prod.count || 0} reviews)`, margin + 10, y + 4)
        pdf.setFontSize(8)
        y += 6
      }
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

    // Save the PDF with the report title as filename
    const filename = `${reportTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`
    pdf.save(filename)
  } catch (err) {
    console.error('PDF download failed:', err)
    throw err
  }
}
