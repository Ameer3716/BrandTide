import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Badge from '@/components/ui/Badge'

describe('Badge Component', () => {
  it('renders children correctly', () => {
    render(<Badge>Test Badge</Badge>)
    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })
})
