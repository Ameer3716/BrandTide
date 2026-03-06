import { useState, useEffect } from 'react'
import GlassCard from '@/components/ui/GlassCard'
import MetricCard from '@/components/ui/MetricCard'
import DonutChart from '@/components/ui/DonutChart'
import StackedBarChart from '@/components/ui/StackedBarChart'
import TrendSparkline from '@/components/ui/TrendSparkline'
import DataTable from '@/components/ui/DataTable'
import PDFBuilder from '@/components/ui/PDFBuilder'
import ScheduleModal from '@/components/ui/ScheduleModal'
import { dataService } from '@/services/data'
import { MoreHorizontal } from 'lucide-react'

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [sentimentTrend, setSentimentTrend] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any>({ pos: [], neg: [] })
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)

  useEffect(() => {
    async function loadData() {
      const startTime = performance.now()
      
      try {
        // Load all data in parallel for maximum speed
        const [metricsData, trendData, productsData] = await Promise.all([
          dataService.getMetrics(),
          dataService.getSentimentTrend(30),
          dataService.getTopProducts()
        ])
        
        const loadTime = performance.now() - startTime
        console.log(`Dashboard data loaded in ${loadTime.toFixed(2)}ms`)
        
        // Check if database has actual data (not mock data)
        if (metricsData.totalReviews === 0 || metricsData.totalReviews === 1543) {
          console.log('No data in database, initializing sample data...')
          setInitializing(true)
          
          // Initialize sample data
          await dataService.initializeSampleData()
          
          // Reload data after initialization
          const [newMetrics, newTrend, newProducts] = await Promise.all([
            dataService.getMetrics(),
            dataService.getSentimentTrend(30),
            dataService.getTopProducts()
          ])
          
          setMetrics(newMetrics)
          setSentimentTrend(newTrend)
          setTopProducts(newProducts)
          setInitializing(false)
        } else {
          setMetrics(metricsData)
          setSentimentTrend(trendData)
          setTopProducts(productsData)
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading || initializing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-content-muted">
          {initializing ? 'Initializing your dashboard data...' : 'Loading dashboard...'}
        </div>
      </div>
    )
  }

  const dist = metrics?.distribution || []
  const productBars = topProducts.pos.map((p: any) => ({ 
    name: p.name, 
    pos: Math.floor(p.count * 0.6), 
    neu: Math.floor(p.count * 0.2), 
    neg: Math.floor(p.count * 0.2) 
  }))

  return (
    <div className="space-y-6">
      {/* Metrics row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Reviews" value={metrics?.totalReviews?.toLocaleString() || '0'} delta={5.2} />
        <MetricCard label="Positive" value={`${metrics?.positivePercent || 50}%`} delta={1.1} />
        <MetricCard label="Neutral" value={`${metrics?.neutralPercent || 20}%`} delta={-0.4} />
        <MetricCard label="Negative" value={`${metrics?.negativePercent || 30}%`} delta={-0.7} />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-content">Sentiment Distribution</h3>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
              <MoreHorizontal size={18} className="text-content-muted" />
            </button>
          </div>
          <DonutChart data={dist} />
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-content">Product Sentiment Breakdown</h3>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
              <MoreHorizontal size={18} className="text-content-muted" />
            </button>
          </div>
          <StackedBarChart data={productBars} />
        </GlassCard>
      </div>

      {/* Trend and Actions row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-content">Sentiment Trend</h3>
            <select className="text-sm border-0 bg-gray-100 rounded-lg px-3 py-1.5">
              <option>Last 30 days</option>
              <option>Last 7 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <TrendSparkline data={sentimentTrend} />
        </GlassCard>

        <GlassCard>
          <h3 className="text-lg font-semibold text-content mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <PDFBuilder />
            <ScheduleModal />
          </div>
        </GlassCard>
      </div>

      {/* Tables row */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-content">Top & Bottom Products</h3>
          <button className="text-sm text-accent hover:text-accent-dark font-medium">View all</button>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-accent mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent"></span>
              Top 10 Positive
            </h4>
            <DataTable columns={[
              { key: 'name', label: 'Product' },
              { key: 'brand', label: 'Brand' },
              { key: 'count', label: 'Mentions' },
              { key: 'conf', label: 'Confidence' }
            ]} records={topProducts.pos as any} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-red-500 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Bottom 10 Negative
            </h4>
            <DataTable columns={[
              { key: 'name', label: 'Product' },
              { key: 'brand', label: 'Brand' },
              { key: 'count', label: 'Mentions' },
              { key: 'conf', label: 'Confidence' }
            ]} records={topProducts.neg as any} />
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
