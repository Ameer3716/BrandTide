import { useState, useEffect } from 'react'
import GlassCard from '@/components/ui/GlassCard'
import DataTable from '@/components/ui/DataTable'
import { dataService } from '@/services/data'
import { Trophy, ThumbsDown } from 'lucide-react'

export default function Ranking() {
  const [products, setProducts] = useState<any>({ pos: [], neg: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await dataService.getTopProducts()
        setProducts(data)
      } catch (error) {
        console.error('Error loading ranking:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-content-muted">Loading rankings...</div></div>
  }

  const { pos, neg } = products
  return (
    <GlassCard>
      <h3 className="text-lg font-semibold text-content mb-6">Product Rankings</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-medium text-accent mb-4">
            <Trophy size={16} />
            Top 10 Performing Products
          </h4>
          <DataTable columns={[
            { key: 'name', label: 'Product' },
            { key: 'brand', label: 'Brand' },
            { key: 'count', label: 'Mentions' },
            { key: 'conf', label: 'Confidence' },
          ]} records={pos as any} />
        </div>
        <div>
          <h4 className="flex items-center gap-2 text-sm font-medium text-red-500 mb-4">
            <ThumbsDown size={16} />
            Bottom 10 Products
          </h4>
          <DataTable columns={[
            { key: 'name', label: 'Product' },
            { key: 'brand', label: 'Brand' },
            { key: 'count', label: 'Mentions' },
            { key: 'conf', label: 'Confidence' },
          ]} records={neg as any} />
        </div>
      </div>
    </GlassCard>
  )
}
