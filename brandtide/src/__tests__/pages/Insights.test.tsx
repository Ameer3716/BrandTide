import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Insights from '@/pages/Insights'

vi.mock('@/services/data', () => ({
  dataService: {
    getMetrics: vi.fn().mockResolvedValue({ totalReviews: 100 }),
    getBrands: vi.fn().mockResolvedValue([]),
    getProducts: vi.fn().mockResolvedValue([]),
    getTopics: vi.fn().mockResolvedValue([]),
    getRepresentativeReviews: vi.fn().mockResolvedValue({ data: [], total: 0 })
  }
}))

describe('Insights Page', () => {
  it('renders insights header or loading', () => {
    render(<MemoryRouter><Insights /></MemoryRouter>)
    const loading = screen.queryByText(/Loading insights/i)
    const title = screen.queryByText(/AI Insights & Themes/i)
    expect(loading || title).toBeInTheDocument()
  })
})