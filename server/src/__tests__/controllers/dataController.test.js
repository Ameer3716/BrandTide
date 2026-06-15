import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMetrics, getProducts, getSentimentTrend } from '../../controllers/dataController.js'

vi.mock('../../models/Review.js', () => ({
  default: {
    aggregate: vi.fn()
  }
}))

vi.mock('../../models/SentimentData.js', () => ({
  default: {
    find: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([])
    })
  }
}))
import Review from '../../models/Review.js'

describe('Data Controller', () => {
  let mockReq, mockRes
  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = { user: { _id: '123456789012345678901234' }, query: {} }
    mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() }
  })

  describe('getMetrics', () => {
    it('returns metrics successfully', async () => {
      Review.aggregate.mockResolvedValueOnce([{ _id: 'Positive', count: 60 }, { _id: 'Negative', count: 40 }])
      Review.aggregate.mockResolvedValueOnce([{ brandsCount: 5, productsCount: 10 }])
      await getMetrics(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })

    it('handles errors', async () => {
      Review.aggregate.mockRejectedValue(new Error('DB Error'))
      await getMetrics(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(500)
    })
  })

  describe('getProducts', () => {
    it('returns products successfully', async () => {
      Review.aggregate.mockResolvedValue([{ _id: { product: 'Phone', brand: 'Apple' }, posCount: 10, negCount: 5 }])
      await getProducts(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })
  })

  describe('getSentimentTrend', () => {
    it('returns sentiment trend successfully', async () => {
      Review.aggregate.mockResolvedValue([{ _id: { year: 2023, month: 5 }, posCount: 1, negCount: 0 }])
      await getSentimentTrend(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })
  })
})