import { describe, it, expect, vi, beforeEach } from 'vitest'
import { smartClassifySingle } from '../../controllers/agentController.js'

vi.mock('../../services/geminiAgent.js', () => ({
  geminiAgent: {
    cleanSingleText: vi.fn().mockResolvedValue({ isValidReview: true, cleanedText: 'test' })
  }
}))

vi.mock('../../models/Review.js', () => ({
  default: class Review {
    save = vi.fn().mockResolvedValue(true)
  }
}))

describe('Agent Controller', () => {
  let mockReq, mockRes
  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = { user: { _id: '123456789012345678901234' }, body: { text: 'good product' } }
    mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: { label: 'positive', confidence: 0.9 } })
    })
  })

  describe('smartClassifySingle', () => {
    it('returns classification successfully', async () => {
      await smartClassifySingle(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })
  })
})