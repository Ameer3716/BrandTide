import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Skeleton from '@/components/ui/Skeleton'

describe('Skeleton Component', () => {
  it('renders with default class', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('animate-pulse')
    expect(container.firstChild).toHaveClass('h-6')
  })

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="h-10 w-10" />)
    expect(container.firstChild).toHaveClass('h-10 w-10')
  })
})
