import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Reviews from '@/pages/Reviews'

vi.mock('@/services/data', () => ({
  dataService: {
    getReviews: vi.fn().mockResolvedValue({ data: [], total: 0, pages: 1 }),
    getBrands: vi.fn().mockResolvedValue([]),
    getProducts: vi.fn().mockResolvedValue([]),
    getTopics: vi.fn().mockResolvedValue([])
  }
}))

describe('Reviews Page', () => {
  it('renders reviews header or loading', () => {
    render(<MemoryRouter><Reviews /></MemoryRouter>)
    const loading = screen.queryByText(/Loading reviews/i)
    const title = screen.queryByText(/Reviews Viewer/i)
    expect(loading || title).toBeInTheDocument()
  })
})