import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MetricCard from '@/components/ui/MetricCard'

describe('MetricCard Component', () => {
  it('renders label and value', () => {
    render(<MetricCard label="Total Sales" value="$1,000" />)
    expect(screen.getByText('Total Sales')).toBeInTheDocument()
    expect(screen.getByText('$1,000')).toBeInTheDocument()
  })

  it('renders positive delta correctly', () => {
    render(<MetricCard label="Total Sales" value="$1,000" delta={12.5} />)
    expect(screen.getByText('+12.5%')).toBeInTheDocument()
  })

  it('renders negative delta correctly', () => {
    render(<MetricCard label="Total Sales" value="$1,000" delta={-5.2} />)
    expect(screen.getByText('-5.2%')).toBeInTheDocument()
  })
})
