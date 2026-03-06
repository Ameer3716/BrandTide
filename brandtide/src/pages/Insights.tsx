import { useState, useEffect } from 'react'
import GlassCard from '@/components/ui/GlassCard'
import TopicChip from '@/components/ui/TopicChip'
import ReviewSnippet from '@/components/ui/ReviewSnippet'
import { dataService } from '@/services/data'
import { Filter, Download, FileText } from 'lucide-react'

const topics = [
  { label: 'Battery', count: 128 },
  { label: 'Camera', count: 96 },
  { label: 'Delivery delay', count: 44 },
  { label: 'Build quality', count: 72 },
  { label: 'Overheating', count: 31 },
  { label: 'Value for money', count: 85 },
]

export default function Insights() {
  const [active, setActive] = useState('Battery')
  const [samples, setSamples] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReviews() {
      try {
        const reviews = await dataService.getRepresentativeReviews('pos', 6)
        setSamples(reviews)
      } catch (error) {
        console.error('Error loading insights:', error)
      } finally {
        setLoading(false)
      }
    }
    loadReviews()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-content-muted">Loading insights...</div>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Filters sidebar */}
      <GlassCard className="lg:col-span-1">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-content-muted" />
          <h3 className="text-lg font-semibold text-content">Filters</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-content mb-1.5">Brand</label>
            <select className="w-full">
              <option>All brands</option>
              <option>Aurora</option>
              <option>Nimbus</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-content mb-1.5">Product</label>
            <select className="w-full">
              <option>All products</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-content mb-1.5">Time Range</label>
            <select className="w-full">
              <option>Last 30 days</option>
              <option>Last 7 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-content mb-1.5">Language</label>
            <select className="w-full">
              <option>All languages</option>
              <option>Code-mixed</option>
            </select>
          </div>
        </div>

        <hr className="my-4 border-gray-200" />

        <div>
          <h4 className="text-sm font-medium text-content mb-3">Topics</h4>
          <div className="flex flex-wrap gap-2">
            {topics.map(t => (
              <TopicChip
                key={t.label}
                label={t.label}
                count={t.count}
                active={t.label === active}
                onClick={() => setActive(t.label)}
              />
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Main content */}
      <GlassCard className="lg:col-span-3">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-content">Representative Examples</h3>
          <div className="flex gap-2">
            <button className="btn-primary flex items-center gap-2">
              <FileText size={16} />
              Export PDF
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {samples.map(s => (
            <ReviewSnippet
              key={s.id}
              snippet={s.snippet}
              meta={`${s.product.name} • ${s.freq}× • conf ${s.conf}`}
            />
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
