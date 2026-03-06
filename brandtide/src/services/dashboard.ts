import api from './api'

export interface DashboardMetrics {
  totalReviews: number
  distribution: {
    positive: number
    neutral: number
    negative: number
  }
}

export interface SentimentTrendData {
  date: string
  pos: number
  neu: number
  neg: number
}

export interface TopProduct {
  id: string
  name: string
  brand: string
  count: number
  conf: number
}

export interface RepresentativeReview {
  id: string
  snippet: string
  product: {
    id: string
    name: string
  }
  conf: number
}

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    const response = await api.get('/dashboard/metrics')
    return response.data.data
  },

  async getSentimentTrend(days: number = 30): Promise<SentimentTrendData[]> {
    const response = await api.get(`/dashboard/metrics?days=${days}`)
    return response.data.data.timeSeries || []
  },

  async getTopProducts(): Promise<{ pos: TopProduct[]; neg: TopProduct[] }> {
    // This will use the existing dashboard overview endpoint
    const response = await api.get('/dashboard/overview')
    return response.data.data.topProducts || { pos: [], neg: [] }
  },

  async getRepresentativeReviews(
    kind: 'pos' | 'neg',
    limit: number = 10
  ): Promise<RepresentativeReview[]> {
    const response = await api.get('/dashboard/overview')
    const reviews = response.data.data.recentReviews || []
    
    // Filter by sentiment
    const sentimentLabel = kind === 'pos' ? 'Positive' : 'Negative'
    return reviews
      .filter((r: any) => r.sentiment?.label === sentimentLabel)
      .slice(0, limit)
      .map((r: any) => ({
        id: r._id || r.id,
        snippet: r.text,
        product: {
          id: r.productId,
          name: r.productName
        },
        conf: r.sentiment.confidence
      }))
  },

  async getBrands(): Promise<string[]> {
    // Extract unique brands from reviews
    const response = await api.get('/dashboard/overview')
    const products = response.data.data.topProducts?.pos || []
    const brands = [...new Set(products.map((p: any) => p.brand))]
    return brands.length > 0 ? brands : ['Aurora', 'Nimbus', 'Vertex']
  },

  async getProducts(brand?: string): Promise<Array<{ id: string; name: string; brand: string }>> {
    const response = await api.get('/dashboard/overview')
    let products = response.data.data.topProducts?.pos || []
    
    if (brand) {
      products = products.filter((p: any) => p.brand === brand)
    }
    
    return products.length > 0
      ? products.map((p: any) => ({ id: p.id || p.productId, name: p.name, brand: p.brand }))
      : [
          { id: 'P-100', brand: 'Aurora', name: 'Aurora X1' },
          { id: 'P-101', brand: 'Aurora', name: 'Aurora Mini' },
          { id: 'P-200', brand: 'Nimbus', name: 'Nimbus Air' },
          { id: 'P-201', brand: 'Nimbus', name: 'Nimbus Max' },
          { id: 'P-300', brand: 'Vertex', name: 'Vertex Pro' },
          { id: 'P-301', brand: 'Vertex', name: 'Vertex Lite' }
        ]
  },

  async initializeSampleData() {
    const response = await api.post('/dashboard/init-sample')
    return response.data
  }
}
