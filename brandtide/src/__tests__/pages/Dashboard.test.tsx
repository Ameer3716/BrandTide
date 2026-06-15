import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'

vi.mock('@/services/data', () => ({
  dataService: {
    getMetrics: vi.fn().mockResolvedValue({ totalReviews: 100 }),
    getSentimentTrend: vi.fn().mockResolvedValue([]),
    getTopProducts: vi.fn().mockResolvedValue({ pos: [], neg: [] })
  }
}))

describe('Dashboard Page', () => {
  it('renders loading state initially', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument()
  })
})