import { useState, useEffect } from 'react'
import GlassCard from './GlassCard'
import { Activity, CheckCircle, XCircle } from 'lucide-react'

export default function TestReportSummary() {
  const [frontendReport, setFrontendReport] = useState<any>(null)
  const [backendReport, setBackendReport] = useState<any>(null)
  const [mlReport, setMlReport] = useState<any>(null)

  useEffect(() => {
    fetch('/frontend-report.json')
      .then(res => res.json())
      .then(data => setFrontendReport(data))
      .catch(err => console.error('Failed to load frontend report', err))
      
    fetch('/backend-report.json')
      .then(res => res.json())
      .then(data => setBackendReport(data))
      .catch(err => console.error('Failed to load backend report', err))
      
    fetch('/ml-report.json')
      .then(res => res.json())
      .then(data => setMlReport(data))
      .catch(err => console.error('Failed to load ml report', err))
  }, [])

  if (!frontendReport && !backendReport) return null

  const getStats = (report: any) => ({
    passed: report?.numPassedTests ?? report?.summary?.passed ?? 0,
    total: report?.numTotalTests ?? report?.summary?.total ?? 0,
    failed: report?.numFailedTests ?? report?.summary?.failed ?? 0,
    success: report?.success ?? (report?.exitcode === 0) ?? true
  })

  const fStats = getStats(frontendReport)
  const bStats = getStats(backendReport)
  const mStats = getStats(mlReport)

  return (
    <GlassCard className="mt-8 bg-gradient-to-br from-indigo-50 to-white">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="text-indigo-500" size={20} />
        <h3 className="text-lg font-semibold text-content">System Test Health</h3>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm flex justify-between items-center">
          <div>
            <h4 className="text-sm font-medium text-content-muted mb-1">Frontend Tests</h4>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{fStats.passed}/{fStats.total}</span>
              <span className="text-sm text-content-muted">passed</span>
            </div>
          </div>
          {fStats.success ? <CheckCircle className="text-green-500" size={32} /> : <XCircle className="text-red-500" size={32} />}
        </div>
        
        <div className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm flex justify-between items-center">
          <div>
            <h4 className="text-sm font-medium text-content-muted mb-1">Backend Tests</h4>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{bStats.passed}/{bStats.total}</span>
              <span className="text-sm text-content-muted">passed</span>
            </div>
          </div>
          {bStats.success ? <CheckCircle className="text-green-500" size={32} /> : <XCircle className="text-red-500" size={32} />}
        </div>
        
        <div className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm flex justify-between items-center">
          <div>
            <h4 className="text-sm font-medium text-content-muted mb-1">ML Service Tests</h4>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{mStats.passed}/{mStats.total}</span>
              <span className="text-sm text-content-muted">passed</span>
            </div>
          </div>
          {mStats.success ? <CheckCircle className="text-green-500" size={32} /> : <XCircle className="text-red-500" size={32} />}
        </div>
      </div>
    </GlassCard>
  )
}
