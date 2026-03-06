import GlassCard from '@/components/ui/GlassCard'
import PDFBuilder from '@/components/ui/PDFBuilder'
import ScheduleModal from '@/components/ui/ScheduleModal'
import { listReports, saveReportMeta } from '@/services/pdf'
import { useState } from 'react'
import { FileText, Save, Clock } from 'lucide-react'

export default function Reports() {
  const [items, setItems] = useState(listReports())

  function generate() {
    saveReportMeta({ title: 'Monthly Sentiment Report' })
    setItems(listReports())
  }

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <FileText className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-content">Report Builder</h3>
            <p className="text-sm text-content-muted">Generate and schedule sentiment reports</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <PDFBuilder />
          <button className="btn-secondary flex items-center gap-2" onClick={generate}>
            <Save size={16} />
            Save to My Reports
          </button>
          <ScheduleModal />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-content-muted" />
          <h3 className="text-lg font-semibold text-content">My Reports</h3>
        </div>
        {items.length === 0 ? (
          <p className="text-content-muted text-sm">No reports saved yet. Create one above!</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((x: any) => (
              <div key={x.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-content">{x.title}</p>
                  <p className="text-xs text-content-muted">{new Date(x.createdAt).toLocaleString()}</p>
                </div>
                <button className="text-sm text-accent hover:text-accent-dark font-medium">
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
