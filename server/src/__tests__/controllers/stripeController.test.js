import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCheckoutSession, cancelSubscription, handleWebhook } from '../../controllers/stripeController.js'

vi.mock('stripe', () => {
  return {
    default: class Stripe {
      checkout = {
        sessions: {
          create: vi.fn().mockResolvedValue({ id: '123', url: 'http://checkout.stripe.com' })
        }
      }
      customers = {
        create: vi.fn().mockResolvedValue({ id: 'cust_123' })
      }
      subscriptions = {
        update: vi.fn().mockResolvedValue({ current_period_end: 123456789 })
      }
      webhooks = {
        constructEvent: vi.fn().mockReturnValue({ type: 'invoice.payment_succeeded', data: { object: {} } })
      }
    }
  }
})

vi.mock('../../models/User.js', () => ({
  default: {
    findById: vi.fn()
  }
}))
import User from '../../models/User.js'

describe('Stripe Controller', () => {
  let mockReq, mockRes
  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = { user: { _id: '123456789012345678901234' }, body: { plan: 'pro' } }
    mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() }
  })

  describe('createCheckoutSession', () => {
    it('returns checkout url successfully', async () => {
      User.findById.mockResolvedValue({ email: 'test@test.com', _id: '123456789012345678901234', save: vi.fn(), toJSON: () => ({ email: 'test@test.com' }) })
      await createCheckoutSession(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { sessionId: '123', url: 'http://checkout.stripe.com' } }))
    })
  })

  describe('cancelSubscription', () => {
    it('cancels subscription successfully', async () => {
      User.findById.mockResolvedValue({ subscriptionId: 'sub_123' })
      await cancelSubscription(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })
  })

  describe('handleWebhook', () => {
    it('handles webhook successfully', async () => {
      mockReq.headers = { 'stripe-signature': 'sig' }
      mockRes.json = vi.fn().mockReturnThis()
      mockRes.send = vi.fn().mockReturnThis()
      await handleWebhook(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ received: true }))
    })
  })
})