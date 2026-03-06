import { useState, useEffect } from 'react'
import GlassCard from '@/components/ui/GlassCard'
import { dataService } from '@/services/data'
import { ExternalLink, MessageSquare } from 'lucide-react'

export default function Reviews() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReviews() {
      try {
        const reviews = await dataService.getRepresentativeReviews('pos', 20)
        setList(reviews)
      } catch (error) {
        console.error('Error loading reviews:', error)
      } finally {
        setLoading(false)
      }
    }
    loadReviews()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-content-muted">Loading reviews...</div></div>
  }
  return (
    <GlassCard>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
          <MessageSquare className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-content">Reviews Viewer</h3>
          <p className="text-sm text-content-muted">Browse representative customer reviews</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {list.map(x => (
          <div key={x.id} className="p-4 bg-white border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <p className="text-sm text-content leading-relaxed">"{x.snippet}"</p>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-content-muted">
                {x.product.name} • freq {x.freq} • conf {x.conf}
              </p>
              <a
                href="#"
                className="text-xs text-accent hover:text-accent-dark font-medium flex items-center gap-1"
              >
                View original <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
