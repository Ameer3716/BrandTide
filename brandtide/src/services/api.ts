const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Helper to get auth token
const getAuthToken = () => {
  const userStr = localStorage.getItem('bt:user')
  if (!userStr) return null
  try {
    const user = JSON.parse(userStr)
    return user.token
  } catch {
    return null
  }
}

// Helper for API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'API request failed')
  }
  
  return data
}

// Classification APIs
export async function classifySingle(text: string){
  try {
    const result = await apiCall('/reviews/classifier/single', {
      method: 'POST',
      body: JSON.stringify({ text })
    })
    return result.data
  } catch (error) {
    console.error('Classification error:', error)
    throw error
  }
}

export async function classifyBatch(rows: Record<string, any>[]){
  try {
    const result = await apiCall('/reviews/classifier/batch', {
      method: 'POST',
      body: JSON.stringify({ reviews: rows })
    })
    return result.data
  } catch (error) {
    console.error('Batch classification error:', error)
    throw error
  }
}

// Dashboard APIs
export async function getDashboardMetrics(days = 30) {
  try {
    const result = await apiCall(`/dashboard/metrics?days=${days}`)
    return result.data
  } catch (error) {
    console.error('Dashboard metrics error:', error)
    return null
  }
}

export async function getDashboardOverview() {
  try {
    const result = await apiCall('/dashboard/overview')
    return result.data
  } catch (error) {
    console.error('Dashboard overview error:', error)
    return null
  }
}

// Review APIs
export async function getReviews(params?: { page?: number; limit?: number; sentiment?: string; brand?: string }) {
  try {
    const queryString = new URLSearchParams(params as any).toString()
    const result = await apiCall(`/reviews?${queryString}`)
    return result.data
  } catch (error) {
    console.error('Get reviews error:', error)
    return { reviews: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }
  }
}

export async function createReview(data: { text: string; productId: string; productName: string; brand: string }) {
  try {
    const result = await apiCall('/reviews', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return result.data
  } catch (error) {
    console.error('Create review error:', error)
    throw error
  }
}

// Schedule APIs
export const scheduleService = {
  async createSchedule(cadence: string, email: string, customDate?: string, customTime?: string) {
    try {
      const payload: any = { cadence, email }
      
      // Add custom date/time if provided
      if (customDate) payload.customDate = customDate
      if (customTime) payload.customTime = customTime
      
      const result = await apiCall('/schedules', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      return result
    } catch (error) {
      console.error('Create schedule error:', error)
      throw error
    }
  },

  async getSchedules() {
    try {
      const result = await apiCall('/schedules')
      return result.schedules || []
    } catch (error) {
      console.error('Get schedules error:', error)
      return []
    }
  },

  async deleteSchedule(id: string) {
    try {
      await apiCall(`/schedules/${id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Delete schedule error:', error)
      throw error
    }
  },

  async toggleSchedule(id: string) {
    try {
      const result = await apiCall(`/schedules/${id}/toggle`, {
        method: 'PATCH'
      })
      return result
    } catch (error) {
      console.error('Toggle schedule error:', error)
      throw error
    }
  }
}
