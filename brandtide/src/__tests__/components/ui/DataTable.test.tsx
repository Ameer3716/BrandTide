import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import DataTable from '@/components/ui/DataTable'

describe('DataTable Component', () => {
  const columns = [
    { key: 'name', label: 'Product Name' },
    { key: 'count', label: 'Mentions' }
  ]
  const records = [
    { name: 'Alpha', count: 10 },
    { name: 'Beta', count: 5 }
  ]

  it('renders table headers', () => {
    render(<DataTable columns={columns} records={records as any} />)
    expect(screen.getByText('Product Name')).toBeInTheDocument()
    expect(screen.getByText('Mentions')).toBeInTheDocument()
  })

  it('renders table data records', () => {
    render(<DataTable columns={columns} records={records as any} />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
