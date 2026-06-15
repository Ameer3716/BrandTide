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