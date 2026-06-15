const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'brandtide', 'src', '__tests__', 'pages');

const tests = {
  'Dashboard.test.tsx': `
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
`,
  'Login.test.tsx': `
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Login from '@/pages/Login'

describe('Login Page', () => {
  it('renders login form', () => {
    render(<MemoryRouter><Login /></MemoryRouter>)
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument()
  })
})
`,
  'Register.test.tsx': `
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Register from '@/pages/Register'

describe('Register Page', () => {
  it('renders registration form', () => {
    render(<MemoryRouter><Register /></MemoryRouter>)
    expect(screen.getByRole('button', { name: /Create account/i })).toBeInTheDocument()
  })
})
`,
  'Batch.test.tsx': `
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
`,
  'Insights.test.tsx': `
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Insights from '@/pages/Insights'

vi.mock('@/services/data', () => ({
  dataService: {
    getMetrics: vi.fn().mockResolvedValue({ totalReviews: 100 }),
    getBrands: vi.fn().mockResolvedValue([]),
    getProducts: vi.fn().mockResolvedValue([]),
    getTopics: vi.fn().mockResolvedValue([])
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
`,
  'Reviews.test.tsx': `
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Reviews from '@/pages/Reviews'

describe('Reviews Page', () => {
  it('renders reviews header or loading', () => {
    render(<MemoryRouter><Reviews /></MemoryRouter>)
    const loading = screen.queryByText(/Loading reviews/i)
    const title = screen.queryByText(/Review Explorer/i)
    expect(loading || title).toBeInTheDocument()
  })
})
`,
  'Landing.test.tsx': `
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Landing from '@/pages/Landing'

vi.mock('lucide-react', () => {
  return new Proxy({}, {
    get: function(target, prop) {
      if (prop === '__esModule') return true;
      return () => <div data-testid="icon" />;
    }
  });
})

describe('Landing Page', () => {
  it('renders landing hero section', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>)
    expect(screen.getByText(/BrandTide/i)).toBeInTheDocument()
  })
})
`
};

for (const [filename, content] of Object.entries(tests)) {
  fs.writeFileSync(path.join(pagesDir, filename), content.trim());
}
console.log('Frontend page tests recreated.');
