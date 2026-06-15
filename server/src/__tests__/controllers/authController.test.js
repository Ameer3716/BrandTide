import { describe, it, expect, vi, beforeEach } from 'vitest'
import { register, login } from '../../controllers/authController.js'

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mocked-token')
  }
}))

vi.mock('../../models/User.js', () => ({
  default: {
    findByEmail: vi.fn(),
    create: vi.fn().mockResolvedValue({ _id: '123', updateLastLogin: vi.fn(), toJSON: vi.fn().mockReturnValue({ _id: '123', name: 'Test' }) })
  }
}))
import User from '../../models/User.js'

describe('Auth Controller', () => {
  let mockReq, mockRes

  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = { body: {} }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis()
    }
  })

  describe('register', () => {
    it('returns 400 if user already exists', async () => {
      mockReq.body = { name: 'Test', email: 'test@example.com', password: 'password' }
      User.findByEmail.mockResolvedValue({ id: '123' })
      await register(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('registers user', async () => {
      mockReq.body = { name: 'Test', email: 'test@example.com', password: 'password' }
      User.findByEmail.mockResolvedValue(null)
      await register(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(201)
    })
  })

  describe('login', () => {
    it('returns 401 on invalid credentials', async () => {
      mockReq.body = { email: 'test@example.com', password: 'wrong' }
      User.findByEmail.mockResolvedValue(null)
      await login(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(401)
    })

    it('returns 200 on successful login', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password' }
      const mockUser = {
        _id: '123',
        isActive: true,
        comparePassword: vi.fn().mockResolvedValue(true),
        updateLastLogin: vi.fn(),
        populate: vi.fn().mockResolvedValue(true),
        toJSON: vi.fn().mockReturnValue({ _id: '123', name: 'Test' })
      }
      User.findByEmail.mockResolvedValue(mockUser)
      User.findById = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      })
      
      await login(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })
  })
})