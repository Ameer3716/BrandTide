import { useState } from 'react'
import GlassCard from '@/components/ui/GlassCard'
import { classifySingle } from '@/services/api'
import { Sparkles, Copy, CheckCircle, AlertCircle } from 'lucide-react'

interface ClassifyResult {
  label: string
  confidence: number
  lang: string
  scores?: { negative?: number; neutral?: number; positive?: number }
}

export default function Classifier() {
  const [text, setText] = useState('Battery zbrdst hai but thori heating problem.')
  const [loading, setLoading] = useState(false)
  const [res, setRes] = useState<ClassifyResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function onClassify() {
    setLoading(true)
    setError('')
    try {
      const out = await classifySingle(text)
      setRes(out)
    } catch (err: any) {
      setError(err.message || 'Classification failed. Make sure the ML service is running.')
    }
    setLoading(false)
  }

  function copyResult() {
    navigator.clipboard.writeText(res ? JSON.stringify(res, null, 2) : '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-3xl">
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-content">Single Sentence Classifier</h3>
            <p className="text-sm text-content-muted">Analyze sentiment of any text instantly</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-content mb-1.5">Enter text to analyze</label>
            <textarea
              rows={5}
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full resize-none"
              placeholder="Type or paste text here..."
            />
          </div>

          <div className="flex gap-3">
            <button
              className="btn-primary flex items-center gap-2"
              onClick={onClassify}
              disabled={loading || !text.trim()}
            >
              <Sparkles size={16} />
              {loading ? 'Analyzing...' : 'Classify Sentiment'}
            </button>
            {res && (
              <button
                className="btn-secondary flex items-center gap-2"
                onClick={copyResult}
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Result'}
              </button>
            )}
          </div>
        </div>

        {res && (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="text-sm font-medium text-content mb-3">Analysis Result</h4>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-content-muted uppercase tracking-wide mb-1">Sentiment</p>
                <p className={`text-lg font-semibold ${res.label === 'positive' ? 'text-accent' :
                    res.label === 'negative' ? 'text-red-500' : 'text-gray-500'
                  }`}>
                  {res.label.charAt(0).toUpperCase() + res.label.slice(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-content-muted uppercase tracking-wide mb-1">Confidence</p>
                <p className="text-lg font-semibold text-content">{(res.confidence * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-content-muted uppercase tracking-wide mb-1">Language</p>
                <p className="text-lg font-semibold text-content">{res.lang === 'auto' ? 'Auto-detected' : res.lang}</p>
              </div>
            </div>

            {/* Score breakdown */}
            {res.scores && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-content-muted uppercase tracking-wide mb-3">Score Breakdown</p>
                <div className="space-y-2">
                  {Object.entries(res.scores).map(([label, score]) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-content w-16 capitalize">{label}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            label === 'positive' ? 'bg-green-500' :
                            label === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${((score as number) * 100).toFixed(1)}%` }}
                        />
                      </div>
                      <span className="text-xs text-content-muted w-14 text-right">
                        {((score as number) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
    </div>
  )
}
