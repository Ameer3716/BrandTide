import { useState, useRef, useEffect } from 'react'
import GlassCard from '@/components/ui/GlassCard'
import {
  smartClassifyBatch, mapError,
  type SmartBatchResult, type AgentError
} from '@/services/agent'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import {
  Zap, Upload, Loader2,
  CheckCircle, AlertCircle, AlertTriangle, Info,
  FileSpreadsheet, Download, ArrowRight,
  ThumbsUp, ThumbsDown, Minus,
  RefreshCw, XCircle, ChevronDown, ChevronUp,
  ShieldCheck, Wand2, Brain
} from 'lucide-react'

type Row = Record<string, any>

// ── File parsing ─────────────────────────────────────────────────────────────

const ACCEPTED_EXTENSIONS = '.csv,.tsv,.xlsx,.xls,.json,.txt'
const FORMAT_LABELS = 'CSV, Excel (.xlsx/.xls), TSV, JSON, TXT'

function parseFile(file: File): Promise<Row[]> {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''

  if (ext === 'xlsx' || ext === 'xls') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const rows = XLSX.utils.sheet_to_json<Row>(firstSheet, { defval: '' })
          resolve(rows.filter(r => Object.values(r).some(v => v !== '')).slice(0, 500))
        } catch {
          reject(new Error('Failed to parse Excel file. Make sure it is a valid .xlsx or .xls file.'))
        }
      }
      reader.onerror = () => reject(new Error('Could not read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  if (ext === 'json') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string)
          const arr: Row[] = Array.isArray(parsed) ? parsed : [parsed]
          resolve(arr.filter(Boolean).slice(0, 500))
        } catch {
          reject(new Error('Failed to parse JSON file. Make sure it contains a valid JSON array of objects.'))
        }
      }
      reader.onerror = () => reject(new Error('Could not read file'))
      reader.readAsText(file)
    })
  }

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (res.errors.length && !res.data.length) {
          reject(new Error('Failed to parse file: ' + res.errors[0]?.message))
          return
        }
        const data = (res.data as Row[]).filter(r => r && Object.values(r).some(v => v !== '')).slice(0, 500)
        resolve(data)
      },
      error: (err: any) => reject(new Error('Parse error: ' + err.message)),
    })
  })
}

// ── Sentiment Badge component ────────────────────────────────────────────────

function SentimentBadge({ label }: { label: string }) {
  const normalized = label?.toLowerCase() || ''
  if (normalized === 'positive') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      <ThumbsUp size={12} /> Positive
    </span>
  )
  if (normalized === 'negative') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
      <ThumbsDown size={12} /> Negative
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
      <Minus size={12} /> Neutral
    </span>
  )
}

// ── Error Display component ──────────────────────────────────────────────────

function ErrorDisplay({ error, onDismiss }: { error: AgentError; onDismiss?: () => void }) {
  const [showDetails, setShowDetails] = useState(false)

  const colorMap = {
    error: { bg: 'bg-red-50', border: 'border-red-200', title: 'text-red-800', text: 'text-red-700', icon: 'text-red-500' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', title: 'text-amber-800', text: 'text-amber-700', icon: 'text-amber-500' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-800', text: 'text-blue-700', icon: 'text-blue-500' }
  }
  const colors = colorMap[error.severity]
  const IconComponent = error.severity === 'error' ? XCircle : error.severity === 'warning' ? AlertTriangle : Info

  return (
    <div className={`p-4 rounded-xl border-2 ${colors.bg} ${colors.border} animate-fadeIn`}>
      <div className="flex items-start gap-3">
        <IconComponent size={22} className={`${colors.icon} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`font-semibold ${colors.title}`}>{error.userMessage}</p>
            {onDismiss && (
              <button onClick={onDismiss} className="p-1 hover:bg-white/50 rounded-lg transition ml-2 flex-shrink-0">
                <XCircle size={16} className={colors.icon} />
              </button>
            )}
          </div>
          <p className={`text-sm mt-1 ${colors.text}`}>
            <strong>💡 Suggestion:</strong> {error.suggestion}
          </p>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`text-xs mt-2 flex items-center gap-1 ${colors.text} hover:underline`}
          >
            {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showDetails ? 'Hide' : 'Show'} technical details
          </button>
          {showDetails && (
            <div className={`mt-2 p-2 rounded-lg bg-white/60 text-xs font-mono ${colors.text}`}>
              <p>Error Code: {error.code}</p>
              <p>Message: {error.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Processing Pipeline Animation ────────────────────────────────────────────

function ProcessingPipeline({ stage }: { stage: 'cleaning' | 'classifying' | 'saving' | 'done' }) {
  const stages = [
    { key: 'cleaning', label: 'AI Cleaning', icon: Wand2, desc: 'Data is converting into desired format' },
    { key: 'classifying', label: 'Classifying', icon: Brain, desc: 'Running sentiment analysis...' },
    { key: 'saving', label: 'Saving', icon: ShieldCheck, desc: 'Storing results in database...' },
    { key: 'done', label: 'Complete', icon: CheckCircle, desc: 'All done!' }
  ]
  const currentIdx = stages.findIndex(s => s.key === stage)

  return (
    <div className="flex items-center justify-between gap-2 p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl border border-indigo-100">
      {stages.map((s, i) => {
        const Icon = s.icon
        const isActive = i === currentIdx
        const isDone = i < currentIdx
        return (
          <div key={s.key} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 transition-all duration-500 ${
              isDone ? 'bg-green-500 text-white' :
              isActive ? 'bg-indigo-500 text-white animate-pulse' :
              'bg-gray-200 text-gray-400'
            }`}>
              {isDone ? <CheckCircle size={18} /> :
               isActive ? <Loader2 size={18} className="animate-spin" /> :
               <Icon size={18} />}
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className={`text-xs font-semibold ${isActive ? 'text-indigo-700' : isDone ? 'text-green-700' : 'text-gray-400'}`}>
                {s.label}
              </p>
            </div>
            {i < stages.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 rounded ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ██ MAIN BATCH COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function getInitialState() {
  try {
    const saved = sessionStorage.getItem('brandtide_batch_state')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {}
  return {
    step: 'upload' as 'upload' | 'preview' | 'processing' | 'results',
    rows: [] as Row[],
    fileName: '',
    parseError: '',
    result: null as SmartBatchResult | null,
    error: null as AgentError | null
  }
}

export default function Batch() {
  const initialState = getInitialState()
  
  const [step, setStep] = useState(initialState.step)
  const [rows, setRows] = useState(initialState.rows)
  const [fileName, setFileName] = useState(initialState.fileName)
  const [parseError, setParseError] = useState(initialState.parseError)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState<'cleaning' | 'classifying' | 'saving' | 'done'>('cleaning')
  const [result, setResult] = useState(initialState.result)
  const [error, setError] = useState(initialState.error)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      sessionStorage.setItem('brandtide_batch_state', JSON.stringify({
        step, rows, fileName, parseError, result, error
      }))
    } catch (e) {
      console.warn('Could not save batch state to sessionStorage')
    }
  }, [step, rows, fileName, parseError, result, error])

  async function handleFile(file: File) {
    setParseError('')
    setFileName(file.name)
    try {
      const data = await parseFile(file)
      if (data.length === 0) {
        setParseError('File is empty or contains no valid data rows.')
        return
      }
      setRows(data)
      setStep('preview')
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file')
    }
  }

  async function handleSmartBatch() {
    setLoading(true)
    setError(null)
    setResult(null)
    setStep('processing')
    setStage('cleaning')

    try {
      const stageTimer = setTimeout(() => setStage('classifying'), 2000)
      const stageTimer2 = setTimeout(() => setStage('saving'), 5000)

      const data = await smartClassifyBatch(rows)

      clearTimeout(stageTimer)
      clearTimeout(stageTimer2)
      setStage('done')
      setResult(data)
      setStep('results')
    } catch (err: any) {
      setError(mapError(err))
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }

  function resetAll() {
    setStep('upload')
    setRows([])
    setFileName('')
    setParseError('')
    setResult(null)
    setError(null)
    sessionStorage.removeItem('brandtide_batch_state')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function downloadResults() {
    if (!result?.data) return
    const csvData = result.data.map(row => {
      const { scores, index, ...rest } = row
      return rest
    })
    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'smart_batch_results.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`space-y-6 ${step === 'results' ? 'w-full max-w-[95vw]' : 'max-w-6xl'}`}>
      {/* Upload & Preview Card */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Upload className="text-white" size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-content">Smart Batch Classification</h3>
            <p className="text-xs text-content-muted">Upload any file — AI auto-detects columns, fixes missing data & classifies</p>
          </div>
        </div>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <label className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all">
              <FileSpreadsheet size={36} className="mx-auto text-content-muted mb-3" />
              <span className="text-sm font-medium text-content">Click to upload file</span>
              <span className="block text-xs text-content-muted mt-1">Supports {FORMAT_LABELS}</span>
              <span className="block text-xs text-indigo-500 mt-2 font-medium">
                ✨ AI will auto-detect columns — no specific format required
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]; if (!f) return
                  handleFile(f)
                }}
              />
            </label>
            {parseError && (
              <div className="p-3 border border-red-200 rounded-xl bg-red-50 flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{parseError}</p>
              </div>
            )}


          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-content-muted">
                <FileSpreadsheet size={14} />
                <span className="font-medium">{fileName}</span>
                <span>— {rows.length} rows loaded</span>
              </div>
              <button className="text-xs text-content-muted hover:text-red-500 transition" onClick={resetAll}>
                ✕ Reset
              </button>
            </div>

            {/* Data preview */}
            <div>
              <p className="text-sm font-medium text-content mb-2">Preview (first 20 rows):</p>
              <div className="overflow-auto rounded-xl border border-gray-200 max-h-[300px]">
                <table className="min-w-full text-xs">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-2 font-semibold text-content-muted uppercase tracking-wide">#</th>
                      {Object.keys(rows[0] || {}).slice(0, 6).map(col => (
                        <th key={col} className="text-left px-3 py-2 font-semibold text-content-muted uppercase tracking-wide">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 text-content-muted">{i + 1}</td>
                        {Object.keys(rows[0] || {}).slice(0, 6).map(col => (
                          <td key={col} className="px-3 py-2 text-content max-w-[200px] truncate">{String(row[col] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detected columns info */}
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              <p className="text-xs font-semibold text-indigo-700 mb-1">📋 Detected Columns:</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(rows[0] || {}).map(col => (
                  <span key={col} className="px-2 py-0.5 rounded-md bg-white text-indigo-600 text-xs font-mono border border-indigo-200">
                    {col}
                  </span>
                ))}
              </div>
              <p className="text-xs text-indigo-600 mt-2">
                ✨ AI will automatically map these to the required fields (text, brand, product, etc.)
              </p>
            </div>

            {error && (
              <ErrorDisplay error={error} onDismiss={() => setError(null)} />
            )}

            <div className="flex gap-3">
              <button
                className="btn-primary flex items-center gap-2"
                onClick={handleSmartBatch}
                disabled={loading}
              >
                <Zap size={16} />
                AI Smart Process & Classify
              </button>
              <button className="btn-secondary" onClick={resetAll}>Back</button>
            </div>
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="space-y-4">
            <ProcessingPipeline stage={stage} />
            <div className="text-center py-4">
              <Loader2 className="animate-spin mx-auto text-indigo-500 mb-3" size={32} />
              <p className="text-sm text-content">
                Processing {rows.length} rows with AI Agent...
              </p>
              <p className="text-xs text-content-muted mt-1">
                {stage === 'cleaning' && 'Data is converting into desired format'}
                {stage === 'classifying' && 'Running XLM-RoBERTa sentiment classification...'}
                {stage === 'saving' && 'Saving classified reviews to database...'}
              </p>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Results */}
      {step === 'results' && result && (
        <>
          {/* Processing Report */}
          <GlassCard>
            <h3 className="text-lg font-semibold text-content mb-4 flex items-center gap-2">
              <ShieldCheck size={20} className="text-green-500" /> AI Processing Report
            </h3>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-blue-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-blue-700">{result.report.totalInput}</p>
                <p className="text-xs text-blue-600 uppercase">Total Input</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-green-700">{result.report.totalProcessed}</p>
                <p className="text-xs text-green-600 uppercase">Processed</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-amber-700">{result.report.totalSkipped}</p>
                <p className="text-xs text-amber-600 uppercase">Skipped</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-purple-700">{result.saved.count}</p>
                <p className="text-xs text-purple-600 uppercase">Saved to DB</p>
              </div>
            </div>

            {/* Duplicates Message */}
            {(result.report as any).duplicatesSkipped > 0 && (
              <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-3 animate-fadeIn">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Wand2 size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-indigo-800">Duplicate Data Skipped</p>
                  <p className="text-xs text-indigo-700">
                    {`System detected and safely skipped ${(result.report as any).duplicatesSkipped} duplicated records using fast hashing.`}
                  </p>
                </div>
              </div>
            )}

            {/* Sentiment Breakdown */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-content-muted uppercase mb-2">Sentiment Breakdown</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-green-50 rounded-xl text-center">
                  <p className="text-xl font-bold text-green-600">{result.saved.breakdown.Positive || 0}</p>
                  <p className="text-xs text-green-600">Positive</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-xl text-center">
                  <p className="text-xl font-bold text-gray-600">{result.saved.breakdown.Neutral || 0}</p>
                  <p className="text-xs text-gray-500">Neutral</p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl text-center">
                  <p className="text-xl font-bold text-red-600">{result.saved.breakdown.Negative || 0}</p>
                  <p className="text-xs text-red-600">Negative</p>
                </div>
              </div>
              {/* Bar */}
              <div className="mt-2 flex h-2.5 rounded-full overflow-hidden bg-gray-200">
                {(result.saved.breakdown.Positive || 0) > 0 && (
                  <div className="bg-green-500" style={{ width: `${(result.saved.breakdown.Positive / result.report.totalProcessed * 100)}%` }} />
                )}
                {(result.saved.breakdown.Neutral || 0) > 0 && (
                  <div className="bg-yellow-400" style={{ width: `${(result.saved.breakdown.Neutral / result.report.totalProcessed * 100)}%` }} />
                )}
                {(result.saved.breakdown.Negative || 0) > 0 && (
                  <div className="bg-red-500" style={{ width: `${(result.saved.breakdown.Negative / result.report.totalProcessed * 100)}%` }} />
                )}
              </div>
            </div>

            {/* Column Mapping */}
            {result.report.columnMapping && Object.keys(result.report.columnMapping).length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-content-muted uppercase mb-2">🧠 AI Column Mapping</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.report.columnMapping).map(([from, to]) => (
                    <div key={from} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100">
                      <span className="text-xs font-mono text-indigo-600">{from}</span>
                      <ArrowRight size={10} className="text-indigo-400" />
                      <span className="text-xs font-semibold text-indigo-700">{String(to)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Data Handling */}
            {result.report.missingDataHandling && result.report.missingDataHandling.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs font-semibold text-amber-700 mb-1.5">⚡ Missing Data Auto-Filled</p>
                <div className="space-y-1">
                  {result.report.missingDataHandling.map((msg, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-700">
                      <Info size={12} className="flex-shrink-0 mt-0.5" />
                      <span>{msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modifications */}
            {result.report.modifications && result.report.modifications.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-content-muted uppercase mb-2">✨ Modifications Applied</p>
                <div className="space-y-1">
                  {result.report.modifications.map((mod, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-content">
                      <CheckCircle size={12} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{mod}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {result.report.warnings && result.report.warnings.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-content-muted uppercase mb-2">⚠️ Warnings</p>
                <div className="space-y-1">
                  {result.report.warnings.map((warn, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-700">
                      <AlertTriangle size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skipped Details */}
            {result.report.skippedDetails && result.report.skippedDetails.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-content-muted uppercase mb-2">🚫 Skipped Rows</p>
                <div className="max-h-[150px] overflow-auto space-y-1">
                  {result.report.skippedDetails.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-red-600">
                      <XCircle size={12} className="flex-shrink-0 mt-0.5" />
                      <span>Row {s.row}: {s.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Results Table */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-content">Classified Results ({result.data.length})</h3>
              <div className="flex gap-2">
                <button className="btn-primary flex items-center gap-2" onClick={downloadResults}>
                  <Download size={16} /> Download CSV
                </button>
                <button className="btn-secondary flex items-center gap-2" onClick={resetAll}>
                  <RefreshCw size={16} /> New Batch
                </button>
              </div>
            </div>

            <div className="overflow-auto rounded-xl border-2 border-gray-200 bg-white shadow-lg max-h-[75vh]">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-content-muted text-xs uppercase tracking-wide w-8">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-content-muted text-xs uppercase tracking-wide min-w-[300px]">Text</th>
                    <th className="text-left px-4 py-3 font-semibold text-content-muted text-xs uppercase tracking-wide">Review ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-content-muted text-xs uppercase tracking-wide">Product Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-content-muted text-xs uppercase tracking-wide">Product ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-content-muted text-xs uppercase tracking-wide">Brand</th>
                    <th className="text-left px-4 py-3 font-semibold text-content-muted text-xs uppercase tracking-wide">Topic</th>
                    <th className="text-left px-4 py-3 font-semibold text-content-muted text-xs uppercase tracking-wide">Sentiment</th>
                    <th className="text-left px-4 py-3 font-semibold text-content-muted text-xs uppercase tracking-wide">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((row, i) => {
                    const textVal = row.text || row.review_text || row.review || row.comment || ''
                    const conf = typeof row.confidence === 'number' ? row.confidence : 0
                    return (
                      <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-content-muted text-xs">{i + 1}</td>
                        <td className="px-4 py-3 text-content text-xs max-w-md">
                          <span className="line-clamp-2">{textVal}</span>
                        </td>
                        <td className="px-4 py-3 text-content text-xs">{row.review_id || '—'}</td>
                        <td className="px-4 py-3 text-content text-xs">{row.product_name || '—'}</td>
                        <td className="px-4 py-3 text-content text-xs">{row.product_id || '—'}</td>
                        <td className="px-4 py-3 text-content text-xs">{row.brand || '—'}</td>
                        <td className="px-4 py-3 text-content text-xs">{row.topic || '—'}</td>
                        <td className="px-4 py-3">
                          <SentimentBadge label={row.label} />
                        </td>
                        <td className="px-4 py-3 text-content font-medium text-xs">
                          {(conf * 100).toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  )
}
