const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const getAuthHeaders = () => {
  const userStr = localStorage.getItem('bt:user')
  let token = null
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      token = user.token
    } catch {
      token = null
    }
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export const dataService = {
  // Get dashboard metrics
  async getMetrics() {
    const response = await fetch(`${API_URL}/data/metrics`, {
      headers: getAuthHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data.data
  },

  // Get sentiment trend
  async getSentimentTrend(days = 30) {
    const response = await fetch(`${API_URL}/data/sentiment-trend?days=${days}`, {
      headers: getAuthHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data.data
  },

  // Get top products
  async getTopProducts(brand?: string, product?: string) {
    const params = new URLSearchParams()
    if (brand) params.append('brand', brand)
    if (product) params.append('product', product)
    
    const url = params.toString()
      ? `${API_URL}/data/top-products?${params.toString()}`
      : `${API_URL}/data/top-products`
    
    const response = await fetch(url, {
      headers: getAuthHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data.data
  },

  // Get representative reviews
  async getRepresentativeReviews(kind = 'pos', limit = 10, brand?: string, product?: string, topic?: string, skip = 0) {
    const params = new URLSearchParams()
    params.append('kind', kind)
    params.append('limit', String(limit))
    params.append('skip', String(skip))
    if (brand) params.append('brand', brand)
    if (product) params.append('product', product)
    if (topic) params.append('topic', topic)
    
    const response = await fetch(`${API_URL}/data/representative-reviews?${params.toString()}`, {
      headers: getAuthHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data  // Return full response: { success, data, total }
  },

  // Get brands list
  async getBrands() {
    const response = await fetch(`${API_URL}/data/brands`, {
      headers: getAuthHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data.data
  },

  // Get products list
  async getProducts(brand?: string) {
    const url = brand 
      ? `${API_URL}/data/products?brand=${brand}` 
      : `${API_URL}/data/products`
    
    const response = await fetch(url, {
      headers: getAuthHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data.data
  },

  // Initialize sample data (first time users)
  async initializeSampleData() {
    const response = await fetch(`${API_URL}/data/init-sample-data`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  // Check if user has any data (for auto-initialization)
  async hasData() {
    try {
      const metrics = await this.getMetrics()
      return metrics.totalReviews > 0
    } catch {
      return false
    }
  },

  // Get topics aggregated from reviews
  async getTopics(brand?: string, product?: string, kind: string = 'pos') {
    const params = new URLSearchParams()
    if (brand) params.append('brand', brand)
    if (product) params.append('product', product)
    params.append('kind', kind)
    
    const url = params.toString() 
      ? `${API_URL}/data/topics?${params.toString()}`
      : `${API_URL}/data/topics`
    
    const response = await fetch(url, {
      headers: getAuthHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data.data
  }
}
