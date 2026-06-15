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