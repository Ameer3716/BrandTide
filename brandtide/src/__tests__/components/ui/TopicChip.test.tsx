import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TopicChip from '@/components/ui/TopicChip'

describe('TopicChip Component', () => {
  it('renders label and count', () => {
    render(<TopicChip label="Quality" count={42} />)
    expect(screen.getByText('Quality')).toBeInTheDocument()
    expect(screen.getByText('(42)')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const onClick = vi.fn()
    render(<TopicChip label="Quality" count={42} onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('applies active styles when active is true', () => {
    render(<TopicChip label="Quality" count={42} active />)
    expect(screen.getByRole('button')).toHaveClass('bg-accent')
  })
})
