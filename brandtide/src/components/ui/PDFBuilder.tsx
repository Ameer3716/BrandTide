import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { FileText } from 'lucide-react'

export default function PDFBuilder() {
  async function handleExport() {
    const el = document.body
    const canvas = await html2canvas(el, { backgroundColor: '#F8FAFC', scale: 2 })
    const img = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const width = pdf.internal.pageSize.getWidth()
    const height = (canvas.height * width) / canvas.width
    pdf.addImage(img, 'PNG', 0, 0, width, height)
    pdf.save('brandtide-report.pdf')
  }

  return (
    <button className="btn-primary flex items-center gap-2" onClick={handleExport}>
      <FileText size={16} />
      Export PDF
    </button>
  )
}
