import GlassCard from '@/components/ui/GlassCard'
import UploaderStepper from '@/components/ui/UploaderStepper'
import { useState } from 'react'
import { classifyBatch } from '@/services/api'
import Papa from 'papaparse'
import { Download, Upload, AlertCircle, Loader2, ThumbsUp, ThumbsDown, Minus } from 'lucide-react'

function SentimentBadge({ label }: { label: string }) {
  const normalized = label?.toLowerCase() || ''
  if (normalized === 'positive') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      <ThumbsUp size={12} /> Positive
    </span>
  )
  if (normalized === 'negative') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
      <ThumbsDown size={12} /> Negative
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
      <Minus size={12} /> Neutral
    </span>
  )
}

export default function Batch() {
  const [out, setOut] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<{ positive: number; negative: number; neutral: number; total: number } | null>(null)

  async function runBatch(data: any[]) {
    setLoading(true)
    setError('')
    try {
      const res = await classifyBatch(data)
      setOut(res)
      // Calculate stats
      const pos = res.filter((r: any) => r.label?.toLowerCase() === 'positive').length
      const neg = res.filter((r: any) => r.label?.toLowerCase() === 'negative').length
      const neu = res.filter((r: any) => r.label?.toLowerCase() === 'neutral').length
      setStats({ positive: pos, negative: neg, neutral: neu, total: res.length })
    } catch (err: any) {
      setError(err.message || 'Batch classification failed. Make sure the ML service is running.')
    }
    setLoading(false)
  }

  function download() {
    // Clean up scores object for CSV export
    const csvData = out.map(row => {
      const { scores, index, ...rest } = row
      return rest
    })
    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'batch_results.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Upload className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-content">Batch Classification</h3>
            <p className="text-sm text-content-muted">Upload CSV files for bulk sentiment analysis</p>
          </div>
        </div>
        <UploaderStepper onDone={runBatch} />
        {loading && (
          <div className="flex items-center gap-3 mt-4 p-4 bg-accent/5 rounded-xl">
            <Loader2 className="animate-spin text-accent" size={20} />
            <p className="text-sm text-content">Running ML classification on your reviews...</p>
          </div>
        )}
        {error && (
          <div className="mt-4 p-4 border border-red-200 rounded-xl bg-red-50 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-700">Classification Failed</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}
      </GlassCard>

      {out.length > 0 && (
        <>
          {/* Summary stats */}
          {stats && (
            <GlassCard>
              <h3 className="text-lg font-semibold text-content mb-4">Classification Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-content">{stats.total}</p>
                  <p className="text-xs text-content-muted uppercase tracking-wide">Total Reviews</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.positive}</p>
                  <p className="text-xs text-green-600 uppercase tracking-wide">Positive</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-xl text-center">
                  <p className="text-2xl font-bold text-gray-600">{stats.neutral}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Neutral</p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.negative}</p>
                  <p className="text-xs text-red-600 uppercase tracking-wide">Negative</p>
                </div>
              </div>
              {/* Bar visualization */}
              <div className="mt-4 flex h-3 rounded-full overflow-hidden bg-gray-200">
                {stats.positive > 0 && (
                  <div className="bg-green-500 transition-all" style={{ width: `${(stats.positive / stats.total * 100)}%` }} />
                )}
                {stats.neutral > 0 && (
                  <div className="bg-yellow-400 transition-all" style={{ width: `${(stats.neutral / stats.total * 100)}%` }} />
                )}
                {stats.negative > 0 && (
                  <div className="bg-red-500 transition-all" style={{ width: `${(stats.negative / stats.total * 100)}%` }} />
                )}
              </div>
              <div className="flex gap-4 mt-2 text-xs text-content-muted">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Positive {(stats.positive / stats.total * 100).toFixed(0)}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Neutral {(stats.neutral / stats.total * 100).toFixed(0)}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Negative {(stats.negative / stats.total * 100).toFixed(0)}%</span>
              </div>
            </GlassCard>
          )}

          {/* Results table */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-content">Results ({Math.min(out.length, 50)} of {out.length})</h3>
              <button className="btn-primary flex items-center gap-2" onClick={download}>
                <Download size={16} />
                Download Results CSV
              </button>
            </div>
            <div className="overflow-auto rounded-xl border-2 border-gray-200 bg-white shadow-lg max-h-[500px]">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-content-muted text-xs uppercase tracking-wide w-8">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-content-muted text-xs uppercase tracking-wide min-w-[300px]">Text</th>
                    <th className="text-left px-4 py-3 font-semibold text-content-muted text-xs uppercase tracking-wide">Sentiment</th>
                    <th className="text-left px-4 py-3 font-semibold text-content-muted text-xs uppercase tracking-wide">Confidence</th>
                    {out[0]?.brand && (
                      <th className="text-left px-4 py-3 font-semibold text-content-muted text-xs uppercase tracking-wide">Brand</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {out.slice(0, 50).map((row, i) => {
                    const textVal = row.text || row.review_text || row.review || row.comment || ''
                    const conf = typeof row.confidence === 'number' ? row.confidence : 0
                    return (
                      <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-content-muted text-xs">{i + 1}</td>
                        <td className="px-4 py-3 text-content text-xs max-w-md">
                          <span className="line-clamp-2">{textVal}</span>
                        </td>
                        <td className="px-4 py-3">
                          <SentimentBadge label={row.label} />
                        </td>
                        <td className="px-4 py-3 text-content font-medium text-xs">
                          {(conf * 100).toFixed(1)}%
                        </td>
                        {out[0]?.brand && (
                          <td className="px-4 py-3 text-content text-xs">{row.brand || '—'}</td>
                        )}
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
