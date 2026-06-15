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

// ── Error Types ──────────────────────────────────────────────────────────────

export interface AgentError {
  code: string
  message: string
  userMessage: string
  suggestion: string
  severity: 'error' | 'warning' | 'info'
}

// Map backend error codes to user-friendly display info
const ERROR_MAP: Record<string, { icon: string; color: string; suggestion: string }> = {
  INVALID_API_KEY: {
    icon: '🔑',
    color: 'red',
    suggestion: 'Contact the administrator to configure the AI service API key.'
  },
  QUOTA_EXCEEDED: {
    icon: '⏳',
    color: 'yellow',
    suggestion: 'Wait a few minutes and try again, or process fewer rows at a time.'
  },
  NETWORK_ERROR: {
    icon: '🌐',
    color: 'red',
    suggestion: 'Check your internet connection and try again.'
  },
  PARSE_ERROR: {
    icon: '⚠️',
    color: 'yellow',
    suggestion: 'Try rephrasing your input or uploading a differently formatted file.'
  },
  TIMEOUT: {
    icon: '⏱️',
    color: 'yellow',
    suggestion: 'Try with fewer rows or shorter text.'
  },
  INVALID_DATA: {
    icon: '📄',
    color: 'red',
    suggestion: 'Check that your data contains valid review text.'
  },
  GEMINI_UNAVAILABLE: {
    icon: '🤖',
    color: 'yellow',
    suggestion: 'The AI cleaning service is temporarily unavailable. Standard processing will be used instead.'
  },
  VALIDATION_ERROR: {
    icon: '✏️',
    color: 'red',
    suggestion: 'Please provide valid input data.'
  },
  ML_SERVICE_DOWN: {
    icon: '🔬',
    color: 'red',
    suggestion: 'The sentiment classification service is unavailable. Please try again later.'
  },
  AUTH_ERROR: {
    icon: '🔒',
    color: 'red',
    suggestion: 'Please log in to use the AI Agent.'
  }
}

export function mapError(backendError: any): AgentError {
  const code = backendError?.code || 'UNKNOWN'
  const info = ERROR_MAP[code] || { icon: '❌', color: 'red', suggestion: 'Please try again.' }

  return {
    code,
    message: backendError?.message || 'An unexpected error occurred',
    userMessage: backendError?.userMessage || backendError?.message || 'Something went wrong',
    suggestion: backendError?.suggestion || info.suggestion,
    severity: info.color === 'red' ? 'error' : info.color === 'yellow' ? 'warning' : 'info'
  }
}

// ── Response Types ───────────────────────────────────────────────────────────

export interface SmartSingleResult {
  original: string
  cleaned: string
  modifications: string[]
  sentiment: {
    label: string
    confidence: number
    scores: Record<string, number>
  }
  metadata: {
    brand: string
    product: string
    language: string
    topic: string
    isValidReview: boolean
  }
  report: {
    issues: string[]
    geminiUsed: boolean
  }
}

export interface SmartBatchResult {
  data: Array<Record<string, any>>
  report: {
    totalInput: number
    totalProcessed: number
    totalSkipped: number
    skippedDetails: Array<{ row: number; reason: string }>
    columnMapping: Record<string, string>
    modifications: string[]
    warnings: string[]
    missingDataHandling: string[]
  }
  saved: {
    count: number
    breakdown: { Positive: number; Neutral: number; Negative: number }
  }
}

// ── API Calls ────────────────────────────────────────────────────────────────

export async function smartClassifySingle(rawText: string): Promise<SmartSingleResult> {
  const token = getAuthToken()
  if (!token) {
    throw {
      code: 'AUTH_ERROR',
      message: 'Authentication required',
      userMessage: 'Please log in to use the AI Agent',
      suggestion: 'Sign in with your account first.'
    }
  }

  const response = await fetch(`${API_URL}/agent/smart-classify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text: rawText })
  })

  const data = await response.json()

  if (!response.ok) {
    throw {
      code: data.code || 'UNKNOWN',
      message: data.message || 'Request failed',
      userMessage: data.userMessage || data.message || 'Smart classification failed',
      suggestion: data.suggestion || 'Please try again.'
    }
  }

  return data.data
}

export async function smartClassifyBatch(rows: Record<string, any>[]): Promise<SmartBatchResult> {
  const token = getAuthToken()
  if (!token) {
    throw {
      code: 'AUTH_ERROR',
      message: 'Authentication required',
      userMessage: 'Please log in to use the AI Agent',
      suggestion: 'Sign in with your account first.'
    }
  }

  const response = await fetch(`${API_URL}/agent/smart-batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ reviews: rows })
  })

  const data = await response.json()

  if (!response.ok) {
    throw {
      code: data.code || 'UNKNOWN',
      message: data.message || 'Request failed',
      userMessage: data.userMessage || data.message || 'Smart batch classification failed',
      suggestion: data.suggestion || 'Please try again.'
    }
  }

  return {
    data: data.data,
    report: data.report,
    saved: data.saved
  }
}
