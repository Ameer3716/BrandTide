import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getReviews, getRecentActivity } from '../../controllers/reviewController.js'

vi.mock('../../models/Review.js', () => {
  const chainable = {
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    populate: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue([]),
    then: function(resolve) { resolve([{ id: 1 }]); }
  };
  return {
    default: {
      countDocuments: vi.fn(),
      find: vi.fn().mockReturnValue(chainable),
      insertMany: vi.fn()
    }
  }
})

vi.mock('../../models/BatchJob.js', () => ({
  default: {
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue([])
    })
  }
}))
import Review from '../../models/Review.js'

describe('Review Controller', () => {
  let mockReq, mockRes
  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = { user: { _id: '123456789012345678901234' }, query: {} }
    mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() }
  })

  describe('getReviews', () => {
    it('returns reviews successfully', async () => {
      Review.countDocuments.mockResolvedValue(1)
      await getReviews(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })
  })

  describe('getRecentActivity', () => {
    it('returns recent activity successfully', async () => {
      await getRecentActivity(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })
  })
})