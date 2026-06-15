import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Landing from '@/pages/Landing'

vi.mock('lucide-react', () => ({
  ArrowRight: () => <div data-testid="icon" />,
  CheckCircle2: () => <div data-testid="icon" />,
  Sparkles: () => <div data-testid="icon" />,
  TrendingUp: () => <div data-testid="icon" />,
  BarChart3: () => <div data-testid="icon" />,
  FileText: () => <div data-testid="icon" />,
  Zap: () => <div data-testid="icon" />,
  Shield: () => <div data-testid="icon" />,
  Globe: () => <div data-testid="icon" />,
  Users: () => <div data-testid="icon" />,
  Star: () => <div data-testid="icon" />,
  ChevronRight: () => <div data-testid="icon" />,
  MessageSquare: () => <div data-testid="icon" />,
  Target: () => <div data-testid="icon" />,
  PieChart: () => <div data-testid="icon" />,
  Download: () => <div data-testid="icon" />,
  Calendar: () => <div data-testid="icon" />,
  Upload: () => <div data-testid="icon" />,
  Github: () => <div data-testid="icon" />,
  Linkedin: () => <div data-testid="icon" />,
  Mail: () => <div data-testid="icon" />,
  Loader2: () => <div data-testid="icon" />
}))

describe('Landing Page', () => {
  it('renders landing hero section', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>)
    expect(screen.getAllByText(/BrandTide/i)[0]).toBeInTheDocument()
  })
})