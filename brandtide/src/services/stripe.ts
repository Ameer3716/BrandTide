// src/services/stripe.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

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

const authHeaders = () => {
  const token = getAuthToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export type Plan = 'free' | 'pro' | 'enterprise'

/**
 * Create a Stripe Checkout session and return the redirect URL
 */
export async function createCheckoutSession(plan: Plan): Promise<string> {
  const response = await fetch(`${API_URL}/stripe/create-checkout-session`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ plan })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create checkout session')
  }

  return data.data.url
}

/**
 * Get current subscription status
 */
export async function getSubscriptionStatus() {
  const response = await fetch(`${API_URL}/stripe/subscription-status`, {
    headers: authHeaders()
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch subscription status')
  }

  return data.data
}

/**
 * Cancel subscription at end of billing period
 */
export async function cancelSubscription() {
  const response = await fetch(`${API_URL}/stripe/cancel-subscription`, {
    method: 'POST',
    headers: authHeaders()
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to cancel subscription')
  }

  return data.data
}

/**
 * Create a Stripe Customer Portal session to manage billing
 */
export async function createPortalSession(): Promise<string> {
  const response = await fetch(`${API_URL}/stripe/create-portal-session`, {
    method: 'POST',
    headers: authHeaders()
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create portal session')
  }

  return data.data.url
}
