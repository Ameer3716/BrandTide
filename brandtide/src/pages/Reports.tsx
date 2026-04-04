import GlassCard from '@/components/ui/GlassCard'
import PDFBuilder from '@/components/ui/PDFBuilder'
import ScheduleModal from '@/components/ui/ScheduleModal'
import { listReports, saveReportMeta, deleteReport, downloadReport } from '@/services/pdf'
import { scheduleService } from '@/services/api'
import { useState, useEffect } from 'react'
import { FileText, Save, Clock, Trash2, Calendar, Loader2, Download } from 'lucide-react'
import dayjs from 'dayjs'

export default function Reports() {
  const [items, setItems] = useState(listReports())
  const [schedules, setSchedules] = useState<any[]>([])
  const [loadingSchedules, setLoadingSchedules] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    loadSchedules()
  }, [])

  async function loadSchedules() {
    try {
      setLoadingSchedules(true)
      const data = await scheduleService.getSchedules()
      setSchedules(data || [])
    } catch (error) {
      console.error('Failed to load schedules:', error)
    } finally {
      setLoadingSchedules(false)
    }
  }

  function generate() {
    saveReportMeta({ title: 'Monthly Sentiment Report' })
    setItems(listReports())
  }

  function handleDelete(reportId: string) {
    deleteReport(reportId)
    setItems(listReports())
  }

  async function handleDownload(reportId: string, reportTitle: string) {
    try {
      setDownloadingId(reportId)
      await downloadReport(reportTitle)
    } catch (error) {
      console.error('Failed to download report:', error)
      alert('Failed to download report. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleDeleteSchedule(scheduleId: string) {
    try {
      await scheduleService.deleteSchedule(scheduleId)
      loadSchedules()
    } catch (error) {
      console.error('Failed to delete schedule:', error)
    }
  }

  async function handleToggleSchedule(scheduleId: string) {
    try {
      await scheduleService.toggleSchedule(scheduleId)
      loadSchedules()
    } catch (error) {
      console.error('Failed to toggle schedule:', error)
    }
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
          <ScheduleModal onScheduleCreated={loadSchedules} />
        </div>
      </GlassCard>

      {/* Scheduled Reports Section */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-content-muted" />
          <h3 className="text-lg font-semibold text-content">Scheduled Reports</h3>
        </div>
        {loadingSchedules ? (
          <div className="flex items-center gap-2 text-content-muted py-4">
            <Loader2 className="animate-spin" size={16} />
            <span className="text-sm">Loading schedules...</span>
          </div>
        ) : schedules.length === 0 ? (
          <p className="text-content-muted text-sm">No scheduled reports. Create one above!</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {schedules.map((s: any) => (
              <div key={s.id} className="py-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-medium text-content capitalize">
                      {s.cadence === 'custom' 
                        ? 'One-time Report'
                        : `${s.cadence.charAt(0).toUpperCase() + s.cadence.slice(1)} Report`}
                    </p>
                    {!s.active && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                        Inactive
                      </span>
                    )}
                    {s.active && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-content-muted">
                    To: <strong>{s.email}</strong>
                  </p>
                  <p className="text-xs text-content-muted mt-1">
                    {s.lastSent 
                      ? `Last sent: ${dayjs(s.lastSent).format('MMM D, YYYY h:mm A')}`
                      : 'Never sent'
                    }
                  </p>
                  <p className="text-xs text-content-muted">
                    Next send: <strong>{dayjs(s.nextSend).format('MMM D, YYYY h:mm A')}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleSchedule(s.id)}
                    className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-medium"
                  >
                    {s.active ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => handleDeleteSchedule(s.id)}
                    className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* My Reports Section */}
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
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleDownload(x.id, x.title)}
                    disabled={downloadingId === x.id}
                    className="text-sm text-accent hover:text-accent-dark font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloadingId === x.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                    {downloadingId === x.id ? 'Downloading...' : 'Download'}
                  </button>
                  <button 
                    onClick={() => handleDelete(x.id)}
                    className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
