import { useState, useEffect } from 'react'
import GlassCard from '@/components/ui/GlassCard'
import { dataService } from '@/services/data'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

export default function Highlights() {
  const [pos, setPos] = useState<any[]>([])
  const [neg, setNeg] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReviews() {
      try {
        const [posReviews, negReviews] = await Promise.all([
          dataService.getRepresentativeReviews('pos', 5),
          dataService.getRepresentativeReviews('neg', 5)
        ])
        setPos(posReviews)
        setNeg(negReviews)
      } catch (error) {
        console.error('Error loading highlights:', error)
      } finally {
        setLoading(false)
      }
    }
    loadReviews()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-content-muted">Loading highlights...</div>
      </div>
    )
  }

  return (
    <GlassCard>
      <h3 className="text-lg font-semibold text-content mb-6">Top Representative Reviews</h3>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Positive column */}
        <div>
          <h4 className="flex items-center gap-2 text-sm font-medium text-accent mb-4">
            <ThumbsUp size={16} />
            Top 10 Positive
          </h4>
          <div className="space-y-3">
            {pos.map(x => (
              <div key={x.id} className="p-4 bg-accent-50 border border-accent-100 rounded-xl">
                <p className="text-sm text-content leading-relaxed">"{x.snippet}"</p>
                <p className="text-xs text-content-muted mt-2">
                  {x.product.name} • freq {x.freq} • conf {x.conf}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Negative column */}
        <div>
          <h4 className="flex items-center gap-2 text-sm font-medium text-red-500 mb-4">
            <ThumbsDown size={16} />
            Top 10 Negative
          </h4>
          <div className="space-y-3">
            {neg.map(x => (
              <div key={x.id} className="p-4 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-sm text-content leading-relaxed">"{x.snippet}"</p>
                <p className="text-xs text-content-muted mt-2">
                  {x.product.name} • freq {x.freq} • conf {x.conf}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
