import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Batch from '@/pages/Batch'

describe('Batch Page', () => {
  it('renders batch uploader or loading', () => {
    render(<MemoryRouter><Batch /></MemoryRouter>)
    const loading = screen.queryByText(/Loading batch data/i)
    const title = screen.queryByText(/Batch Classification/i)
    expect(loading || title).toBeInTheDocument()
  })
})