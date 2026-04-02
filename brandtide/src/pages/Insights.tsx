import { useState, useEffect } from 'react'
import GlassCard from '@/components/ui/GlassCard'
import TopicChip from '@/components/ui/TopicChip'
import ReviewSnippet from '@/components/ui/ReviewSnippet'
import { dataService } from '@/services/data'
import { Filter, Download, FileText, Loader2 } from 'lucide-react'

export default function Insights() {
  const [topics, setTopics] = useState<any[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [active, setActive] = useState('')
  const [samples, setSamples] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')

  // Load topics, brands, products from actual data
  useEffect(() => {
    async function loadData() {
      try {
        const [topicsData, brandsData, productsData, reviews] = await Promise.all([
          dataService.getTopics(),
          dataService.getBrands(),
          dataService.getProducts(),
          dataService.getRepresentativeReviews('pos', 6)
        ])
        setTopics(topicsData || [])
        setBrands(brandsData || [])
        setProducts(productsData || [])
        setSamples(reviews || [])
        if (topicsData && topicsData.length > 0) {
          setActive(topicsData[0].label)
        }
      } catch (error) {
        console.error('Error loading insights:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Reload products when brand changes
  useEffect(() => {
    async function loadProducts() {
      try {
        const productsData = await dataService.getProducts(selectedBrand || undefined)
        setProducts(productsData || [])
      } catch (error) {
        console.error('Error loading products:', error)
      }
    }
    loadProducts()
  }, [selectedBrand])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-content-muted">
          <Loader2 className="animate-spin" size={20} />
          Loading insights...
        </div>
      </div>
    )
  }

  const noData = topics.length === 0 && samples.length === 0

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
            <select
              className="w-full"
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
            >
              <option value="">All brands</option>
              {brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-content mb-1.5">Product</label>
            <select
              className="w-full"
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
            >
              <option value="">All products</option>
              {products.map((p: any) => (
                <option key={p.id || p.name} value={p.name}>{p.name}</option>
              ))}
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
        </div>

        <hr className="my-4 border-gray-200" />

        <div>
          <h4 className="text-sm font-medium text-content mb-3">Topics</h4>
          {topics.length > 0 ? (
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
          ) : (
            <p className="text-xs text-content-muted">
              No topics yet. Upload a CSV in Batch Classification to see topics here.
            </p>
          )}
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

        {noData ? (
          <div className="text-center py-12">
            <p className="text-content-muted text-sm mb-2">No review data available yet.</p>
            <p className="text-content-muted text-xs">
              Upload a CSV file in the <strong>Batch Classification</strong> page to populate insights.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {samples.map(s => (
              <ReviewSnippet
                key={s.id}
                snippet={s.snippet}
                meta={`${s.product.name} • ${s.freq}× • conf ${s.conf}`}
              />
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
