import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import GlassCard from '@/components/ui/GlassCard'

describe('GlassCard Component', () => {
  it('renders children correctly', () => {
    render(<GlassCard>Content</GlassCard>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<GlassCard className="custom-class">Content</GlassCard>)
    expect(container.firstChild).toHaveClass('custom-class')
    expect(container.firstChild).toHaveClass('bg-white')
  })
})
