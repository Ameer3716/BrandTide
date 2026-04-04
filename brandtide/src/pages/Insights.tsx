import { useState, useEffect } from 'react'
import GlassCard from '@/components/ui/GlassCard'
import TopicChip from '@/components/ui/TopicChip'
import ReviewSnippet from '@/components/ui/ReviewSnippet'
import { dataService } from '@/services/data'
import { Filter, Download, FileText, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

export default function Insights() {
  const [topics, setTopics] = useState<any[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [active, setActive] = useState('')
  const [samples, setSamples] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalReviews, setTotalReviews] = useState(0)
  const pageSize = 6

  // Load topics, brands, products from actual data
  useEffect(() => {
    async function loadData() {
      try {
        const [topicsData, brandsData, productsData, reviewsResponse] = await Promise.all([
          dataService.getTopics(),
          dataService.getBrands(),
          dataService.getProducts(),
          dataService.getRepresentativeReviews('pos', pageSize, undefined, undefined, undefined, 0)
        ])
        setTopics(topicsData || [])
        setBrands(brandsData || [])
        setProducts(productsData || [])
        setSamples(reviewsResponse.data || [])
        setTotalReviews(reviewsResponse.total || 0)
        setActive('') // Set to empty string to show "All" topics by default
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
        setSelectedProduct('') // Reset product filter when brand changes
      } catch (error) {
        console.error('Error loading products:', error)
      }
    }
    loadProducts()
  }, [selectedBrand])

  // Reload samples when brand, product, or topic filter changes
  useEffect(() => {
    setCurrentPage(1) // Reset to page 1 when filters change
  }, [selectedBrand, selectedProduct, active])

  // Reload samples when page changes or filters reset
  useEffect(() => {
    async function loadSamples() {
      try {
        const skip = (currentPage - 1) * pageSize
        const reviewsResponse = await dataService.getRepresentativeReviews(
          'pos',
          pageSize,
          selectedBrand || undefined,
          selectedProduct || undefined,
          active || undefined,
          skip
        )
        setSamples(reviewsResponse.data || [])
        setTotalReviews(reviewsResponse.total || 0)
      } catch (error) {
        console.error('Error loading samples:', error)
      }
    }
    loadSamples()
  }, [selectedBrand, selectedProduct, active, currentPage])

  // Reload topics when brand or product filter changes
  useEffect(() => {
    async function loadTopics() {
      try {
        const topicsData = await dataService.getTopics(selectedBrand || undefined, selectedProduct || undefined)
        setTopics(topicsData || [])
        setActive('') // Reset to "All" topics when filters change
      } catch (error) {
        console.error('Error loading topics:', error)
      }
    }
    loadTopics()
  }, [selectedBrand, selectedProduct])

  const handlePageChange = async (newPage: number) => {
    const maxPage = Math.ceil(totalReviews / pageSize)
    if (newPage < 1 || newPage > maxPage) return
    
    setCurrentPage(newPage)
    try {
      const skip = (newPage - 1) * pageSize
      const reviewsResponse = await dataService.getRepresentativeReviews(
        'pos',
        pageSize,
        selectedBrand || undefined,
        selectedProduct || undefined,
        active || undefined,
        skip
      )
      setSamples(reviewsResponse.data || [])
    } catch (error) {
      console.error('Error loading page:', error)
    }
  }

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
  const totalPages = Math.ceil(totalReviews / pageSize)

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
              <TopicChip
                label="All"
                count={totalReviews}
                active={active === ''}
                onClick={() => setActive('')}
              />
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
          <>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {samples.map(s => (
                <ReviewSnippet
                  key={s.id}
                  snippet={s.snippet}
                  meta={`${s.product.name} • ${s.freq}× • conf ${s.conf}`}
                />
              ))}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded-lg transition ${
                        page === currentPage
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Page info */}
            {totalPages > 0 && (
              <div className="text-center mt-4 text-sm text-content-muted">
                Page {currentPage} of {totalPages} • {totalReviews} total reviews
              </div>
            )}
          </>
        )}
      </GlassCard>
    </div>
  )
}
